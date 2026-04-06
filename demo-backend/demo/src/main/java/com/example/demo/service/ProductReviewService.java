package com.example.demo.service;

import com.example.demo.model.ProductReview;
import com.example.demo.repository.ProductReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ProductReviewService {

    private final ProductReviewRepository productReviewRepository;
    private static final Path REVIEW_UPLOAD_DIR = Paths.get("uploads", "reviews");

    public ProductReviewService(ProductReviewRepository productReviewRepository) {
        this.productReviewRepository = productReviewRepository;
    }

    public ProductReview submitProductReview(ProductReview review) {
        validate(review);
        if (review.getCreatedAt() == null) {
            review.setCreatedAt(LocalDateTime.now());
        }
        return productReviewRepository.save(review);
    }

    public ProductReview submitProductReviewWithMedia(
            Long userId,
            Long productId,
            Integer rating,
            String comment,
            MultipartFile mediaFile
    ) {
        ProductReview review = new ProductReview();
        review.setUserId(userId);
        review.setProductId(productId);
        review.setRating(rating);
        review.setComment(comment);

        if (mediaFile != null && !mediaFile.isEmpty()) {
            attachMedia(review, mediaFile);
        }

        return submitProductReview(review);
    }

    public List<ProductReview> getReviewsByProductId(Long productId) {
        return productReviewRepository.findByProductId(productId);
    }

    public List<ProductReview> getReviewsByUserId(Long userId) {
        return productReviewRepository.findByUserId(userId);
    }

    private void validate(ProductReview review) {
        if (review.getUserId() == null) {
            throw new IllegalArgumentException("User ID is required");
        }
        if (review.getProductId() == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        if (review.getRating() == null) {
            throw new IllegalArgumentException("Rating is required");
        }
        if (review.getRating() < 1 || review.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
    }

    private void attachMedia(ProductReview review, MultipartFile mediaFile) {
        String contentType = mediaFile.getContentType() == null
                ? ""
                : mediaFile.getContentType().toLowerCase(Locale.ROOT);

        boolean isImage = contentType.startsWith("image/");
        boolean isVideo = contentType.startsWith("video/");
        if (!isImage && !isVideo) {
            throw new IllegalArgumentException("Only image/video uploads are allowed");
        }

        try {
            Files.createDirectories(REVIEW_UPLOAD_DIR);

            String original = mediaFile.getOriginalFilename() == null ? "file" : mediaFile.getOriginalFilename();
            String extension = "";
            int dot = original.lastIndexOf('.');
            if (dot >= 0 && dot < original.length() - 1) {
                extension = original.substring(dot);
            }

            String fileName = UUID.randomUUID() + extension;
            Path target = REVIEW_UPLOAD_DIR.resolve(fileName).normalize();
            Files.copy(mediaFile.getInputStream(), target);

            review.setMediaType(isVideo ? "VIDEO" : "IMAGE");
            review.setMediaUrl("/api/product-reviews/media/" + fileName);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store uploaded media", e);
        }
    }

    public void deleteProductReview(Long id, Long userId) {
        productReviewRepository.findById(id).ifPresent(review -> {
            if (!review.getUserId().equals(userId)) {
                throw new IllegalArgumentException("You can only delete your own reviews");
            }
            if (review.getMediaUrl() != null) {
                String fileName = review.getMediaUrl().replace("/api/product-reviews/media/", "");
                try {
                    Files.deleteIfExists(REVIEW_UPLOAD_DIR.resolve(fileName).normalize());
                } catch (IOException e) {
                    // ignore file deletion failure
                }
            }
            productReviewRepository.delete(review);
        });
    }
}

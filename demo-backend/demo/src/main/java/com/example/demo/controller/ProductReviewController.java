package com.example.demo.controller;

import com.example.demo.model.ProductReview;
import com.example.demo.service.ProductReviewService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/product-reviews")
@CrossOrigin(origins = "*")
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    public ProductReviewController(ProductReviewService productReviewService) {
        this.productReviewService = productReviewService;
    }

    @PostMapping
    public ProductReview submitProductReview(@RequestBody ProductReview review) {
        return productReviewService.submitProductReview(review);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductReview submitProductReviewWithMedia(
            @RequestParam("userId") Long userId,
            @RequestParam("productId") Long productId,
            @RequestParam("rating") Integer rating,
            @RequestParam(value = "comment", required = false) String comment,
            @RequestParam(value = "media", required = false) MultipartFile media
    ) {
        return productReviewService.submitProductReviewWithMedia(userId, productId, rating, comment, media);
    }

    @GetMapping("/product/{productId}")
    public List<ProductReview> getReviewsByProductId(@PathVariable Long productId) {
        return productReviewService.getReviewsByProductId(productId);
    }

    @GetMapping("/user/{userId}")
    public List<ProductReview> getReviewsByUserId(@PathVariable Long userId) {
        return productReviewService.getReviewsByUserId(userId);
    }

    @GetMapping("/media/{fileName:.+}")
    public ResponseEntity<Resource> getReviewMedia(@PathVariable String fileName) throws MalformedURLException {
        Path mediaPath = Paths.get("uploads", "reviews", fileName).normalize();
        Resource resource = new UrlResource(mediaPath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            mediaType = MediaType.IMAGE_JPEG;
        } else if (lower.endsWith(".png")) {
            mediaType = MediaType.IMAGE_PNG;
        } else if (lower.endsWith(".gif")) {
            mediaType = MediaType.IMAGE_GIF;
        } else if (lower.endsWith(".webp")) {
            mediaType = MediaType.parseMediaType("image/webp");
        } else if (lower.endsWith(".mp4")) {
            mediaType = MediaType.parseMediaType("video/mp4");
        } else if (lower.endsWith(".webm")) {
            mediaType = MediaType.parseMediaType("video/webm");
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(resource);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id, @RequestParam Long userId) {
        productReviewService.deleteProductReview(id, userId);
    }
}

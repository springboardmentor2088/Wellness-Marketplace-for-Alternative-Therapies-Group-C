package com.example.demo.service;

import com.example.demo.dto.PractitionerProductRequest;
import com.example.demo.model.Product;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Service
public class ProductService {

    private static final Path PRODUCT_UPLOAD_DIR = Paths.get("uploads", "products");

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public ProductService(ProductRepository productRepository, OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    public List<Product> getAllProducts() {
        // Prefer showing practitioner-owned products (new catalog).
        // Legacy seed products (without practitioner_id) may still exist in DB,
        // especially when orders exist and we avoid destructive reseeds.
        List<Product> products;
        if (productRepository.countByPractitionerIdIsNotNull() > 0) {
            products = productRepository.findByPractitionerIdIsNotNull();
        } else {
            products = productRepository.findAll();
        }

        // Ayurveda-related products are not part of this application.
        return products.stream()
                .filter(p -> !isAyurvedaProduct(p))
                .toList();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    public List<Product> getPractitionerProducts(Long practitionerProfileId) {
        return productRepository.findByPractitionerId(practitionerProfileId)
                .stream()
                .filter(p -> !isAyurvedaProduct(p))
                .toList();
    }

    public Product addPractitionerProduct(Long practitionerProfileId, PractitionerProductRequest request) {
        return addPractitionerProduct(practitionerProfileId, request, null);
    }

    public Product addPractitionerProduct(Long practitionerProfileId, PractitionerProductRequest request, MultipartFile imageFile) {
        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product name is required");
        }

        BigDecimal price = request.getPrice();
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product price must be greater than zero");
        }

        Integer stock = request.getStock();
        if (stock == null || stock < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stock must be zero or greater");
        }

        Product product = new Product();
        product.setName(uniqueName(name, practitionerProfileId));
        product.setDescription(request.getDescription());
        product.setPrice(price);
        product.setCategory(request.getCategory());
        product.setStock(stock);
        String imageUrl = request.getImageUrl();
        if (imageFile != null && !imageFile.isEmpty()) {
            imageUrl = storeProductImage(imageFile);
        }
        product.setImageUrl(imageUrl);
        product.setPractitionerId(practitionerProfileId);

        return productRepository.save(product);
    }

    public String deletePractitionerProduct(Long practitionerProfileId, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + productId));

        if (product.getPractitionerId() == null || !product.getPractitionerId().equals(practitionerProfileId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can delete only your own products");
        }

        if (orderRepository.existsByProductId(productId)) {
            // Keep purchased product rows for order history; remove seller mapping so it disappears from active catalog.
            product.setPractitionerId(null);
            product.setStock(0);
            if (product.getName() != null && !product.getName().startsWith("[REMOVED] ")) {
                product.setName("[REMOVED] " + product.getName());
            }
            productRepository.save(product);
            return "Product removed from your catalog. Existing purchase records are preserved.";
        }

        deleteStoredImageIfAny(product.getImageUrl());
        productRepository.delete(product);
        return "Product deleted successfully.";
    }

    private String storeProductImage(MultipartFile imageFile) {
        String contentType = imageFile.getContentType() == null
                ? ""
                : imageFile.getContentType().toLowerCase(Locale.ROOT);

        if (!contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image uploads are allowed");
        }

        try {
            Files.createDirectories(PRODUCT_UPLOAD_DIR);

            String original = imageFile.getOriginalFilename() == null ? "file" : imageFile.getOriginalFilename();
            String extension = "";
            int dot = original.lastIndexOf('.');
            if (dot >= 0 && dot < original.length() - 1) {
                extension = original.substring(dot);
            }

            String fileName = UUID.randomUUID() + extension;
            Path target = PRODUCT_UPLOAD_DIR.resolve(fileName).normalize();
            Files.copy(imageFile.getInputStream(), target);

            return "/api/products/media/" + fileName;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store product image", ex);
        }
    }

    private void deleteStoredImageIfAny(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/api/products/media/")) {
            return;
        }

        String fileName = imageUrl.replace("/api/products/media/", "");
        try {
            Files.deleteIfExists(PRODUCT_UPLOAD_DIR.resolve(fileName).normalize());
        } catch (IOException ignored) {
            // Ignore cleanup failures.
        }
    }

    private String uniqueName(String requestedName, Long practitionerProfileId) {
        String candidate = requestedName;
        if (!productRepository.existsByNameIgnoreCase(candidate)) {
            return candidate;
        }

        candidate = requestedName + " (Seller " + practitionerProfileId + ")";
        if (!productRepository.existsByNameIgnoreCase(candidate)) {
            return candidate;
        }

        int index = 2;
        while (productRepository.existsByNameIgnoreCase(candidate + " #" + index)) {
            index++;
        }
        return candidate + " #" + index;
    }

    private static boolean isAyurvedaProduct(Product product) {
        if (product == null) return false;
        return isAyurvedaText(product.getCategory()) || isAyurvedaText(product.getName());
    }

    private static boolean isAyurvedaText(String text) {
        if (text == null) return false;
        return text.toLowerCase().contains("ayur");
    }

}

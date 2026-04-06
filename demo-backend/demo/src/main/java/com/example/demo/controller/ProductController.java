package com.example.demo.controller;

import com.example.demo.dto.PractitionerProductRequest;
import com.example.demo.model.PractitionerProfile;
import com.example.demo.model.Product;
import com.example.demo.model.VerificationStatus;
import com.example.demo.repository.PractitionerProfileRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ProductService;
import com.example.demo.service.ProductCatalogService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;

    private final ProductCatalogService productCatalogService;

    private final UserRepository userRepository;

    private final PractitionerProfileRepository practitionerProfileRepository;

    public ProductController(ProductService productService,
                             ProductCatalogService productCatalogService,
                             UserRepository userRepository,
                             PractitionerProfileRepository practitionerProfileRepository) {
        this.productService = productService;
        this.productCatalogService = productCatalogService;
        this.userRepository = userRepository;
        this.practitionerProfileRepository = practitionerProfileRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{productId}")
    public ResponseEntity<?> getProductById(@PathVariable Long productId) {
        Product product = productService.getProductById(productId);

        if (product == null) {
            return ResponseEntity.status(404).body("Product not found with id: " + productId);
        }

        return ResponseEntity.ok(product);
    }

    @PostMapping("/auto-assign-sellers")
    public ResponseEntity<?> autoAssignSellers() {
        String msg = productCatalogService.reseedCatalogFromPractitionerSpecializations(true);
        return ResponseEntity.ok(msg);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Product>> getMyProducts() {
        PractitionerProfile profile = getAuthenticatedVerifiedPractitionerProfile();
        return ResponseEntity.ok(productService.getPractitionerProducts(profile.getId()));
    }

    @PostMapping("/my")
    public ResponseEntity<Product> addMyProduct(@RequestBody PractitionerProductRequest request) {
        PractitionerProfile profile = getAuthenticatedVerifiedPractitionerProfile();
        Product created = productService.addPractitionerProduct(profile.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(value = "/my/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Product> addMyProductWithImage(
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("price") java.math.BigDecimal price,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "stock", required = false) Integer stock,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        PractitionerProfile profile = getAuthenticatedVerifiedPractitionerProfile();

        PractitionerProductRequest request = new PractitionerProductRequest();
        request.setName(name);
        request.setDescription(description);
        request.setPrice(price);
        request.setCategory(category);
        request.setStock(stock == null ? 0 : stock);

        Product created = productService.addPractitionerProduct(profile.getId(), request, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/my/{productId}")
    public ResponseEntity<String> deleteMyProduct(@PathVariable Long productId) {
        PractitionerProfile profile = getAuthenticatedVerifiedPractitionerProfile();
        String msg = productService.deletePractitionerProduct(profile.getId(), productId);
        return ResponseEntity.ok(msg);
    }

    @GetMapping("/media/{fileName:.+}")
    public ResponseEntity<Resource> getProductMedia(@PathVariable String fileName) throws MalformedURLException {
        Path base = Paths.get("uploads", "products").toAbsolutePath().normalize();
        Path mediaPath = base.resolve(fileName).normalize();
        if (!mediaPath.startsWith(base)) {
            return ResponseEntity.badRequest().build();
        }

        Resource resource = new UrlResource(mediaPath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            String probedType = Files.probeContentType(mediaPath);
            if (probedType != null) {
                mediaType = MediaType.parseMediaType(probedType);
            }
        } catch (IOException ignored) {
            // Fallback content-type will be used.
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(resource);
    }

    private PractitionerProfile getAuthenticatedVerifiedPractitionerProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        Object principal = auth.getPrincipal();
        String email;
        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            email = String.valueOf(principal);
        }

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        PractitionerProfile profile = practitionerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Practitioner profile not found"));

        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only verified practitioners can manage products");
        }

        return profile;
    }
}



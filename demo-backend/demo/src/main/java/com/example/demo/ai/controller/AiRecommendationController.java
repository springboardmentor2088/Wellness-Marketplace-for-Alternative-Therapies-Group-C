package com.example.demo.ai.controller;

import com.example.demo.ai.dto.AiRecommendationRequest;
import com.example.demo.ai.dto.AiRecommendationResponse;
import com.example.demo.ai.service.AiRecommendationService;
import com.example.demo.model.User;
import com.example.demo.notification.service.NotificationService;
import com.example.demo.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public AiRecommendationController(AiRecommendationService aiRecommendationService,
                                      NotificationService notificationService,
                                      UserRepository userRepository) {
        this.aiRecommendationService = aiRecommendationService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @PostMapping("/recommend")
    public ResponseEntity<AiRecommendationResponse> recommend(@RequestBody AiRecommendationRequest request) {
        AiRecommendationResponse response = aiRecommendationService.recommend(request);

        User user = getAuthenticatedUser();
        if (user != null) {
            notificationService.createAiRecommendationNotification(user, response.getRecommendation());
        }

        return ResponseEntity.ok(response);
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(email).orElse(null);
    }
}

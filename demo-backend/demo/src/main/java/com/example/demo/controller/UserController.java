package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.notification.service.NotificationService;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.demo.service.TherapySessionService;
import com.example.demo.model.TherapySession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    TherapySessionService sessionService;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    NotificationService notificationService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(@RequestParam(value = "email", required = false) String email) {
        User user = resolveAuthenticatedUser(email);
        if (user == null) {
            return ResponseEntity.status(403).body("email does not match authenticated user");
        }

        Map<String, Object> resp = new HashMap<>();
        List<TherapySession> sessions = sessionService.getSessionsForUser(user);
        notificationService.syncUpcomingSessionNotifications(sessions);

        resp.put("userProfile", user);
        resp.put("sessionHistory", sessions);
        resp.put("productOrders", orderRepository.findByUserId(user.getId()));
        resp.put("notifications", notificationService.getNotificationsByUserId(user.getId().longValue()));

        return ResponseEntity.ok(resp);
    }

    private User resolveAuthenticatedUser(String email) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String authEmail = authentication.getName();
        if (email != null && !email.isBlank() && !email.equalsIgnoreCase(authEmail)) {
            return null;
        }
        return userRepository.findByEmail(authEmail).orElseThrow();
    }
}

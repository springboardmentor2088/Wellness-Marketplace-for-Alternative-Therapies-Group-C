package com.example.demo.ai.service;

import com.example.demo.ai.dto.AiRecommendationRequest;
import com.example.demo.ai.dto.ChatAnswerResponse;
import com.example.demo.ai.dto.ChatStartResponse;
import com.example.demo.ai.model.ChatSessionState;
import com.example.demo.model.User;
import com.example.demo.notification.service.NotificationService;
import com.example.demo.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatbotService {

    private final AiRecommendationService aiRecommendationService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final Map<String, ChatSessionState> sessions = new ConcurrentHashMap<>();

    public ChatbotService(AiRecommendationService aiRecommendationService,
                          NotificationService notificationService,
                          UserRepository userRepository) {
        this.aiRecommendationService = aiRecommendationService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public ChatStartResponse start() {
        String sessionId = UUID.randomUUID().toString();
        ChatSessionState state = new ChatSessionState();
        User user = getAuthenticatedUser();
        if (user != null) {
            state.setUserId(user.getId());
        }
        state.setStep(1);
        sessions.put(sessionId, state);

        return new ChatStartResponse(sessionId, "What symptoms do you have?", 1);
    }

    public ChatAnswerResponse answer(String sessionId, String answer) {
        ChatSessionState state = sessions.get(sessionId);
        if (state == null) {
            ChatAnswerResponse invalid = new ChatAnswerResponse();
            invalid.setSessionId(sessionId);
            invalid.setCompleted(true);
            invalid.setRecommendation("Invalid or expired session. Please start again.");
            return invalid;
        }

        User currentUser = getAuthenticatedUser();
        if (state.getUserId() != null && currentUser != null && !state.getUserId().equals(currentUser.getId())) {
            ChatAnswerResponse invalid = new ChatAnswerResponse();
            invalid.setSessionId(sessionId);
            invalid.setCompleted(true);
            invalid.setRecommendation("This chat session belongs to another user. Please start again.");
            return invalid;
        }

        int step = state.getStep();
        String normalized = answer == null ? "" : answer.trim();

        if (step == 1) {
            state.setSymptoms(normalized);
            state.setStep(2);
            return next(sessionId, 2, "What is the severity level? (low/medium/high)");
        }

        if (step == 2) {
            state.setSeverityLevel(normalized);
            state.setStep(3);
            return next(sessionId, 3, "How long have you had this issue?");
        }

        if (step == 3) {
            state.setDuration(normalized);
            state.setStep(4);
            return next(sessionId, 4, "Any additional symptoms?");
        }

        state.setAdditionalSymptoms(normalized);

        AiRecommendationRequest req = new AiRecommendationRequest();
        req.setSymptoms(state.getSymptoms());
        req.setSeverityLevel(state.getSeverityLevel());
        req.setDuration(state.getDuration());
        req.setAdditionalSymptoms(state.getAdditionalSymptoms());

        String recommendation = aiRecommendationService.recommend(req).getRecommendation();
        if (currentUser != null) {
            notificationService.createAiRecommendationNotification(currentUser, recommendation);
        }
        sessions.remove(sessionId);

        ChatAnswerResponse done = new ChatAnswerResponse();
        done.setSessionId(sessionId);
        done.setStep(5);
        done.setCompleted(true);
        done.setRecommendation(recommendation);
        return done;
    }

    private ChatAnswerResponse next(String sessionId, int step, String question) {
        ChatAnswerResponse response = new ChatAnswerResponse();
        response.setSessionId(sessionId);
        response.setStep(step);
        response.setCompleted(false);
        response.setQuestion(question);
        return response;
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

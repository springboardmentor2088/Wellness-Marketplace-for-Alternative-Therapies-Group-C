package com.example.demo.recommendation.service;

import com.example.demo.recommendation.dto.RecommendationRequest;
import com.example.demo.recommendation.model.Recommendation;
import com.example.demo.recommendation.repository.RecommendationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;

    public RecommendationService(RecommendationRepository recommendationRepository) {
        this.recommendationRepository = recommendationRepository;
    }

    public Recommendation generateRecommendation(RecommendationRequest request) {
        String symptom = request.getSymptom();
        String suggestedTherapy = suggestTherapy(symptom);

        Recommendation recommendation = new Recommendation();
        recommendation.setUserId(request.getUserId());
        recommendation.setSymptom(symptom);
        recommendation.setSuggestedTherapy(suggestedTherapy);
        recommendation.setSourceAPI("INTERNAL_RULE_ENGINE");
        recommendation.setTimestamp(LocalDateTime.now());

        return recommendationRepository.save(recommendation);
    }

    public List<Recommendation> getRecommendationsByUserId(Long userId) {
        return recommendationRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    private String suggestTherapy(String symptom) {
        if (symptom == null || symptom.trim().isEmpty()) {
            return "General Wellness Consultation";
        }

        String value = symptom.toLowerCase();

        if (value.contains("stress") || value.contains("anxiety") || value.contains("tension")) {
            return "Meditation Therapy";
        } else if (value.contains("back pain") || value.contains("joint pain") || value.contains("neck pain")) {
            return "Physiotherapy";
        } else if (value.contains("digestion") || value.contains("stomach") || value.contains("acidity")) {
            return "Ayurveda";
        } else if (value.contains("body pain") || value.contains("muscle pain") || value.contains("migraine")) {
            return "Acupuncture";
        } else if (value.contains("posture") || value.contains("spine")) {
            return "Chiropractic Therapy";
        } else {
            return "General Wellness Consultation";
        }
    }
}

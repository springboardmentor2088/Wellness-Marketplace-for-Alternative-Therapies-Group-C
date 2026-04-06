package com.example.demo.recommendation.dto;

public class RecommendationRequest {

    private Long userId;
    private String symptom;

    public RecommendationRequest() {
    }

    public RecommendationRequest(Long userId, String symptom) {
        this.userId = userId;
        this.symptom = symptom;
    }

    public Long getUserId() {
        return userId;
    }

    public String getSymptom() {
        return symptom;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setSymptom(String symptom) {
        this.symptom = symptom;
    }
}

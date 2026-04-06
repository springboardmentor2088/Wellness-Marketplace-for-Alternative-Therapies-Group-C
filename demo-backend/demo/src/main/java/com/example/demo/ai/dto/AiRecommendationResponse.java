package com.example.demo.ai.dto;

public class AiRecommendationResponse {

    private String recommendation;
    private String source;

    public AiRecommendationResponse() {
    }

    public AiRecommendationResponse(String recommendation, String source) {
        this.recommendation = recommendation;
        this.source = source;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}

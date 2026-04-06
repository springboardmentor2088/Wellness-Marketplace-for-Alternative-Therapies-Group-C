package com.example.demo.ai.dto;

public class AiRecommendationRequest {

    private String symptoms;
    private String severityLevel;
    private String duration;
    private String additionalSymptoms;

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getSeverityLevel() {
        return severityLevel;
    }

    public void setSeverityLevel(String severityLevel) {
        this.severityLevel = severityLevel;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getAdditionalSymptoms() {
        return additionalSymptoms;
    }

    public void setAdditionalSymptoms(String additionalSymptoms) {
        this.additionalSymptoms = additionalSymptoms;
    }
}

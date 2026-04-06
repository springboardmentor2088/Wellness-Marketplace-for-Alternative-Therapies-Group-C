package com.example.demo.integration.openfda;

import java.util.List;

public class RecommendationResponse {

    private String symptom;
    private String message;
    private List<String> suggestions;

    public RecommendationResponse() {
    }

    public RecommendationResponse(String symptom, String message, List<String> suggestions) {
        this.symptom = symptom;
        this.message = message;
        this.suggestions = suggestions;
    }

    public String getSymptom() {
        return symptom;
    }

    public void setSymptom(String symptom) {
        this.symptom = symptom;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }
}

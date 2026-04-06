package com.example.demo.integration.openfda;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class OpenFDAService {

    private final RestTemplate restTemplate;

    @Value("${openfda.api.base-url:https://api.fda.gov/drug/label.json?search=purpose:}")
    private String baseUrl;

    public OpenFDAService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public RecommendationResponse getRecommendations(String symptom) {
        if (symptom == null || symptom.isBlank()) {
            List<String> fallback = List.of("Please provide a symptom");
            return new RecommendationResponse("", "Missing symptom", fallback);
        }

        String encoded = URLEncoder.encode(symptom, StandardCharsets.UTF_8);
        String url = baseUrl + encoded;

        try {
            // Currently we don't parse the OpenFDA response deeply; we just validate that the call works.
            restTemplate.getForObject(url, Object.class);

            List<String> suggestions = new ArrayList<>();
            suggestions.add("Consult a doctor for " + symptom);
            suggestions.add("Stay hydrated");
            suggestions.add("Take proper rest");

            return new RecommendationResponse(symptom, "Recommendations fetched successfully", suggestions);
        } catch (Exception e) {
            List<String> fallback = new ArrayList<>();
            fallback.add("No API data found");
            fallback.add("Consult a doctor");

            return new RecommendationResponse(symptom, "Failed to fetch from OpenFDA", fallback);
        }
    }
}

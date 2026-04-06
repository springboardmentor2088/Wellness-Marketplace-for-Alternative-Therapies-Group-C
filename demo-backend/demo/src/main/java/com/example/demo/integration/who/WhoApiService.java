package com.example.demo.integration.who;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class WhoApiService {

    private final RestTemplate restTemplate;

    @Value("${who.api.base-url:}")
    private String whoApiBaseUrl;

    public WhoApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String fetchWhoHealthData(String symptom) {
        if (whoApiBaseUrl == null || whoApiBaseUrl.isBlank()) {
            return "WHO API base URL is not configured (who.api.base-url)";
        }

        if (symptom == null || symptom.isBlank()) {
            return "Please provide a symptom";
        }

        try {
            String url = whoApiBaseUrl + URLEncoder.encode(symptom, StandardCharsets.UTF_8);

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

            return "No WHO data found for symptom: " + symptom;
        } catch (Exception e) {
            return "Error while calling WHO API: " + e.getMessage();
        }
    }
}

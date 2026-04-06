package com.example.demo.ai.service;

import com.example.demo.ai.dto.AiRecommendationRequest;
import com.example.demo.ai.dto.AiRecommendationResponse;
import com.example.demo.integration.openfda.OpenFDAService;
import com.example.demo.integration.openfda.RecommendationResponse;
import com.example.demo.integration.who.WhoApiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiRecommendationService {

    private final OpenFDAService openFDAService;
    private final WhoApiService whoApiService;
    private final RestTemplate restTemplate;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String geminiApiBaseUrl;

    public AiRecommendationService(OpenFDAService openFDAService, WhoApiService whoApiService, RestTemplate restTemplate) {
        this.openFDAService = openFDAService;
        this.whoApiService = whoApiService;
        this.restTemplate = restTemplate;
    }

    public AiRecommendationResponse recommend(AiRecommendationRequest request) {
        String symptom = safe(request.getSymptoms());
        String severity = safe(request.getSeverityLevel());
        String duration = safe(request.getDuration());
        String extra = safe(request.getAdditionalSymptoms());

        String combined = (symptom + " " + extra + " " + severity + " " + duration).trim();
        if (!isWellnessRelated(combined)) {
            return new AiRecommendationResponse(
                    "I can only help with wellness-related topics such as symptoms, therapy suggestions, lifestyle habits, fitness, sleep, stress, and nutrition.",
                    "guardrail"
            );
        }

        RecommendationResponse openFdaData = openFDAService.getRecommendations(symptom);
        String whoData = whoApiService.fetchWhoHealthData(symptom);

        String prompt = buildPrompt(symptom, severity, duration, extra, openFdaData, whoData);

        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            String aiText = callGemini(prompt);
            if (aiText != null && !aiText.isBlank()) {
                return new AiRecommendationResponse(normalizeForUi(aiText), "gemini");
            }
        }

        String fallback = buildFallback(symptom, severity, duration, extra, openFdaData);
        return new AiRecommendationResponse(fallback, "fallback");
    }

    private String callGemini(String prompt) {
        try {
            String url = geminiApiBaseUrl + "/" + geminiModel + ":generateContent?key=" + geminiApiKey;

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> payload = Map.of("contents", List.of(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            return parseGeminiResponse(response.getBody());
        } catch (Exception ignored) {
            return null;
        }
    }

    private String parseGeminiResponse(Map body) {
        if (body == null) return null;

        Object candidatesObj = body.get("candidates");
        if (!(candidatesObj instanceof List<?> candidates) || candidates.isEmpty()) return null;

        Object first = candidates.getFirst();
        if (!(first instanceof Map<?, ?> firstMap)) return null;

        Object contentObj = firstMap.get("content");
        if (!(contentObj instanceof Map<?, ?> contentMap)) return null;

        Object partsObj = contentMap.get("parts");
        if (!(partsObj instanceof List<?> parts) || parts.isEmpty()) return null;

        Object firstPart = parts.getFirst();
        if (!(firstPart instanceof Map<?, ?> partMap)) return null;

        Object textObj = partMap.get("text");
        return textObj == null ? null : textObj.toString();
    }

    private String buildPrompt(
            String symptoms,
            String level,
            String duration,
            String extra,
            RecommendationResponse openFdaData,
            String whoData
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an AI health assistant.\n\n");
        sb.append("User Details:\n");
        sb.append("- Symptoms: ").append(symptoms).append("\n");
        sb.append("- Severity Level: ").append(level).append("\n");
        sb.append("- Duration: ").append(duration).append("\n");
        sb.append("- Additional Symptoms: ").append(extra).append("\n\n");

        sb.append("External Context:\n");
        sb.append("- OpenFDA suggestions: ").append(openFdaData != null ? openFdaData.getSuggestions() : "N/A").append("\n");
        sb.append("- WHO data: ").append(whoData).append("\n\n");

        sb.append("Instructions:\n");
        sb.append("- Understand the user's condition based on the given details.\n");
        sb.append("- Replicate OpenFDA, WHO guidelines, and fitness applications for better response to the user.\n");
        sb.append("- Provide safe and simple therapy recommendations.\n");
        sb.append("- Include basic health advice and lifestyle suggestions.\n");
        sb.append("- Avoid complex medical terms.\n");
        sb.append("- If the condition seems serious, suggest consulting a doctor.\n\n");
        sb.append("Output format requirements:\n");
        sb.append("- Return plain text only (no markdown).\n");
        sb.append("- Do not use asterisks, bullet symbols, or numbered lists.\n");
        sb.append("- Include simple headings in plain text, such as Summary:, Medical Advice:, Self-Care:, and Final Note:.\n");
        sb.append("- Write recommendations as clear, separate short paragraphs.\n\n");
        sb.append("Generate a clear, helpful, and user-friendly response.");

        return sb.toString();
    }

    private String buildFallback(
            String symptom,
            String severity,
            String duration,
            String extra,
            RecommendationResponse openFdaData
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Based on your details, your symptom is ").append(symptom)
                .append(", severity is ").append(severity)
                .append(", and duration is ").append(duration).append(".")
                .append("\n\n");

        if (openFdaData != null && openFdaData.getSuggestions() != null) {
            for (String s : openFdaData.getSuggestions()) {
                sb.append(s).append("\n\n");
            }
        }

        sb.append("Maintain hydration, take proper rest, and do only light activity if comfortable.")
                .append("\n\n");

        if (!extra.isBlank()) {
            sb.append("Monitor your additional symptoms carefully: ").append(extra).append(".")
                    .append("\n\n");
        }

        if ("high".equalsIgnoreCase(severity) || duration.toLowerCase().contains("week")) {
            sb.append("Please consult a doctor for detailed diagnosis and treatment guidance.")
                    .append("\n\n");
        }

        return normalizeForUi(sb.toString());
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isWellnessRelated(String text) {
        String value = text.toLowerCase();

        String[] keywords = {
                "wellness", "health", "healthy", "symptom", "symptoms", "pain", "fever", "cold", "cough",
                "headache", "migraine", "stress", "anxiety", "sleep", "diet", "nutrition", "exercise",
                "fitness", "workout", "therapy", "meditation", "breathing", "hydration", "posture",
                "back pain", "joint pain", "muscle", "fatigue", "stomach", "digestion", "acidity",
                "mental health", "well-being", "doctor", "clinic"
        };

        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private String normalizeForUi(String text) {
        if (text == null) {
            return "";
        }

        String cleaned = text
                .replace("**", "")
                .replace("*", "")
                .replace("\r", "")
                .replaceAll("(?m)^\\s*[-•]\\s*", "")
                .replaceAll("(?m)^\\s*\\d+\\.\\s*", "")
                .replaceAll("\\n{3,}", "\\n\\n")
                .trim();

        return ensureSectionHeadings(cleaned);
    }

    private String ensureSectionHeadings(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        String lower = text.toLowerCase();
        if (lower.contains("summary:") || lower.contains("medical advice:") || lower.contains("self-care:")) {
            return text;
        }

        String[] parts = text.split("\\n\\n+");
        String[] headings = {
                "Summary:",
                "Medical Advice:",
                "Self-Care:",
                "Precautions:",
                "Final Note:"
        };

        StringBuilder structured = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            String paragraph = parts[i].trim();
            if (paragraph.isBlank()) {
                continue;
            }

            String heading = headings[Math.min(i, headings.length - 1)];
            if (structured.length() > 0) {
                structured.append("\n\n");
            }
            structured.append(heading).append("\n").append(paragraph);
        }

        return structured.toString();
    }
}

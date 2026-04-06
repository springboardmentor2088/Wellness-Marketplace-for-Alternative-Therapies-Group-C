package com.example.demo.integration.openfda;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/openfda")
@CrossOrigin(origins = "*")
public class OpenFDAController {

    private final OpenFDAService openFDAService;

    public OpenFDAController(OpenFDAService openFDAService) {
        this.openFDAService = openFDAService;
    }

    @GetMapping("/search")
    public ResponseEntity<RecommendationResponse> getRecommendation(@RequestParam String symptom) {
        return ResponseEntity.ok(openFDAService.getRecommendations(symptom));
    }
}

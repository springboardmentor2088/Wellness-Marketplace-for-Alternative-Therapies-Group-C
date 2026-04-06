package com.example.demo.integration.who;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/who")
@CrossOrigin(origins = "*")
public class WhoApiController {

    private final WhoApiService whoApiService;

    public WhoApiController(WhoApiService whoApiService) {
        this.whoApiService = whoApiService;
    }

    @GetMapping("/search")
    public ResponseEntity<String> searchWhoData(@RequestParam String symptom) {
        String result = whoApiService.fetchWhoHealthData(symptom);
        return ResponseEntity.ok(result);
    }
}

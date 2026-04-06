package com.example.demo.recommendation.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "recommendation")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "symptom", nullable = false, length = 255)
    private String symptom;

    @Column(name = "suggested_therapy", nullable = false, length = 255)
    private String suggestedTherapy;

    @Column(name = "source_api", nullable = false, length = 100)
    private String sourceAPI;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public Recommendation() {
    }

    public Recommendation(Long userId, String symptom, String suggestedTherapy, String sourceAPI, LocalDateTime timestamp) {
        this.userId = userId;
        this.symptom = symptom;
        this.suggestedTherapy = suggestedTherapy;
        this.sourceAPI = sourceAPI;
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getSymptom() {
        return symptom;
    }

    public String getSuggestedTherapy() {
        return suggestedTherapy;
    }

    public String getSourceAPI() {
        return sourceAPI;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setSymptom(String symptom) {
        this.symptom = symptom;
    }

    public void setSuggestedTherapy(String suggestedTherapy) {
        this.suggestedTherapy = suggestedTherapy;
    }

    public void setSourceAPI(String sourceAPI) {
        this.sourceAPI = sourceAPI;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

package com.example.demo.ai.dto;

public class ChatStartResponse {

    private String sessionId;
    private String question;
    private int step;

    public ChatStartResponse() {
    }

    public ChatStartResponse(String sessionId, String question, int step) {
        this.sessionId = sessionId;
        this.question = question;
        this.step = step;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public int getStep() {
        return step;
    }

    public void setStep(int step) {
        this.step = step;
    }
}

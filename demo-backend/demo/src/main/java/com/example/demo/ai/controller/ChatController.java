package com.example.demo.ai.controller;

import com.example.demo.ai.dto.ChatAnswerRequest;
import com.example.demo.ai.dto.ChatAnswerResponse;
import com.example.demo.ai.dto.ChatStartResponse;
import com.example.demo.ai.service.ChatbotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatbotService chatbotService;

    public ChatController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/start")
    public ResponseEntity<ChatStartResponse> startChat() {
        return ResponseEntity.ok(chatbotService.start());
    }

    @PostMapping("/answer")
    public ResponseEntity<ChatAnswerResponse> answer(@RequestBody ChatAnswerRequest request) {
        return ResponseEntity.ok(chatbotService.answer(request.getSessionId(), request.getAnswer()));
    }
}

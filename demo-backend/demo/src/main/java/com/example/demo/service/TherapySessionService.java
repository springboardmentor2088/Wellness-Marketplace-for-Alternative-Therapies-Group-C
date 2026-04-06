package com.example.demo.service;

import com.example.demo.model.PractitionerAvailableSlot;
import com.example.demo.model.Role;
import com.example.demo.model.TherapySession;
import com.example.demo.model.TherapySessionStatus;
import com.example.demo.model.User;
import com.example.demo.notification.service.NotificationService;
import com.example.demo.repository.PractitionerAvailableSlotRepository;
import com.example.demo.repository.PractitionerProfileRepository;
import com.example.demo.repository.TherapySessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TherapySessionService {

    @Autowired
    private TherapySessionRepository sessionRepository;

    @Autowired
    private PractitionerAvailableSlotRepository slotRepository;

    @Autowired
    private PractitionerProfileRepository profileRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public TherapySession bookSession(User client, Long slotId, String notes) {
        if (client == null) {
            throw new IllegalArgumentException("Client cannot be null");
        }
        if (client.getRole() != Role.PATIENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only patients can book sessions");
        }
        if (slotId == null)
            throw new IllegalArgumentException("Slot ID cannot be null");
        PractitionerAvailableSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (slot.getStatus() != PractitionerAvailableSlot.SlotStatus.AVAILABLE) {
            throw new RuntimeException("Slot is not available");
        }

        TherapySession session = new TherapySession();
        session.setClient(client);
        session.setPractitioner(slot.getPractitioner());
        session.setDate(slot.getAvailableDate().atTime(slot.getStartTime()));
        session.setStatus(TherapySessionStatus.booked);
        session.setNotes(notes);

        slot.setStatus(PractitionerAvailableSlot.SlotStatus.BOOKED);
        slotRepository.save(slot);

        // Credit practitioner 500 INR for table session booking
        profileRepository.findByUser(slot.getPractitioner()).ifPresent(profile -> {
            java.math.BigDecimal current = profile.getBalance() == null ? java.math.BigDecimal.ZERO : profile.getBalance();
            profile.setBalance(current.add(java.math.BigDecimal.valueOf(500)));
            profileRepository.save(profile);
        });

        TherapySession saved = sessionRepository.save(session);
        notificationService.createSessionBookedNotification(saved);
        return saved;
    }

    public List<TherapySession> getSessionsForUser(User user) {
        return sessionRepository.findByClient(user);
    }

    public List<TherapySession> getSessionsForPractitioner(User practitioner) {
        return sessionRepository.findByPractitioner(practitioner);
    }

    public List<TherapySession> getSessionsForCurrentUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (user.getRole() == Role.PRACTITIONER) {
            return getSessionsForPractitioner(user);
        }
        return getSessionsForUser(user);
    }

    public TherapySession getSessionByIdForUser(User user, Long sessionId) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (sessionId == null) {
            throw new IllegalArgumentException("Session ID cannot be null");
        }

        TherapySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        // Access control: patients can only see their own sessions; practitioners can only see sessions assigned to them.
        if (user.getRole() == Role.PRACTITIONER) {
            if (session.getPractitioner() == null || session.getPractitioner().getId() == null
                    || !session.getPractitioner().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to view this session");
            }
        } else if (user.getRole() == Role.PATIENT) {
            if (session.getClient() == null || session.getClient().getId() == null
                    || !session.getClient().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to view this session");
            }
        }

        return session;
    }

    public TherapySession updateStatus(Long sessionId, TherapySessionStatus status) {
        if (sessionId == null)
            throw new IllegalArgumentException("Session ID cannot be null");
        TherapySession session = sessionRepository.findById(sessionId).orElseThrow();
        session.setStatus(status);
        return sessionRepository.save(session);
    }

    public List<TherapySession> getUpcomingSessions(User user) {
        if (user == null)
            throw new IllegalArgumentException("User cannot be null");
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (user.getRole() == Role.PRACTITIONER) {
            return sessionRepository.findByPractitionerAndDateAfterOrderByDateAsc(user, now);
        }
        return sessionRepository.findByClientAndDateAfterOrderByDateAsc(user, now);
    }
}

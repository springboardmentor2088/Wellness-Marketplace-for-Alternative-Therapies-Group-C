package com.example.demo.scheduler;

import com.example.demo.model.TherapySession;
import com.example.demo.model.TherapySessionStatus;
import com.example.demo.notification.service.NotificationService;
import com.example.demo.repository.TherapySessionRepository;
import com.example.demo.service.EmailReminderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SessionReminderScheduler
 *
 * Runs on a configurable cron (default: every hour).
 * Finds all BOOKED sessions starting within the next N hours (default: 24)
 * that haven't had a reminder sent yet, emails both the patient and the
 * practitioner, then marks reminder_sent = true so they are never emailed again.
 */
@Component
public class SessionReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(SessionReminderScheduler.class);

    @Autowired
    private TherapySessionRepository sessionRepository;

    @Autowired
    private EmailReminderService emailReminderService;

    @Autowired
    private NotificationService notificationService;

    @Value("${app.reminder.hours-before:24}")
    private int hoursBefore;

    /**
     * Scheduled reminder check. Cron expression is read from application.properties
     * (app.reminder.cron). Default pattern "0 0 * * * *" fires at the top of every hour.
     */
    @Scheduled(cron = "${app.reminder.cron:0 0 * * * *}")
    @Transactional
    public void sendUpcomingSessionReminders() {
        triggerReminders();
    }

    /**
     * Same logic as the scheduled job but callable on demand (e.g. from the
     * REST endpoint for manual triggering / smoke-testing).
     *
     * @return number of reminder emails dispatched
     */
    @Transactional
    public int triggerReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoff = now.plusHours(hoursBefore);

        log.info("Reminder check: scanning sessions between {} and {}", now, cutoff);

        List<TherapySession> sessions = sessionRepository
                .findByStatusAndDateBetweenAndReminderSentFalse(
                        TherapySessionStatus.booked, now, cutoff);

        if (sessions.isEmpty()) {
            log.info("No pending reminders found.");
            return 0;
        }

        int count = 0;
        for (TherapySession session : sessions) {
            try {
                // Email the patient
                emailReminderService.sendSessionReminder(session);
                // Email the practitioner
                emailReminderService.sendPractitionerReminder(session);

                // In-app notification for patient dashboard
                notificationService.createSessionReminderNotification(session);

                // Mark as sent so this session is never processed again
                session.setReminderSent(true);
                sessionRepository.save(session);
                count++;
            } catch (Exception e) {
                // Log but don't abort the whole batch
                log.error("Error processing reminder for session #{}: {}",
                        session.getId(), e.getMessage());
            }
        }

        log.info("Reminder batch complete: {} session(s) processed.", count);
        return count;
    }
}

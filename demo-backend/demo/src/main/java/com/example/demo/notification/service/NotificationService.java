package com.example.demo.notification.service;

import com.example.demo.model.TherapySession;
import com.example.demo.model.TherapySessionStatus;
import com.example.demo.model.User;
import com.example.demo.notification.model.Notification;
import com.example.demo.notification.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private static final DateTimeFormatter SESSION_TIME_FORMATTER = DateTimeFormatter.ofPattern("MMM d, yyyy hh:mm a");
    private static final DateTimeFormatter LOGIN_TIME_FORMATTER = DateTimeFormatter.ofPattern("MMM d, yyyy hh:mm a");

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${app.notifications.email.enabled:true}")
    private boolean emailNotificationsEnabled;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               JavaMailSender mailSender) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public Notification createNotification(Long userId, String type, String message) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setMessage(message);
        notification.setStatus("UNREAD");
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);
        sendNotificationEmail(saved);
        return saved;
    }

    public void createSessionBookedNotification(TherapySession session) {
        if (session == null || session.getClient() == null || session.getClient().getId() == null) {
            return;
        }

        Long userId = session.getClient().getId().longValue();
        String practitionerName = session.getPractitioner() != null ? session.getPractitioner().getName() : "your practitioner";
        String message = "Session booked with Dr. " + practitionerName + " on "
                + session.getDate().format(SESSION_TIME_FORMATTER) + ".";

        if (!notificationRepository.existsByUserIdAndTypeAndMessage(userId, "SESSION_BOOKED", message)) {
            createNotification(userId, "SESSION_BOOKED", message);
        }
    }

    public void createSessionReminderNotification(TherapySession session) {
        if (session == null || session.getClient() == null || session.getClient().getId() == null) {
            return;
        }

        Long userId = session.getClient().getId().longValue();
        String practitionerName = session.getPractitioner() != null ? session.getPractitioner().getName() : "your practitioner";
        String message = "Reminder: Session with Dr. " + practitionerName + " starts at "
                + session.getDate().format(SESSION_TIME_FORMATTER) + ".";

        if (!notificationRepository.existsByUserIdAndTypeAndMessage(userId, "SESSION_REMINDER", message)) {
            createNotification(userId, "SESSION_REMINDER", message);
        }
    }

    public void createLoginNotification(User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        String message = "Login detected on " + LocalDateTime.now().format(LOGIN_TIME_FORMATTER) + ".";
        createNotification(user.getId(), "LOGIN_ALERT", message);
    }

    public void createAiRecommendationNotification(User user, String recommendation) {
        if (user == null || user.getId() == null || recommendation == null || recommendation.isBlank()) {
            return;
        }

        String compact = recommendation.replaceAll("\\s+", " ").trim();
        String preview = compact.length() > 600 ? compact.substring(0, 600) + "..." : compact;
        String message = "Your AI wellness recommendation is ready: " + preview;
        createNotification(user.getId(), "AI_RECOMMENDATION", message);
    }

    public void syncUpcomingSessionNotifications(List<TherapySession> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        for (TherapySession session : sessions) {
            if (session == null || session.getStatus() != TherapySessionStatus.booked || session.getDate() == null) {
                continue;
            }
            if (session.getDate().isBefore(now)) {
                continue;
            }
            createSessionBookedNotification(session);
        }
    }

    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification getNotificationById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
    }

    public Notification markAsRead(Long id) {
        Notification notification = getNotificationById(id);

        notification.setStatus("READ");
        return notificationRepository.save(notification);
    }

    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));

        notificationRepository.delete(notification);
    }

    private void sendNotificationEmail(Notification notification) {
        if (!emailNotificationsEnabled || notification == null || notification.getUserId() == null) {
            return;
        }

        try {
            User user = userRepository.findById(notification.getUserId()).orElse(null);
            if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
                return;
            }

            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(user.getEmail());
            mail.setSubject("WellnessHub Notification: " + humanizeType(notification.getType()));
            mail.setText(buildEmailBody(user, notification));
            mailSender.send(mail);
        } catch (Exception ex) {
            // Keep in-app notifications functional even if mail provider fails.
            log.warn("Failed to send notification email for notification #{}: {}",
                    notification.getId(), ex.getMessage());
        }
    }

    private static String humanizeType(String type) {
        if (type == null || type.isBlank()) return "Update";
        return type.replace('_', ' ').trim();
    }

    private static String buildEmailBody(User user, Notification notification) {
        String name = (user.getName() == null || user.getName().isBlank()) ? "User" : user.getName();
        String createdAt = notification.getCreatedAt() == null
                ? ""
                : notification.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM d, yyyy hh:mm a"));

        return "Hi " + name + ",\n\n"
                + "You have a new notification from WellnessHub.\n\n"
                + "Type: " + humanizeType(notification.getType()) + "\n"
                + "Message: " + notification.getMessage() + "\n"
                + (createdAt.isBlank() ? "" : ("Time: " + createdAt + "\n"))
                + "\nPlease log in to your dashboard for more details.\n\n"
                + "- WellnessHub Team";
    }
}

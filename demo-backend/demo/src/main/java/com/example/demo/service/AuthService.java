package com.example.demo.service;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.NpiPractitionerDetails;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.PractitionerLicenseLookupResponse;
import com.example.demo.dto.RefreshTokenRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.model.PractitionerProfile;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.model.VerificationStatus;
import com.example.demo.notification.service.NotificationService;
import com.example.demo.repository.PractitionerProfileRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PractitionerProfileRepository practitionerProfileRepository;
    private final NpiVerificationService npiVerificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final NotificationService notificationService;
    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final String frontendBaseUrl;

    public AuthService(UserRepository userRepository,
            PractitionerProfileRepository practitionerProfileRepository,
            NpiVerificationService npiVerificationService,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            AuthenticationManager authenticationManager,
            UserDetailsService userDetailsService,
            NotificationService notificationService,
            JavaMailSender mailSender,
            @Value("${app.mail.from:${spring.mail.username:}}") String mailFrom,
            @Value("${app.frontend.base-url:http://localhost:3000}") String frontendBaseUrl) {
        this.userRepository = userRepository;
        this.practitionerProfileRepository = practitionerProfileRepository;
        this.npiVerificationService = npiVerificationService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.notificationService = notificationService;
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Transactional
    public AuthResponse registerUser(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already registered");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(Role.PATIENT);
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(userDetails))
                .refreshToken(jwtUtil.generateRefreshToken(userDetails))
                .role(user.getRole())
            .name(user.getName())
                .message("user registered")
                .build();
    }

    @Transactional
    public AuthResponse registerPractitioner(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already registered");
        }

        if (req.getLicenseNumber() == null || req.getLicenseNumber().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "License number is required for practitioner registration");
        }

        // ── Verify license via NPI Registry API ──
        log.info("Verifying practitioner NPI: {}", req.getLicenseNumber());
        NpiPractitionerDetails details = npiVerificationService
                .lookupByNpi(req.getLicenseNumber());

        // Auto-detect specialization from NPI taxonomy if not provided
        String specialization = req.getSpecialization();
        if (specialization == null || specialization.isBlank()) {
            specialization = details.getPrimaryTaxonomy();
        }

        if (isAyurvedaText(specialization)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ayurveda specialization is not supported");
        }

        log.info("NPI verified: {} — {} ({})", details.getPractitionerName(),
                details.getPrimaryTaxonomy(), details.getEnumerationType());

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(Role.PRACTITIONER);
        userRepository.save(user);

        PractitionerProfile profile = new PractitionerProfile();
        profile.setUser(user);
        profile.setLicenseNumber(req.getLicenseNumber());
        profile.setSpecialization(specialization);
        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        practitionerProfileRepository.save(profile);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(userDetails))
                .refreshToken(jwtUtil.generateRefreshToken(userDetails))
                .role(user.getRole())
            .name(user.getName())
                .message("practitioner registered — license verified (" + specialization + ")")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            log.info("Attempting authentication for: {}", request.getEmail());
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            log.info("Authentication successful for: {}", request.getEmail());
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

            try {
                notificationService.createLoginNotification(user);
            } catch (Exception notificationEx) {
                log.warn("Login notification failed for {}: {}", request.getEmail(), notificationEx.getMessage());
            }

            return AuthResponse.builder()
                    .accessToken(jwtUtil.generateAccessToken(userDetails))
                    .refreshToken(jwtUtil.generateRefreshToken(userDetails))
                    .role(user.getRole())
                    .name(user.getName())
                    .message("login successful")
                    .build();
        } catch (BadCredentialsException ex) {
            log.warn("Login failed for {}: Bad credentials", request.getEmail());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid email or password");
        } catch (Exception ex) {
            log.error("Login encountered an unexpected error for {}: {}", request.getEmail(), ex.getMessage(), ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An internal error occurred during login");
        }
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (jwtUtil.isTokenExpired(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "refresh token expired");
        }

        String userEmail = jwtUtil.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
        if (!jwtUtil.isTokenValid(refreshToken, userDetails)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token");
        }

        User user = userRepository.findByEmail(userEmail).orElseThrow();

        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(userDetails))
                .refreshToken(jwtUtil.generateRefreshToken(userDetails))
                .role(user.getRole())
            .name(user.getName())
                .message("token refreshed")
                .build();
    }

    public PractitionerLicenseLookupResponse getPractitionerByLicense(String licenseNumber) {
        if (licenseNumber == null || licenseNumber.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "license number is required");
        }
        NpiPractitionerDetails details = npiVerificationService
                .lookupByNpi(licenseNumber);

        if (isAyurvedaText(details.getPrimaryTaxonomy())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ayurveda specialization is not supported");
        }
        return new PractitionerLicenseLookupResponse(
                details.getPractitionerName(),
                details.getEmail(),
                details.getPrimaryTaxonomy(),
                "NPI Registry",
                "VERIFIED");
    }

    private static boolean isAyurvedaText(String text) {
        if (text == null) return false;
        return text.toLowerCase().contains("ayur");
    }

    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email is required");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Prevent account enumeration.
            return;
        }

        String token = generateResetToken();
        String tokenHash = sha256Hex(token);
        user.setResetTokenHash(tokenHash);
        user.setResetTokenExpiry(Timestamp.from(Instant.now().plus(Duration.ofMinutes(30))));
        userRepository.save(user);

        String resetLink = frontendBaseUrl.replaceAll("/+$", "") + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) {
            message.setFrom(mailFrom);
        }
        message.setTo(user.getEmail());
        message.setSubject("Password Reset Request");
        message.setText("Click the link to reset your password: " + resetLink + "\n\n" +
                "This link expires in 30 minutes.");

        try {
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Failed to send reset password email to {}: {}", email, ex.getMessage(), ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "failed to send reset password email");
        }
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token is required");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "newPassword is required");
        }

        String tokenHash = sha256Hex(token);
        User user = userRepository.findByResetTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "invalid or expired reset token"));

        Timestamp expiry = user.getResetTokenExpiry();
        if (expiry == null || expiry.before(Timestamp.from(Instant.now()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid or expired reset token");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetTokenHash(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    private static String generateResetToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}

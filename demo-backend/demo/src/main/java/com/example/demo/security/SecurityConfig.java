package com.example.demo.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.LinkedHashMap;
import java.util.Map;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType("application/json");
                            Map<String, Object> body = new LinkedHashMap<>();
                            body.put("status", 401);
                            body.put("error", "Unauthorized");
                            body.put("message", authException.getMessage());
                            body.put("path", request.getRequestURI());
                            new ObjectMapper().writeValue(response.getOutputStream(), body);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(403);
                            response.setContentType("application/json");
                            Map<String, Object> body = new LinkedHashMap<>();
                            body.put("status", 403);
                            body.put("error", "Forbidden");
                            body.put("message", accessDeniedException.getMessage());
                            body.put("path", request.getRequestURI());
                            new ObjectMapper().writeValue(response.getOutputStream(), body);
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Allow CORS preflight across the API
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/api/ai/**").hasRole("PATIENT")
                    .requestMatchers("/api/chat/**").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.GET, "/api/products/my").hasRole("PRACTITIONER")
                        .requestMatchers(HttpMethod.POST, "/api/products/my").hasRole("PRACTITIONER")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/my/**").hasRole("PRACTITIONER")
                    .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/notifications/**").authenticated()
                    // Anyone can view product reviews (e.g., on product detail pages)
                    .requestMatchers(HttpMethod.GET, "/api/product-reviews/**").permitAll()
                    .requestMatchers("/api/questions/**").permitAll()
                    .requestMatchers("/api/answers/**").permitAll()
                    // Only patients can submit product reviews
                    .requestMatchers(HttpMethod.POST, "/api/product-reviews/**").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/book").hasRole("PATIENT")
                        .requestMatchers("/api/payments/**").authenticated()
                        .requestMatchers("/api/orders/**").authenticated()
                        .requestMatchers("/api/wishlist/**").authenticated()
                        .requestMatchers("/api/calendar/**").authenticated()
                        .requestMatchers("/api/reminders/**").authenticated()
                        .requestMatchers("/api/practitioner/verified").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/practitioner/user/**").authenticated()
                        // Patients must be able to view a practitioner's availability to book a session
                        .requestMatchers(HttpMethod.GET, "/api/practitioner/*/slots").authenticated()
                        // Practitioners can manage their own slots
                        .requestMatchers(HttpMethod.GET, "/api/practitioner/slots/my").hasRole("PRACTITIONER")
                        .requestMatchers(HttpMethod.POST, "/api/practitioner/slots").hasRole("PRACTITIONER")
                        .requestMatchers(HttpMethod.DELETE, "/api/practitioner/slots/**").hasRole("PRACTITIONER")
                        .requestMatchers("/api/practitioner/**").hasRole("PRACTITIONER")
                        .requestMatchers("/api/user/**").hasRole("PATIENT")
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

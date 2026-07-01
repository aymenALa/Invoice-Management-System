package com.invoice_management_system.service;

import com.invoice_management_system.dto.RegistrationRequest;
import com.invoice_management_system.dto.UserPasswordChangeRequest;
import com.invoice_management_system.dto.UserProfileResponse;
import com.invoice_management_system.dto.UserProfileUpdateRequest;
import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;
import java.util.ArrayList;
import java.util.List;

import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username or email: " + username));

        List<GrantedAuthority> authorities = new ArrayList<>();
        for (String role : user.getRoles()) {
            authorities.add(new SimpleGrantedAuthority(role));
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(!user.isEnabled())
                .accountLocked(!user.isEnabled())
                .credentialsExpired(!user.isEnabled())
                .disabled(!user.isEnabled())
                .build();
    }

    public User registerNewUser(RegistrationRequest registrationRequest) {
        if (userRepository.existsByUsername(registrationRequest.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(registrationRequest.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(registrationRequest.getUsername());
        user.setEmail(registrationRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registrationRequest.getPassword()));
        user.setFirstName(registrationRequest.getFirstName());
        user.setLastName(registrationRequest.getLastName());
        user.setCreatedAt(LocalDateTime.now());
        user.setEnabled(true);
        user.getRoles().add("ROLE_USER");

        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByUsernameOrEmail(String usernameOrEmail) {
        return userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail);
    }

    public void requestPasswordReset(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            return;
        }

        User user = userOptional.get();
        String token = generateResetToken();
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);

        sendPasswordResetEmail(user, token);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new BusinessException("Invalid or expired password reset link"));

        LocalDateTime expiresAt = user.getPasswordResetTokenExpiresAt();
        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            user.setPasswordResetToken(null);
            user.setPasswordResetTokenExpiresAt(null);
            userRepository.save(user);
            throw new BusinessException("Invalid or expired password reset link");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);
    }

    public User getUserFromAuthentication(Authentication authentication) {
        String username = authentication.getName();
        return findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void updateLastLogin(User user) {
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    public UserProfileResponse getUserProfile(User user) {
        return toUserProfileResponse(user);
    }

    public UserProfileResponse updateUserProfile(User user, UserProfileUpdateRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        userRepository.findByEmail(email)
                .filter(existingUser -> !existingUser.getId().equals(user.getId()))
                .ifPresent(existingUser -> {
                    throw new BusinessException("Email already exists");
                });

        user.setEmail(email);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        return toUserProfileResponse(userRepository.save(user));
    }

    public void changePassword(User user, UserPasswordChangeRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserProfileResponse toUserProfileResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName()
        );
    }

    private String generateResetToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void sendPasswordResetEmail(User user, String token) {
        String resetLink = frontendUrl + "/auth?resetToken=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(user.getEmail());
        message.setSubject("Invoice Management System password reset");
        message.setText(
                "Hello " + user.getFirstName() + ",\n\n" +
                "We received a request to reset your password.\n\n" +
                "Use this link to choose a new password:\n" + resetLink + "\n\n" +
                "This link expires in 30 minutes. If you did not request this, you can ignore this email."
        );

        mailSender.send(message);
    }
}

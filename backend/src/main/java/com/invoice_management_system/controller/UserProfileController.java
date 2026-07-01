package com.invoice_management_system.controller;

import com.invoice_management_system.dto.UserPasswordChangeRequest;
import com.invoice_management_system.dto.UserProfileUpdateRequest;
import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.User;
import com.invoice_management_system.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user-profile")
public class UserProfileController {

    private final UserService userService;

    public UserProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        return ResponseEntity.ok(userService.getUserProfile(user));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UserProfileUpdateRequest request,
            Authentication authentication
    ) {
        try {
            User user = userService.getUserFromAuthentication(authentication);
            return ResponseEntity.ok(userService.updateUserProfile(user, request));
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody UserPasswordChangeRequest request,
            Authentication authentication
    ) {
        try {
            User user = userService.getUserFromAuthentication(authentication);
            userService.changePassword(user, request);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

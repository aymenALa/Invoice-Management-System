package com.invoice_management_system.controller;

import com.invoice_management_system.dto.ClientActivateRequest;
import com.invoice_management_system.dto.ClientInviteRequest;
import com.invoice_management_system.dto.ClientInviteResponse;
import com.invoice_management_system.dto.ClientLoginRequest;
import com.invoice_management_system.dto.ClientLoginResponse;
import com.invoice_management_system.dto.ClientPortalAccessResponse;
import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.User;
import com.invoice_management_system.service.ClientAuthService;
import com.invoice_management_system.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/client-auth")
public class ClientAuthController {

    private final ClientAuthService clientAuthService;
    private final UserService userService;

    public ClientAuthController(ClientAuthService clientAuthService, UserService userService) {
        this.clientAuthService = clientAuthService;
        this.userService = userService;
    }

    @PostMapping("/invite")
    public ResponseEntity<?> inviteClient(@Valid @RequestBody ClientInviteRequest request, Authentication authentication) {
        try {
            User user = userService.getUserFromAuthentication(authentication);
            ClientInviteResponse response = clientAuthService.inviteClient(request.getClientId(), user);
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/invite/regenerate")
    public ResponseEntity<?> regenerateClientInvitation(@Valid @RequestBody ClientInviteRequest request, Authentication authentication) {
        try {
            User user = userService.getUserFromAuthentication(authentication);
            ClientInviteResponse response = clientAuthService.regenerateClientInvitation(request.getClientId(), user);
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/invite/send")
    public ResponseEntity<?> sendClientInvitation(@Valid @RequestBody ClientInviteRequest request, Authentication authentication) {
        try {
            User user = userService.getUserFromAuthentication(authentication);
            ClientInviteResponse response = clientAuthService.sendClientInvitation(request.getClientId(), user);
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/access/{clientId}")
    public ResponseEntity<?> getClientPortalAccess(@PathVariable Long clientId, Authentication authentication) {
        try {
            User user = userService.getUserFromAuthentication(authentication);
            ClientPortalAccessResponse response = clientAuthService.getClientPortalAccess(clientId, user);
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/access/{clientId}/block")
    public ResponseEntity<?> blockClientPortalAccess(@PathVariable Long clientId, Authentication authentication) {
        try {
            User user = userService.getUserFromAuthentication(authentication);
            ClientPortalAccessResponse response = clientAuthService.setClientPortalAccess(clientId, user, false);
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/access/{clientId}/unblock")
    public ResponseEntity<?> unblockClientPortalAccess(@PathVariable Long clientId, Authentication authentication) {
        try {
            User user = userService.getUserFromAuthentication(authentication);
            ClientPortalAccessResponse response = clientAuthService.setClientPortalAccess(clientId, user, true);
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activateClient(@Valid @RequestBody ClientActivateRequest request) {
        try {
            ClientLoginResponse response = clientAuthService.activateClient(
                    request.getEmail(),
                    request.getInvitationCode(),
                    request.getPassword()
            );
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginClient(@Valid @RequestBody ClientLoginRequest request) {
        try {
            ClientLoginResponse response = clientAuthService.loginClient(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }
}

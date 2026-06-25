package com.invoice_management_system.controller;

import com.invoice_management_system.dto.AuthenticationRequest;
import com.invoice_management_system.dto.AuthenticationResponse;
import com.invoice_management_system.dto.RegisterResponse;
import com.invoice_management_system.dto.RegistrationRequest;
import com.invoice_management_system.model.User;
import com.invoice_management_system.security.JwtUtil;
import com.invoice_management_system.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.invoice_management_system.dto.RegisterResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager, UserService userService, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegistrationRequest registrationRequest) {
        try {
            User user = userService.registerNewUser(registrationRequest);
            return ResponseEntity.ok(new RegisterResponse(user.getId(), user.getUsername(), user.getEmail()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest authenticationRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(authenticationRequest.getUsername(), authenticationRequest.getPassword())
        );
        
        User user = userService.findByUsername(authenticationRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        userService.updateLastLogin(user);
        
        final UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        final String jwt = jwtUtil.generateToken(userDetails);
        
        return ResponseEntity.ok(new AuthenticationResponse(jwt,userDetails.getUsername()));
    }
}
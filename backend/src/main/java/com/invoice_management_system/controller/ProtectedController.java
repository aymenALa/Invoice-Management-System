package com.invoice_management_system.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/protected")
public class ProtectedController {

    @GetMapping("/hello")
    public ResponseEntity<String> hello(Authentication authentication) {
        return ResponseEntity.ok("Hello, " + authentication.getName() + "! This is a protected endpoint.");
    }
}
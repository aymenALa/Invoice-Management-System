package com.invoice_management_system.dto;

public class RegisterResponse {
    private final Long id;
    private final String username;
    private final String email;

    public RegisterResponse(Long id, String username, String email) {
        this.id = id;
        this.username = username;
        this.email = email;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }
}
package com.invoice_management_system.dto;

public class AuthenticationResponse {
    private String token;
    private String username;

    public AuthenticationResponse(String token,String username ) {
        this.token = token;
        this.username = username;
    }
    
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
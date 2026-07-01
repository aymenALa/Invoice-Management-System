package com.invoice_management_system.dto;

public class ClientLoginResponse {
    private String token;
    private Long clientId;
    private String clientName;
    private String email;

    public ClientLoginResponse(String token, Long clientId, String clientName, String email) {
        this.token = token;
        this.clientId = clientId;
        this.clientName = clientName;
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

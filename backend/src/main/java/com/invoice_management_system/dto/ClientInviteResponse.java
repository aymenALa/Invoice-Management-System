package com.invoice_management_system.dto;

import java.time.LocalDateTime;

public class ClientInviteResponse {
    private Long clientId;
    private String email;
    private String invitationCode;
    private LocalDateTime expiresAt;

    public ClientInviteResponse(Long clientId, String email, String invitationCode, LocalDateTime expiresAt) {
        this.clientId = clientId;
        this.email = email;
        this.invitationCode = invitationCode;
        this.expiresAt = expiresAt;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getInvitationCode() {
        return invitationCode;
    }

    public void setInvitationCode(String invitationCode) {
        this.invitationCode = invitationCode;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}

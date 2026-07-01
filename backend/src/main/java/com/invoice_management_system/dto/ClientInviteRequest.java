package com.invoice_management_system.dto;

import jakarta.validation.constraints.NotNull;

public class ClientInviteRequest {

    @NotNull(message = "Client id is required")
    private Long clientId;

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }
}

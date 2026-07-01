package com.invoice_management_system.dto;

public class ClientPortalAccessResponse {
    private Long clientId;
    private boolean portalAccountExists;
    private boolean enabled;

    public ClientPortalAccessResponse(Long clientId, boolean portalAccountExists, boolean enabled) {
        this.clientId = clientId;
        this.portalAccountExists = portalAccountExists;
        this.enabled = enabled;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public boolean isPortalAccountExists() {
        return portalAccountExists;
    }

    public void setPortalAccountExists(boolean portalAccountExists) {
        this.portalAccountExists = portalAccountExists;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}

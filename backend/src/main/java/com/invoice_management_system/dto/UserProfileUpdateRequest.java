package com.invoice_management_system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserProfileUpdateRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, message = "Username must be at least 3 characters")
    private String username;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    private String email;

    private String firstName;

    private String lastName;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
}

package com.invoice_management_system.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "invoices")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Invoice number is required")
    @Column(nullable = false, unique = true)
    private String invoiceNumber;

    @NotNull(message = "Issue date is required")
    @Column(nullable = false)
    private LocalDate issueDate;

    @NotNull(message = "Due date is required")
    @Column(nullable = false)
    private LocalDate dueDate;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Total amount must be greater than 0")
    @Column(nullable = false)
    private BigDecimal totalAmount;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id")
    @JsonIgnoreProperties("invoices")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties("invoices")
    private User user;

    // Constructors
    public Invoice() {}

    public Invoice(String invoiceNumber, User user, LocalDate issueDate, LocalDate dueDate, BigDecimal totalAmount, InvoiceStatus status, Client client) {
        this.invoiceNumber = invoiceNumber;
        this.user = user;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.totalAmount = totalAmount;
        this.status = status;
        this.client = client;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public InvoiceStatus getStatus() {
        return status;
    }

    public void setStatus(InvoiceStatus status) {
        this.status = status;
    }
    
    public Client getClient() {
    	return client;
    }
    
    public void setClient(Client client) {
    	this.client = client;
    }

    // Enum for Invoice Status
    public enum InvoiceStatus {
        DRAFT, SENT, PAID, OVERDUE, CANCELLED
    }

    // toString method for debugging
    @Override
    public String toString() {
        return "Invoice{" +
                "id=" + id +
                ", invoiceNumber='" + invoiceNumber + '\'' +
                ", user=" + (user != null ? user.getId() : null) +
                ", issueDate=" + issueDate +
                ", dueDate=" + dueDate +
                ", totalAmount=" + totalAmount +
                ", status=" + status +
                ", client" + client +
                '}';
    }
    public enum Status {
        DRAFT, SENT, PAID, OVERDUE, CANCELLED
    }
}
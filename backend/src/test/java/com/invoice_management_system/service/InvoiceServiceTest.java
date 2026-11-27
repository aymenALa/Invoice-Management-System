package com.invoice_management_system.service;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.ClientRepository;
import com.invoice_management_system.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private ClientRepository clientRepository;

    private InvoiceService invoiceService;
    private User owner;
    private User otherUser;
    private Client ownedClient;

    @BeforeEach
    void setUp() {
        invoiceService = new InvoiceService(invoiceRepository, clientRepository);
        owner = new User();
        owner.setId(1L);
        owner.setUsername("owner");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("other");

        ownedClient = new Client("Northwind", "billing@northwind.example", "555-0100", "123 Main St", owner);
        ownedClient.setId(10L);
    }

    @Test
    void createInvoiceNormalizesAmountAndSaves() {
        Invoice inv = buildInvoice("INV-100", new BigDecimal("125.456"), LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 15));
        when(invoiceRepository.existsByInvoiceNumber("INV-100")).thenReturn(false);
        when(clientRepository.findById(10L)).thenReturn(Optional.of(ownedClient));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        Invoice saved = invoiceService.createInvoice(inv, owner);

        assertEquals(new BigDecimal("125.46"), saved.getTotalAmount());
        assertSame(owner, saved.getUser());
        assertSame(ownedClient, saved.getClient());
    }

    @Test
    void updateInvoiceRejectsDuplicateInvoiceNumber() {
        Invoice existing = buildInvoice("INV-100", new BigDecimal("100.00"), LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 10));
        existing.setId(50L);
        existing.setUser(owner);

        Invoice updated = buildInvoice("INV-200", new BigDecimal("150.00"), LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 12));

        when(invoiceRepository.findByIdAndUser(50L, owner)).thenReturn(Optional.of(existing));
        when(invoiceRepository.existsByInvoiceNumberAndIdNot("INV-200", 50L)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> invoiceService.updateInvoice(50L, updated, owner));
        assertEquals("Invoice number already exists", ex.getMessage());
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void updateInvoiceRejectsDueDateBeforeIssueDate() {
        Invoice existing = buildInvoice("INV-100", new BigDecimal("100.00"), LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 10));
        existing.setId(50L);
        existing.setUser(owner);

        Invoice updated = buildInvoice("INV-100", new BigDecimal("100.00"), LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 10));

        when(invoiceRepository.findByIdAndUser(50L, owner)).thenReturn(Optional.of(existing));

        BusinessException ex = assertThrows(BusinessException.class, () -> invoiceService.updateInvoice(50L, updated, owner));
        assertEquals("Due date cannot be before issue date", ex.getMessage());
    }

    @Test
    void updateInvoiceRejectsClientOwnedByAnotherUser() {
        Invoice existing = buildInvoice("INV-100", new BigDecimal("100.00"), LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 10));
        existing.setId(50L);
        existing.setUser(owner);

        Client foreignClient = new Client("Foreign", "f@example.com", "555", "Addr", otherUser);
        foreignClient.setId(99L);

        Invoice updated = buildInvoice("INV-100", new BigDecimal("100.00"), LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 10));
        updated.setClient(foreignClient);

        when(invoiceRepository.findByIdAndUser(50L, owner)).thenReturn(Optional.of(existing));
        when(invoiceRepository.existsByInvoiceNumberAndIdNot("INV-100", 50L)).thenReturn(false);
        when(clientRepository.findById(99L)).thenReturn(Optional.of(foreignClient));

        BusinessException ex = assertThrows(BusinessException.class, () -> invoiceService.updateInvoice(50L, updated, owner));
        assertEquals("Invalid client for this user", ex.getMessage());
    }

    @Test
    void deleteInvoiceThrowsBusinessExceptionWhenNotFound() {
        when(invoiceRepository.findByIdAndUser(404L, owner)).thenReturn(Optional.empty());
        assertThrows(BusinessException.class, () -> invoiceService.deleteInvoice(404L, owner));
    }

    private Invoice buildInvoice(String num, BigDecimal amount, LocalDate issue, LocalDate due) {
        return new Invoice(num, owner, issue, due, amount, Invoice.InvoiceStatus.SENT, ownedClient);
    }
}

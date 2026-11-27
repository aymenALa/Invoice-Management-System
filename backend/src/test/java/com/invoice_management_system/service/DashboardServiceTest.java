package com.invoice_management_system.service;

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
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private ClientRepository clientRepository;

    private DashboardService dashboardService;
    private User user;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(invoiceRepository, clientRepository);
        user = new User();
        user.setId(1L);
    }

    @Test
    void getDashboardDataSeparatesPaidInvoicedOutstandingDraftAndCancelled() {
        Client c = new Client("Acme", "a@acme.com", "555", "St", user);
        LocalDate past = LocalDate.now().minusDays(10);
        LocalDate future = LocalDate.now().plusDays(15);

        List<Invoice> invoices = List.of(
                new Invoice("INV-1", user, past, past, new BigDecimal("1000.00"), Invoice.InvoiceStatus.PAID, c),
                new Invoice("INV-2", user, past, future, new BigDecimal("500.00"), Invoice.InvoiceStatus.SENT, c),
                new Invoice("INV-3", user, past, past, new BigDecimal("300.00"), Invoice.InvoiceStatus.OVERDUE, c),
                new Invoice("INV-4", user, past, future, new BigDecimal("200.00"), Invoice.InvoiceStatus.DRAFT, c),
                new Invoice("INV-5", user, past, past, new BigDecimal("400.00"), Invoice.InvoiceStatus.CANCELLED, c)
        );

        when(invoiceRepository.findAllByUser(user)).thenReturn(invoices);
        when(clientRepository.findByUser(user)).thenReturn(List.of(c));
        when(invoiceRepository.findTop5ByUserOrderByIssueDateDesc(user)).thenReturn(invoices);

        Map<String, Object> data = dashboardService.getDashboardData(user);

        assertEquals(5, data.get("totalInvoices"));
        assertEquals(1, data.get("totalClients"));
        assertEquals(new BigDecimal("1000.00"), data.get("paidAmount"));
        assertEquals(new BigDecimal("1800.00"), data.get("invoicedAmount"));
        assertEquals(new BigDecimal("800.00"), data.get("outstandingAmount"));
        assertEquals(new BigDecimal("300.00"), data.get("overdueAmount"));
        assertEquals(new BigDecimal("200.00"), data.get("draftAmount"));
        assertEquals(new BigDecimal("400.00"), data.get("cancelledAmount"));
        assertEquals(1L, data.get("overdueInvoices"));
    }
}

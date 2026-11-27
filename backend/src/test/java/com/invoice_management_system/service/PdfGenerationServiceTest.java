package com.invoice_management_system.service;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PdfGenerationServiceTest {

    private final PdfGenerationService pdfService = new PdfGenerationService();

    @Test
    void generateInvoicePdfProducesValidPdfWithLongClientDetails() throws Exception {
        User user = new User();
        user.setUsername("alex.mercer");
        user.setFirstName("Alex");
        user.setLastName("Mercer");
        user.setEmail("alex@northstarbilling.example");

        Client client = new Client(
                "International Consolidated Maritime & Logistics Holdings Corporation Ltd.",
                "accounts.payable.department@long-corporate-domain.example",
                "+1-555-0199-8877",
                "14500 Harbor Boulevard, Building C, Suite 2400, Floor 19, Seattle, Washington 98101, United States",
                user
        );

        Invoice invoice = new Invoice(
                "INV-2026-LONG-0001",
                user,
                LocalDate.of(2026, 11, 1),
                LocalDate.of(2026, 11, 30),
                new BigDecimal("12450.75"),
                Invoice.InvoiceStatus.SENT,
                client
        );

        byte[] bytes = pdfService.generateInvoicePdf(invoice);
        assertNotNull(bytes);
        assertTrue(bytes.length > 500);
        assertEquals("%PDF-", new String(bytes, 0, 5, StandardCharsets.US_ASCII));
    }

    @Test
    void generateClientInvoicesPdfThrowsOnEmptyList() {
        assertThrows(BusinessException.class, () -> pdfService.generateClientInvoicesPdf(List.of()));
    }
}

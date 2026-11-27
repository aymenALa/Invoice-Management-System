package com.invoice_management_system.controller;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import com.invoice_management_system.service.ClientService;
import com.invoice_management_system.service.InvoiceService;
import com.invoice_management_system.service.PdfGenerationService;
import com.invoice_management_system.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "invoiceNumber", "issueDate", "dueDate", "totalAmount", "status"
    );

    private final InvoiceService invoiceService;
    private final UserService userService;
    private final ClientService clientService;
    private final PdfGenerationService pdfGenerationService;

    @Autowired
    public InvoiceController(
            InvoiceService invoiceService,
            UserService userService,
            ClientService clientService,
            PdfGenerationService pdfGenerationService
    ) {
        this.invoiceService = invoiceService;
        this.userService = userService;
        this.clientService = clientService;
        this.pdfGenerationService = pdfGenerationService;
    }

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody Invoice invoice, Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        Invoice createdInvoice = invoiceService.createInvoice(invoice, user);
        return ResponseEntity.ok(createdInvoice);
    }

    @GetMapping
    public ResponseEntity<Page<Invoice>> getInvoices(
            Authentication authentication,
            @RequestParam(required = false) String invoiceNumber,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) Invoice.InvoiceStatus status,
            @RequestParam(required = false) Long clientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "issueDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        User user = userService.getUserFromAuthentication(authentication);
        String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "issueDate";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);

        Client client = clientId != null ? clientService.getClientById(clientId, user) : null;
        PageRequest pageRequest = PageRequest.of(safePage, safeSize, Sort.by(direction, safeSortBy));
        Page<Invoice> invoices = invoiceService.findInvoices(
                user, invoiceNumber, startDate, endDate, minAmount, maxAmount, status, client, pageRequest
        );
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable Long id, Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        return invoiceService.getInvoiceByIdForUser(id, user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> updateInvoice(
            @PathVariable Long id,
            @Valid @RequestBody Invoice invoice,
            Authentication authentication
    ) {
        User user = userService.getUserFromAuthentication(authentication);
        Invoice updatedInvoice = invoiceService.updateInvoice(id, invoice, user);
        return ResponseEntity.ok(updatedInvoice);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id, Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        invoiceService.deleteInvoice(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable Long id, Authentication authentication) throws Exception {
        User user = userService.getUserFromAuthentication(authentication);
        Invoice invoice = invoiceService.getInvoiceByIdForUser(id, user)
                .orElseThrow(() -> new BusinessException("Invoice not found"));

        byte[] pdfBytes = pdfGenerationService.generateInvoicePdf(invoice);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "Invoice-" + invoice.getInvoiceNumber() + ".pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/clients/{clientId}")
    public ResponseEntity<List<Invoice>> getClientInvoices(@PathVariable Long clientId, Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        clientService.getClientById(clientId, user);
        List<Invoice> invoices = invoiceService.getInvoicesForClientAndUser(clientId, user);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/client/{clientId}/pdf")
    public ResponseEntity<byte[]> getClientInvoicesPdf(@PathVariable Long clientId, Authentication authentication) throws Exception {
        User user = userService.getUserFromAuthentication(authentication);
        clientService.getClientById(clientId, user);
        List<Invoice> invoices = invoiceService.getInvoicesForClientAndUser(clientId, user);

        if (invoices.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        byte[] pdfBytes = pdfGenerationService.generateClientInvoicesPdf(invoices);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "Client-invoices-" + clientId + ".pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}

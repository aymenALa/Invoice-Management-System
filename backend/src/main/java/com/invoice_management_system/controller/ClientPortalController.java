package com.invoice_management_system.controller;

import com.invoice_management_system.dto.ClientPortalProfileResponse;
import com.invoice_management_system.dto.ClientPortalUpdateRequest;
import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.ClientPortalAccount;
import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.repository.ClientRepository;
import com.invoice_management_system.repository.InvoiceRepository;
import com.invoice_management_system.service.ClientAuthService;
import com.invoice_management_system.service.PdfGenerationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/client-portal")
public class ClientPortalController {

    private final ClientAuthService clientAuthService;
    private final ClientRepository clientRepository;
    private final InvoiceRepository invoiceRepository;
    private final PdfGenerationService pdfGenerationService;

    public ClientPortalController(
            ClientAuthService clientAuthService,
            ClientRepository clientRepository,
            InvoiceRepository invoiceRepository,
            PdfGenerationService pdfGenerationService
    ) {
        this.clientAuthService = clientAuthService;
        this.clientRepository = clientRepository;
        this.invoiceRepository = invoiceRepository;
        this.pdfGenerationService = pdfGenerationService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        try {
            Client client = getClientFromHeader(authorizationHeader);
            return ResponseEntity.ok(new ClientPortalProfileResponse(
                    client.getId(),
                    client.getName(),
                    client.getEmail(),
                    client.getPhoneNumber(),
                    client.getAddress()
            ));
        } catch (BusinessException e) {
            return unauthorized(e);
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody ClientPortalUpdateRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            Client client = getClientFromHeader(authorizationHeader);
            client.setName(request.getName());
            client.setPhoneNumber(request.getPhoneNumber());
            client.setAddress(request.getAddress());
            Client updatedClient = clientRepository.save(client);

            return ResponseEntity.ok(new ClientPortalProfileResponse(
                    updatedClient.getId(),
                    updatedClient.getName(),
                    updatedClient.getEmail(),
                    updatedClient.getPhoneNumber(),
                    updatedClient.getAddress()
            ));
        } catch (BusinessException e) {
            return unauthorized(e);
        }
    }

    @GetMapping("/invoices")
    public ResponseEntity<?> getInvoices(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        try {
            Client client = getClientFromHeader(authorizationHeader);
            List<Invoice> invoices = invoiceRepository.findByClientId(client.getId());
            return ResponseEntity.ok(invoices);
        } catch (BusinessException e) {
            return unauthorized(e);
        }
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<?> getInvoice(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        try {
            Client client = getClientFromHeader(authorizationHeader);
            return invoiceRepository.findByIdAndClientId(id, client.getId())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (BusinessException e) {
            return unauthorized(e);
        }
    }

    @GetMapping("/invoices/{id}/pdf")
    public ResponseEntity<?> getInvoicePdf(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) throws Exception {
        try {
            Client client = getClientFromHeader(authorizationHeader);
            Invoice invoice = invoiceRepository.findByIdAndClientId(id, client.getId())
                    .orElseThrow(() -> new BusinessException("Invoice not found"));

            byte[] pdfBytes = pdfGenerationService.generateInvoicePdf(invoice);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "Invoice-" + invoice.getInvoiceNumber() + ".pdf");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (BusinessException e) {
            return unauthorized(e);
        }
    }

    @GetMapping("/invoices/pdf")
    public ResponseEntity<?> getAllInvoicesPdf(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) throws Exception {
        try {
            Client client = getClientFromHeader(authorizationHeader);
            List<Invoice> invoices = invoiceRepository.findByClientId(client.getId());

            if (invoices.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            byte[] pdfBytes = pdfGenerationService.generateClientInvoicesPdf(invoices);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "Client-invoices-" + client.getId() + ".pdf");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (BusinessException e) {
            return unauthorized(e);
        }
    }

    private Client getClientFromHeader(String authorizationHeader) {
        ClientPortalAccount account = clientAuthService.getAccountFromAuthorizationHeader(authorizationHeader);
        return account.getClient();
    }

    private ResponseEntity<Map<String, String>> unauthorized(BusinessException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
    }
}

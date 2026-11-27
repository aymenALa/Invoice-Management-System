package com.invoice_management_system.service;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.ClientRepository;
import com.invoice_management_system.repository.InvoiceRepository;
import com.invoice_management_system.specification.InvoiceSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;

    @Autowired
    public InvoiceService(InvoiceRepository invoiceRepository, ClientRepository clientRepository) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
    }

    @Transactional
    public Invoice createInvoice(Invoice invoice, User user) {
        validateInvoiceFields(invoice);

        String normalizedNumber = invoice.getInvoiceNumber().trim();
        if (invoiceRepository.existsByInvoiceNumber(normalizedNumber)) {
            throw new BusinessException("Invoice number already exists");
        }

        Client client = resolveOwnedClient(invoice.getClient(), user);
        invoice.setInvoiceNumber(normalizedNumber);
        invoice.setTotalAmount(normalizeAmount(invoice.getTotalAmount()));
        invoice.setClient(client);
        invoice.setUser(user);
        return invoiceRepository.save(invoice);
    }

    public Page<Invoice> getInvoicesForUser(User user, Pageable pageable) {
        return invoiceRepository.findByUser(user, pageable);
    }

    public Optional<Invoice> getInvoiceByIdForUser(Long id, User user) {
        return invoiceRepository.findByIdAndUser(id, user);
    }

    @Transactional
    public Invoice updateInvoice(Long id, Invoice updatedInvoice, User user) {
        Invoice existingInvoice = invoiceRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new BusinessException("Invoice not found or does not belong to the user"));

        validateInvoiceFields(updatedInvoice);

        String normalizedNumber = updatedInvoice.getInvoiceNumber().trim();
        if (invoiceRepository.existsByInvoiceNumberAndIdNot(normalizedNumber, existingInvoice.getId())) {
            throw new BusinessException("Invoice number already exists");
        }

        Client client = resolveOwnedClient(updatedInvoice.getClient(), user);

        existingInvoice.setInvoiceNumber(normalizedNumber);
        existingInvoice.setIssueDate(updatedInvoice.getIssueDate());
        existingInvoice.setDueDate(updatedInvoice.getDueDate());
        existingInvoice.setTotalAmount(normalizeAmount(updatedInvoice.getTotalAmount()));
        existingInvoice.setStatus(updatedInvoice.getStatus());
        existingInvoice.setClient(client);

        return invoiceRepository.save(existingInvoice);
    }

    public List<Invoice> getInvoicesForClient(Long clientId, User user) {
        return invoiceRepository.findByClientIdAndUser(clientId, user);
    }

    @Transactional
    public void deleteInvoice(Long id, User user) {
        Invoice invoice = invoiceRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new BusinessException("Invoice not found or does not belong to the user"));
        invoiceRepository.delete(invoice);
    }

    public Page<Invoice> findInvoices(
            User user,
            String invoiceNumber,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            Invoice.InvoiceStatus status,
            Client client,
            Pageable pageable
    ) {
        return invoiceRepository.findAll(
                InvoiceSpecification.findByFilters(user, invoiceNumber, startDate, endDate, minAmount, maxAmount, status, client),
                pageable
        );
    }

    public List<Invoice> getInvoicesForClientAndUser(Long clientId, User user) {
        return invoiceRepository.findByClientIdAndUser(clientId, user);
    }

    private void validateInvoiceFields(Invoice invoice) {
        if (invoice == null) {
            throw new BusinessException("Invoice payload is required");
        }
        if (invoice.getInvoiceNumber() == null || invoice.getInvoiceNumber().trim().isEmpty()) {
            throw new BusinessException("Invoice number is required");
        }
        if (invoice.getIssueDate() == null || invoice.getDueDate() == null) {
            throw new BusinessException("Issue date and due date are required");
        }
        if (invoice.getDueDate().isBefore(invoice.getIssueDate())) {
            throw new BusinessException("Due date cannot be before issue date");
        }
        if (invoice.getTotalAmount() == null || invoice.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Total amount must be greater than 0");
        }
        if (invoice.getStatus() == null) {
            throw new BusinessException("Invoice status is required");
        }
        if (invoice.getClient() == null || invoice.getClient().getId() == null) {
            throw new BusinessException("Invoice must be associated with a client");
        }
    }

    private Client resolveOwnedClient(Client clientRef, User user) {
        Client client = clientRepository.findById(clientRef.getId())
                .orElseThrow(() -> new BusinessException("Invalid client"));
        if (client.getUser() == null || !client.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Invalid client for this user");
        }
        return client;
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}

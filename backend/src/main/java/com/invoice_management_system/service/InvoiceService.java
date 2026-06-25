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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    @Autowired
    public InvoiceService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }
    
	@Autowired
    private ClientRepository clientRepository;

    public Invoice createInvoice(Invoice invoice, User user) {
        if (invoiceRepository.existsByInvoiceNumber(invoice.getInvoiceNumber())) {
            throw new BusinessException("Invoice number already exists");
        }
        if (invoice.getDueDate().isBefore(invoice.getIssueDate())) {
            throw new BusinessException("Due date cannot be before issue date");
        }
        if (invoice.getClient() == null) {
            throw new BusinessException("Invoice must be associated with a client");
        }
        // Fetch the client from the database to ensure it has the user set
        Client client = clientRepository.findById(invoice.getClient().getId())
            .orElseThrow(() -> new BusinessException("Invalid client"));
        if (client.getUser() == null || !client.getUser().equals(user)) {
            throw new BusinessException("Invalid client for this user");
        }
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

    public Invoice updateInvoice(Long id, Invoice updatedInvoice, User user) {
        Invoice existingInvoice = invoiceRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new BusinessException("Invoice not found or does not belong to the user"));
        
        existingInvoice.setInvoiceNumber(updatedInvoice.getInvoiceNumber());
        existingInvoice.setIssueDate(updatedInvoice.getIssueDate());
        existingInvoice.setDueDate(updatedInvoice.getDueDate());
        existingInvoice.setTotalAmount(updatedInvoice.getTotalAmount());
        existingInvoice.setStatus(updatedInvoice.getStatus());
        existingInvoice.setClient(updatedInvoice.getClient());        
        if (updatedInvoice.getClient() != null) {
            Client client = clientRepository.findById(updatedInvoice.getClient().getId())
                .orElseThrow(() -> new BusinessException("Invalid client"));
            if (client.getUser() == null || !client.getUser().equals(user)) {
                throw new BusinessException("Invalid client for this user");
            }
            existingInvoice.setClient(client);
        }

        return invoiceRepository.save(existingInvoice);
    }
    
    public List<Invoice> getInvoicesForClient(Long clientId, User user) {
        return invoiceRepository.findByClientIdAndUser(clientId, user);
    }

    public void deleteInvoice(Long id, User user) {
        if (!invoiceRepository.existsByIdAndUser(id, user)) {
            throw new RuntimeException("Invoice not found or does not belong to the user");
        }
        invoiceRepository.deleteById(id);
    }

    public Page<Invoice> findInvoices(
            User user,
            String invoiceNumber,
            LocalDate startDate,
            LocalDate endDate,
            Double minAmount,
            Double maxAmount,
            Invoice.Status status,
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
}
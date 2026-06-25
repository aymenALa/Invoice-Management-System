package com.invoice_management_system.service;

import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final InvoiceRepository invoiceRepository;

    @Autowired
    public DashboardService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    public Map<String, Object> getDashboardData(User user) {
        Map<String, Object> dashboardData = new HashMap<>();

        List<Invoice> allInvoices = invoiceRepository.findAllByUser(user);

        dashboardData.put("totalInvoices", allInvoices.size());
        dashboardData.put("totalAmount", calculateTotalAmount(allInvoices));
        dashboardData.put("overdueInvoices", countOverdueInvoices(allInvoices));
        dashboardData.put("recentInvoices", getRecentInvoices(user));

        return dashboardData;
    }

    private BigDecimal calculateTotalAmount(List<Invoice> invoices) {
        return invoices.stream()
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private long countOverdueInvoices(List<Invoice> invoices) {
        LocalDate today = LocalDate.now();
        return invoices.stream()
                .filter(invoice -> invoice.getDueDate().isBefore(today) && invoice.getStatus() != Invoice.InvoiceStatus.PAID)
                .count();
    }

    private List<Invoice> getRecentInvoices(User user) {
        return invoiceRepository.findTop5ByUserOrderByIssueDateDesc(user);
    }
    
    
}
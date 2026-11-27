package com.invoice_management_system.service;

import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.ClientRepository;
import com.invoice_management_system.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DashboardService {

    private static final DateTimeFormatter MONTH_LABEL_FMT = DateTimeFormatter.ofPattern("MMM yyyy");

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;

    @Autowired
    public DashboardService(InvoiceRepository invoiceRepository, ClientRepository clientRepository) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
    }

    public Map<String, Object> getDashboardData(User user) {
        Map<String, Object> dashboardData = new HashMap<>();

        List<Invoice> allInvoices = invoiceRepository.findAllByUser(user);
        LocalDate today = LocalDate.now();

        BigDecimal invoicedAmount = BigDecimal.ZERO;
        BigDecimal paidAmount = BigDecimal.ZERO;
        BigDecimal outstandingAmount = BigDecimal.ZERO;
        BigDecimal overdueAmount = BigDecimal.ZERO;
        BigDecimal draftAmount = BigDecimal.ZERO;
        BigDecimal cancelledAmount = BigDecimal.ZERO;
        long overdueCount = 0;

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (Invoice.InvoiceStatus st : Invoice.InvoiceStatus.values()) {
            statusCounts.put(st.name(), 0L);
        }

        for (Invoice inv : allInvoices) {
            BigDecimal amt = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            Invoice.InvoiceStatus st = inv.getStatus();
            statusCounts.merge(st.name(), 1L, Long::sum);

            switch (st) {
                case PAID -> {
                    paidAmount = paidAmount.add(amt);
                    invoicedAmount = invoicedAmount.add(amt);
                }
                case SENT -> {
                    invoicedAmount = invoicedAmount.add(amt);
                    outstandingAmount = outstandingAmount.add(amt);
                    if (inv.getDueDate() != null && inv.getDueDate().isBefore(today)) {
                        overdueAmount = overdueAmount.add(amt);
                        overdueCount++;
                    }
                }
                case OVERDUE -> {
                    invoicedAmount = invoicedAmount.add(amt);
                    outstandingAmount = outstandingAmount.add(amt);
                    overdueAmount = overdueAmount.add(amt);
                    overdueCount++;
                }
                case DRAFT -> draftAmount = draftAmount.add(amt);
                case CANCELLED -> cancelledAmount = cancelledAmount.add(amt);
            }
        }

        dashboardData.put("totalInvoices", allInvoices.size());
        dashboardData.put("totalClients", clientRepository.findByUser(user).size());
        dashboardData.put("totalAmount", scale(invoicedAmount));
        dashboardData.put("invoicedAmount", scale(invoicedAmount));
        dashboardData.put("paidAmount", scale(paidAmount));
        dashboardData.put("outstandingAmount", scale(outstandingAmount));
        dashboardData.put("overdueAmount", scale(overdueAmount));
        dashboardData.put("draftAmount", scale(draftAmount));
        dashboardData.put("cancelledAmount", scale(cancelledAmount));
        dashboardData.put("overdueInvoices", overdueCount);
        dashboardData.put("statusCounts", statusCounts);
        dashboardData.put("monthlyTotals", buildMonthlyTotals(allInvoices));
        dashboardData.put("recentInvoices", getRecentInvoices(user));

        return dashboardData;
    }

    private List<Map<String, Object>> buildMonthlyTotals(List<Invoice> invoices) {
        Map<YearMonth, BigDecimal> invoicedByMonth = new TreeMap<>();
        Map<YearMonth, BigDecimal> paidByMonth = new TreeMap<>();

        for (Invoice inv : invoices) {
            if (inv.getIssueDate() == null || inv.getStatus() == Invoice.InvoiceStatus.DRAFT || inv.getStatus() == Invoice.InvoiceStatus.CANCELLED) {
                continue;
            }
            YearMonth ym = YearMonth.from(inv.getIssueDate());
            BigDecimal amt = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            invoicedByMonth.merge(ym, amt, BigDecimal::add);
            if (inv.getStatus() == Invoice.InvoiceStatus.PAID) {
                paidByMonth.merge(ym, amt, BigDecimal::add);
            }
        }

        List<Map<String, Object>> series = new ArrayList<>();
        for (YearMonth ym : invoicedByMonth.keySet()) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", ym.format(MONTH_LABEL_FMT));
            point.put("invoiced", scale(invoicedByMonth.getOrDefault(ym, BigDecimal.ZERO)));
            point.put("paid", scale(paidByMonth.getOrDefault(ym, BigDecimal.ZERO)));
            series.add(point);
        }
        if (series.size() > 12) {
            return series.subList(series.size() - 12, series.size());
        }
        return series;
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private List<Invoice> getRecentInvoices(User user) {
        return invoiceRepository.findTop5ByUserOrderByIssueDateDesc(user);
    }
}

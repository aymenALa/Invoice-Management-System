package com.invoice_management_system.service;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class PdfGenerationService {

    private static final Color BRAND_INDIGO = new Color(79, 70, 229);
    private static final Color SLATE_900 = new Color(15, 23, 42);
    private static final Color SLATE_600 = new Color(71, 85, 105);
    private static final Color SLATE_200 = new Color(226, 232, 240);
    private static final Color SLATE_50 = new Color(248, 250, 252);
    private static final Color EMERALD_700 = new Color(4, 120, 87);
    private static final Color AMBER_700 = new Color(180, 83, 9);
    private static final Color RED_700 = new Color(185, 28, 28);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.US);

    public byte[] generateInvoicePdf(Invoice invoice) throws Exception {
        if (invoice == null) {
            throw new BusinessException("Invoice not found");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        PdfWriter.getInstance(document, baos);
        document.open();

        // Top Accent Bar
        PdfPTable accentBar = new PdfPTable(1);
        accentBar.setWidthPercentage(100);
        PdfPCell barCell = new PdfPCell(new Phrase(" "));
        barCell.setFixedHeight(5f);
        barCell.setBackgroundColor(BRAND_INDIGO);
        barCell.setBorder(Rectangle.NO_BORDER);
        accentBar.addCell(barCell);
        accentBar.setSpacingAfter(18f);
        document.add(accentBar);

        // Header: Logo/Brand left, INVOICE + number right
        PdfPTable headerTable = new PdfPTable(new float[]{1.2f, 1f});
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(20f);

        PdfPCell brandCell = new PdfPCell();
        brandCell.setBorder(Rectangle.NO_BORDER);
        brandCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        Image logo = loadLogoImage();
        if (logo != null) {
            logo.scaleToFit(110f, 44f);
            brandCell.addElement(logo);
        }
        Paragraph sysLabel = new Paragraph("INVOICE MANAGEMENT SYSTEM", font(9, Font.BOLD, SLATE_600));
        sysLabel.setSpacingBefore(4f);
        brandCell.addElement(sysLabel);
        headerTable.addCell(brandCell);

        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph titleP = new Paragraph("INVOICE", font(22, Font.BOLD, SLATE_900));
        titleP.setAlignment(Element.ALIGN_RIGHT);
        titleCell.addElement(titleP);

        Paragraph numP = new Paragraph("#" + safe(invoice.getInvoiceNumber()), font(12, Font.BOLD, BRAND_INDIGO));
        numP.setAlignment(Element.ALIGN_RIGHT);
        numP.setSpacingBefore(2f);
        titleCell.addElement(numP);

        Paragraph statusP = new Paragraph("STATUS: " + safe(String.valueOf(invoice.getStatus())),
                font(9, Font.BOLD, statusColor(invoice.getStatus())));
        statusP.setAlignment(Element.ALIGN_RIGHT);
        statusP.setSpacingBefore(4f);
        titleCell.addElement(statusP);
        headerTable.addCell(titleCell);
        document.add(headerTable);

        // Issuer & Recipient Boxes
        PdfPTable partyTable = new PdfPTable(new float[]{1f, 1f});
        partyTable.setWidthPercentage(100);
        partyTable.setSpacingAfter(22f);

        PdfPCell fromCell = new PdfPCell();
        fromCell.setBackgroundColor(SLATE_50);
        fromCell.setBorderColor(SLATE_200);
        fromCell.setBorderWidth(0.75f);
        fromCell.setPadding(12f);
        fromCell.addElement(new Paragraph("ISSUED BY", font(8, Font.BOLD, SLATE_600)));

        User issuer = invoice.getUser();
        if (issuer != null) {
            String fullName = (safe(issuer.getFirstName()) + " " + safe(issuer.getLastName())).trim();
            Paragraph issuerName = new Paragraph(fullName.isEmpty() ? safe(issuer.getUsername()) : fullName,
                    font(11, Font.BOLD, SLATE_900));
            issuerName.setSpacingBefore(4f);
            fromCell.addElement(issuerName);
            if (issuer.getEmail() != null && !issuer.getEmail().isBlank()) {
                fromCell.addElement(new Paragraph(issuer.getEmail(), font(9, Font.NORMAL, SLATE_600)));
            }
        } else {
            Paragraph biz = new Paragraph("Business Account", font(11, Font.BOLD, SLATE_900));
            biz.setSpacingBefore(4f);
            fromCell.addElement(biz);
        }
        partyTable.addCell(fromCell);

        PdfPCell toCell = new PdfPCell();
        toCell.setBorderColor(SLATE_200);
        toCell.setBorderWidth(0.75f);
        toCell.setPadding(12f);
        toCell.addElement(new Paragraph("BILLED TO", font(8, Font.BOLD, SLATE_600)));

        Client client = invoice.getClient();
        if (client != null) {
            Paragraph cName = new Paragraph(safe(client.getName()), font(11, Font.BOLD, SLATE_900));
            cName.setSpacingBefore(4f);
            toCell.addElement(cName);
            if (client.getAddress() != null && !client.getAddress().isBlank()) {
                toCell.addElement(new Paragraph(client.getAddress(), font(9, Font.NORMAL, SLATE_600)));
            }
            if (client.getEmail() != null && !client.getEmail().isBlank()) {
                toCell.addElement(new Paragraph(client.getEmail(), font(9, Font.NORMAL, SLATE_600)));
            }
            if (client.getPhoneNumber() != null && !client.getPhoneNumber().isBlank()) {
                toCell.addElement(new Paragraph(client.getPhoneNumber(), font(9, Font.NORMAL, SLATE_600)));
            }
        } else {
            toCell.addElement(new Paragraph("Unassigned Client", font(10, Font.NORMAL, SLATE_600)));
        }
        partyTable.addCell(toCell);
        document.add(partyTable);

        // Invoice Details Table
        PdfPTable detailTable = new PdfPTable(new float[]{2.2f, 1.4f, 1.4f, 1.2f, 1.4f});
        detailTable.setWidthPercentage(100);
        detailTable.setSpacingAfter(22f);
        addHeaderCell(detailTable, "INVOICE NUMBER", Element.ALIGN_LEFT);
        addHeaderCell(detailTable, "ISSUE DATE", Element.ALIGN_LEFT);
        addHeaderCell(detailTable, "DUE DATE", Element.ALIGN_LEFT);
        addHeaderCell(detailTable, "STATUS", Element.ALIGN_CENTER);
        addHeaderCell(detailTable, "AMOUNT", Element.ALIGN_RIGHT);

        addBodyCell(detailTable, safe(invoice.getInvoiceNumber()), Element.ALIGN_LEFT, false, SLATE_900, true);
        addBodyCell(detailTable, formatDate(invoice.getIssueDate()), Element.ALIGN_LEFT, false, SLATE_600, false);
        addBodyCell(detailTable, formatDate(invoice.getDueDate()), Element.ALIGN_LEFT, false, SLATE_600, false);
        addBodyCell(detailTable, safe(String.valueOf(invoice.getStatus())), Element.ALIGN_CENTER, false, statusColor(invoice.getStatus()), true);
        addBodyCell(detailTable, formatCurrency(invoice.getTotalAmount()), Element.ALIGN_RIGHT, false, SLATE_900, true);
        document.add(detailTable);

        // Total Summary Box
        PdfPTable totalTable = new PdfPTable(new float[]{1.5f, 1f});
        totalTable.setWidthPercentage(100);
        PdfPCell spacer = new PdfPCell(new Phrase(" "));
        spacer.setBorder(Rectangle.NO_BORDER);
        totalTable.addCell(spacer);

        PdfPCell summaryBox = new PdfPCell();
        summaryBox.setBackgroundColor(SLATE_50);
        summaryBox.setBorderColor(SLATE_200);
        summaryBox.setBorderWidth(1f);
        summaryBox.setPadding(14f);
        summaryBox.setHorizontalAlignment(Element.ALIGN_RIGHT);

        Paragraph dueLabel = new Paragraph("TOTAL AMOUNT DUE", font(8, Font.BOLD, SLATE_600));
        dueLabel.setAlignment(Element.ALIGN_RIGHT);
        summaryBox.addElement(dueLabel);

        Paragraph dueAmount = new Paragraph(formatCurrency(invoice.getTotalAmount()), font(18, Font.BOLD, BRAND_INDIGO));
        dueAmount.setAlignment(Element.ALIGN_RIGHT);
        dueAmount.setSpacingBefore(3f);
        summaryBox.addElement(dueAmount);
        totalTable.addCell(summaryBox);
        document.add(totalTable);

        Paragraph footer = new Paragraph("Generated by Invoice Management System", font(8, Font.NORMAL, SLATE_600));
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(32f);
        document.add(footer);

        document.close();
        return baos.toByteArray();
    }

    public byte[] generateClientInvoicesPdf(List<Invoice> invoices) throws Exception {
        if (invoices == null || invoices.isEmpty()) {
            throw new BusinessException("No invoices available for this client");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        PdfWriter.getInstance(document, baos);
        document.open();

        PdfPTable accentBar = new PdfPTable(1);
        accentBar.setWidthPercentage(100);
        PdfPCell barCell = new PdfPCell(new Phrase(" "));
        barCell.setFixedHeight(5f);
        barCell.setBackgroundColor(BRAND_INDIGO);
        barCell.setBorder(Rectangle.NO_BORDER);
        accentBar.addCell(barCell);
        accentBar.setSpacingAfter(18f);
        document.add(accentBar);

        PdfPTable headerTable = new PdfPTable(new float[]{1.2f, 1f});
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(20f);

        PdfPCell brandCell = new PdfPCell();
        brandCell.setBorder(Rectangle.NO_BORDER);
        Image logo = loadLogoImage();
        if (logo != null) {
            logo.scaleToFit(110f, 44f);
            brandCell.addElement(logo);
        }
        Paragraph stmtLabel = new Paragraph("CLIENT STATEMENT", font(9, Font.BOLD, SLATE_600));
        stmtLabel.setSpacingBefore(4f);
        brandCell.addElement(stmtLabel);
        headerTable.addCell(brandCell);

        Client client = invoices.get(0).getClient();
        PdfPCell clientCell = new PdfPCell();
        clientCell.setBorder(Rectangle.NO_BORDER);
        clientCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        Paragraph titleP = new Paragraph("INVOICE SUMMARY", font(18, Font.BOLD, SLATE_900));
        titleP.setAlignment(Element.ALIGN_RIGHT);
        clientCell.addElement(titleP);

        if (client != null) {
            Paragraph cName = new Paragraph(safe(client.getName()), font(11, Font.BOLD, BRAND_INDIGO));
            cName.setAlignment(Element.ALIGN_RIGHT);
            clientCell.addElement(cName);
            if (client.getEmail() != null) {
                Paragraph cEmail = new Paragraph(client.getEmail(), font(9, Font.NORMAL, SLATE_600));
                cEmail.setAlignment(Element.ALIGN_RIGHT);
                clientCell.addElement(cEmail);
            }
            if (client.getAddress() != null && !client.getAddress().isBlank()) {
                Paragraph cAddr = new Paragraph(client.getAddress(), font(9, Font.NORMAL, SLATE_600));
                cAddr.setAlignment(Element.ALIGN_RIGHT);
                clientCell.addElement(cAddr);
            }
        }
        headerTable.addCell(clientCell);
        document.add(headerTable);

        PdfPTable table = new PdfPTable(new float[]{2.2f, 1.4f, 1.4f, 1.2f, 1.4f});
        table.setWidthPercentage(100);
        table.setHeaderRows(1);
        addHeaderCell(table, "INVOICE #", Element.ALIGN_LEFT);
        addHeaderCell(table, "ISSUE DATE", Element.ALIGN_LEFT);
        addHeaderCell(table, "DUE DATE", Element.ALIGN_LEFT);
        addHeaderCell(table, "STATUS", Element.ALIGN_CENTER);
        addHeaderCell(table, "AMOUNT", Element.ALIGN_RIGHT);

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (int i = 0; i < invoices.size(); i++) {
            Invoice inv = invoices.get(i);
            boolean striped = (i % 2 == 1);
            BigDecimal amt = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            if (inv.getStatus() != Invoice.InvoiceStatus.CANCELLED) {
                totalAmount = totalAmount.add(amt);
            }
            addBodyCell(table, safe(inv.getInvoiceNumber()), Element.ALIGN_LEFT, striped, SLATE_900, true);
            addBodyCell(table, formatDate(inv.getIssueDate()), Element.ALIGN_LEFT, striped, SLATE_600, false);
            addBodyCell(table, formatDate(inv.getDueDate()), Element.ALIGN_LEFT, striped, SLATE_600, false);
            addBodyCell(table, safe(String.valueOf(inv.getStatus())), Element.ALIGN_CENTER, striped, statusColor(inv.getStatus()), true);
            addBodyCell(table, formatCurrency(amt), Element.ALIGN_RIGHT, striped, SLATE_900, true);
        }
        document.add(table);

        Paragraph summary = new Paragraph(
                "Active Statement Total (" + invoices.size() + " invoices): " + formatCurrency(totalAmount),
                font(12, Font.BOLD, BRAND_INDIGO)
        );
        summary.setAlignment(Element.ALIGN_RIGHT);
        summary.setSpacingBefore(16f);
        document.add(summary);

        document.close();
        return baos.toByteArray();
    }

    private void addHeaderCell(PdfPTable table, String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(8, Font.BOLD, Color.WHITE)));
        cell.setBackgroundColor(SLATE_900);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(8f);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, int alignment, boolean striped, Color color, boolean bold) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(9, bold ? Font.BOLD : Font.NORMAL, color)));
        cell.setBackgroundColor(striped ? SLATE_50 : Color.WHITE);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColorBottom(SLATE_200);
        cell.setBorderWidthBottom(0.5f);
        cell.setPadding(8f);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private Font font(float size, int style, Color color) {
        return FontFactory.getFont(FontFactory.HELVETICA, size, style, color);
    }

    private Image loadLogoImage() {
        try {
            ClassPathResource resource = new ClassPathResource("assets/logo-lg.png");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    return Image.getInstance(is.readAllBytes());
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private Color statusColor(Invoice.InvoiceStatus status) {
        if (status == null) return SLATE_600;
        return switch (status) {
            case PAID -> EMERALD_700;
            case OVERDUE -> RED_700;
            case SENT -> BRAND_INDIGO;
            case DRAFT -> AMBER_700;
            case CANCELLED -> SLATE_600;
        };
    }

    private String formatCurrency(BigDecimal amount) {
        BigDecimal safeAmt = amount != null ? amount : BigDecimal.ZERO;
        return NumberFormat.getCurrencyInstance(Locale.US).format(safeAmt);
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FMT) : "-";
    }

    private String safe(String val) {
        return val != null ? val : "";
    }
}

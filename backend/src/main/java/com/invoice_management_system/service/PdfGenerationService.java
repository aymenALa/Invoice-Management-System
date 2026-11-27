package com.invoice_management_system.service;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class PdfGenerationService {

    private static final DeviceRgb BRAND_INDIGO = new DeviceRgb(79, 70, 229);
    private static final DeviceRgb SLATE_900 = new DeviceRgb(15, 23, 42);
    private static final DeviceRgb SLATE_600 = new DeviceRgb(71, 85, 105);
    private static final DeviceRgb SLATE_200 = new DeviceRgb(226, 232, 240);
    private static final DeviceRgb SLATE_50 = new DeviceRgb(248, 250, 252);
    private static final DeviceRgb EMERALD_700 = new DeviceRgb(4, 120, 87);
    private static final DeviceRgb AMBER_700 = new DeviceRgb(180, 83, 9);
    private static final DeviceRgb RED_700 = new DeviceRgb(185, 28, 28);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.US);

    public byte[] generateInvoicePdf(Invoice invoice) throws Exception {
        if (invoice == null) {
            throw new BusinessException("Invoice not found");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        document.setMargins(36, 36, 36, 36);

        // Top accent bar
        Table accentBar = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        accentBar.addCell(new Cell().setHeight(5).setBackgroundColor(BRAND_INDIGO).setBorder(Border.NO_BORDER));
        accentBar.setMarginBottom(20);
        document.add(accentBar);

        // Header: Brand/Logo left, INVOICE + number right
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1.2f, 1f})).useAllAvailableWidth();
        Cell brandCell = new Cell().setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.MIDDLE);
        Image logo = loadLogoImage();
        if (logo != null) {
            logo.setWidth(110);
            brandCell.add(logo);
        }
        brandCell.add(new Paragraph("INVOICE MANAGEMENT SYSTEM")
                .setFontSize(9)
                .setBold()
                .setFontColor(SLATE_600)
                .setMarginTop(4));
        headerTable.addCell(brandCell);

        Cell titleCell = new Cell().setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);
        titleCell.add(new Paragraph("INVOICE")
                .setFontSize(22)
                .setBold()
                .setFontColor(SLATE_900));
        titleCell.add(new Paragraph("#" + safe(invoice.getInvoiceNumber()))
                .setFontSize(12)
                .setBold()
                .setFontColor(BRAND_INDIGO)
                .setMarginTop(2));
        titleCell.add(new Paragraph("STATUS: " + safe(String.valueOf(invoice.getStatus())))
                .setFontSize(9)
                .setBold()
                .setFontColor(statusColor(invoice.getStatus()))
                .setMarginTop(4));
        headerTable.addCell(titleCell);
        headerTable.setMarginBottom(24);
        document.add(headerTable);

        // Issuer & Recipient Metadata
        Table partyTable = new Table(UnitValue.createPercentArray(new float[]{1f, 1f})).useAllAvailableWidth();
        partyTable.setMarginBottom(24);

        Cell fromCell = new Cell()
                .setBorder(new SolidBorder(SLATE_200, 0.75f))
                .setBackgroundColor(SLATE_50)
                .setPadding(12);
        fromCell.add(new Paragraph("ISSUED BY").setFontSize(8).setBold().setFontColor(SLATE_600).setMarginBottom(4));
        User issuer = invoice.getUser();
        if (issuer != null) {
            String fullName = ((safe(issuer.getFirstName()) + " " + safe(issuer.getLastName())).trim());
            fromCell.add(new Paragraph(fullName.isEmpty() ? safe(issuer.getUsername()) : fullName)
                    .setFontSize(11).setBold().setFontColor(SLATE_900));
            if (issuer.getEmail() != null && !issuer.getEmail().isBlank()) {
                fromCell.add(new Paragraph(issuer.getEmail()).setFontSize(9).setFontColor(SLATE_600));
            }
        } else {
            fromCell.add(new Paragraph("Business Account").setFontSize(11).setBold().setFontColor(SLATE_900));
        }
        partyTable.addCell(fromCell);

        Cell toCell = new Cell()
                .setBorder(new SolidBorder(SLATE_200, 0.75f))
                .setPadding(12);
        toCell.add(new Paragraph("BILLED TO").setFontSize(8).setBold().setFontColor(SLATE_600).setMarginBottom(4));
        Client client = invoice.getClient();
        if (client != null) {
            toCell.add(new Paragraph(safe(client.getName())).setFontSize(11).setBold().setFontColor(SLATE_900));
            if (client.getAddress() != null && !client.getAddress().isBlank()) {
                toCell.add(new Paragraph(client.getAddress()).setFontSize(9).setFontColor(SLATE_600));
            }
            if (client.getEmail() != null && !client.getEmail().isBlank()) {
                toCell.add(new Paragraph(client.getEmail()).setFontSize(9).setFontColor(SLATE_600));
            }
            if (client.getPhoneNumber() != null && !client.getPhoneNumber().isBlank()) {
                toCell.add(new Paragraph(client.getPhoneNumber()).setFontSize(9).setFontColor(SLATE_600));
            }
        } else {
            toCell.add(new Paragraph("Unassigned Client").setFontSize(10).setFontColor(SLATE_600));
        }
        partyTable.addCell(toCell);
        document.add(partyTable);

        // Invoice Details Table
        Table detailTable = new Table(UnitValue.createPercentArray(new float[]{2.2f, 1.4f, 1.4f, 1.2f, 1.4f}))
                .useAllAvailableWidth();
        addHeaderCell(detailTable, "INVOICE NUMBER", TextAlignment.LEFT);
        addHeaderCell(detailTable, "ISSUE DATE", TextAlignment.LEFT);
        addHeaderCell(detailTable, "DUE DATE", TextAlignment.LEFT);
        addHeaderCell(detailTable, "STATUS", TextAlignment.CENTER);
        addHeaderCell(detailTable, "AMOUNT", TextAlignment.RIGHT);

        addBodyCell(detailTable, safe(invoice.getInvoiceNumber()), TextAlignment.LEFT, false, SLATE_900, true);
        addBodyCell(detailTable, formatDate(invoice.getIssueDate()), TextAlignment.LEFT, false, SLATE_600, false);
        addBodyCell(detailTable, formatDate(invoice.getDueDate()), TextAlignment.LEFT, false, SLATE_600, false);
        addBodyCell(detailTable, safe(String.valueOf(invoice.getStatus())), TextAlignment.CENTER, false, statusColor(invoice.getStatus()), true);
        addBodyCell(detailTable, formatCurrency(invoice.getTotalAmount()), TextAlignment.RIGHT, false, SLATE_900, true);

        detailTable.setMarginBottom(24);
        document.add(detailTable);

        // Total Summary Box
        Table totalTable = new Table(UnitValue.createPercentArray(new float[]{1.5f, 1f})).useAllAvailableWidth();
        totalTable.addCell(new Cell().setBorder(Border.NO_BORDER));
        Cell summaryBox = new Cell()
                .setBackgroundColor(SLATE_50)
                .setBorder(new SolidBorder(SLATE_200, 1f))
                .setPadding(14)
                .setTextAlignment(TextAlignment.RIGHT);
        summaryBox.add(new Paragraph("TOTAL AMOUNT DUE").setFontSize(8).setBold().setFontColor(SLATE_600));
        summaryBox.add(new Paragraph(formatCurrency(invoice.getTotalAmount()))
                .setFontSize(18)
                .setBold()
                .setFontColor(BRAND_INDIGO)
                .setMarginTop(2));
        totalTable.addCell(summaryBox);
        document.add(totalTable);

        document.add(new Paragraph("Generated by Invoice Management System")
                .setFontSize(8)
                .setFontColor(SLATE_600)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(36));

        document.close();
        return baos.toByteArray();
    }

    public byte[] generateClientInvoicesPdf(List<Invoice> invoices) throws Exception {
        if (invoices == null || invoices.isEmpty()) {
            throw new BusinessException("No invoices available for this client");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        document.setMargins(36, 36, 36, 36);

        Table accentBar = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        accentBar.addCell(new Cell().setHeight(5).setBackgroundColor(BRAND_INDIGO).setBorder(Border.NO_BORDER));
        accentBar.setMarginBottom(20);
        document.add(accentBar);

        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1.2f, 1f})).useAllAvailableWidth();
        Cell brandCell = new Cell().setBorder(Border.NO_BORDER);
        Image logo = loadLogoImage();
        if (logo != null) {
            logo.setWidth(110);
            brandCell.add(logo);
        }
        brandCell.add(new Paragraph("CLIENT STATEMENT")
                .setFontSize(9).setBold().setFontColor(SLATE_600).setMarginTop(4));
        headerTable.addCell(brandCell);

        Client client = invoices.get(0).getClient();
        Cell clientCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
        clientCell.add(new Paragraph("INVOICE SUMMARY").setFontSize(18).setBold().setFontColor(SLATE_900));
        if (client != null) {
            clientCell.add(new Paragraph(safe(client.getName())).setFontSize(11).setBold().setFontColor(BRAND_INDIGO));
            if (client.getEmail() != null) {
                clientCell.add(new Paragraph(client.getEmail()).setFontSize(9).setFontColor(SLATE_600));
            }
            if (client.getAddress() != null && !client.getAddress().isBlank()) {
                clientCell.add(new Paragraph(client.getAddress()).setFontSize(9).setFontColor(SLATE_600));
            }
        }
        headerTable.addCell(clientCell);
        headerTable.setMarginBottom(20);
        document.add(headerTable);

        Table table = new Table(UnitValue.createPercentArray(new float[]{2.2f, 1.4f, 1.4f, 1.2f, 1.4f}))
                .useAllAvailableWidth();
        addHeaderCell(table, "INVOICE #", TextAlignment.LEFT);
        addHeaderCell(table, "ISSUE DATE", TextAlignment.LEFT);
        addHeaderCell(table, "DUE DATE", TextAlignment.LEFT);
        addHeaderCell(table, "STATUS", TextAlignment.CENTER);
        addHeaderCell(table, "AMOUNT", TextAlignment.RIGHT);

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (int i = 0; i < invoices.size(); i++) {
            Invoice inv = invoices.get(i);
            boolean striped = (i % 2 == 1);
            BigDecimal amt = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            if (inv.getStatus() != Invoice.InvoiceStatus.CANCELLED) {
                totalAmount = totalAmount.add(amt);
            }
            addBodyCell(table, safe(inv.getInvoiceNumber()), TextAlignment.LEFT, striped, SLATE_900, true);
            addBodyCell(table, formatDate(inv.getIssueDate()), TextAlignment.LEFT, striped, SLATE_600, false);
            addBodyCell(table, formatDate(inv.getDueDate()), TextAlignment.LEFT, striped, SLATE_600, false);
            addBodyCell(table, safe(String.valueOf(inv.getStatus())), TextAlignment.CENTER, striped, statusColor(inv.getStatus()), true);
            addBodyCell(table, formatCurrency(amt), TextAlignment.RIGHT, striped, SLATE_900, true);
        }

        document.add(table);

        Paragraph summary = new Paragraph("Active Statement Total (" + invoices.size() + " invoices): " + formatCurrency(totalAmount))
                .setFontSize(12)
                .setBold()
                .setFontColor(BRAND_INDIGO)
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginTop(16);
        document.add(summary);

        document.close();
        return baos.toByteArray();
    }

    private void addHeaderCell(Table table, String text, TextAlignment alignment) {
        Cell cell = new Cell()
                .setBackgroundColor(SLATE_900)
                .setBorder(Border.NO_BORDER)
                .setPadding(8)
                .setTextAlignment(alignment);
        cell.add(new Paragraph(text).setFontSize(8).setBold().setFontColor(ColorConstants.WHITE));
        table.addHeaderCell(cell);
    }

    private void addBodyCell(Table table, String text, TextAlignment alignment, boolean striped, Color color, boolean bold) {
        Cell cell = new Cell()
                .setBackgroundColor(striped ? SLATE_50 : ColorConstants.WHITE)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(SLATE_200, 0.5f))
                .setPadding(8)
                .setTextAlignment(alignment);
        Paragraph p = new Paragraph(text).setFontSize(9).setFontColor(color);
        if (bold) {
            p.setBold();
        }
        cell.add(p);
        table.addCell(cell);
    }

    private Image loadLogoImage() {
        try {
            ClassPathResource resource = new ClassPathResource("assets/logo-lg.png");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    return new Image(ImageDataFactory.create(is.readAllBytes()));
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

    private String formatDate(java.time.LocalDate date) {
        return date != null ? date.format(DATE_FMT) : "-";
    }

    private String safe(String val) {
        return val != null ? val : "";
    }
}

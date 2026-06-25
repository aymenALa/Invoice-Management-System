package com.invoice_management_system.service;

import com.invoice_management_system.model.Invoice;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.Property;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;

@Service
public class PdfGenerationService {

	public byte[] generateInvoicePdf(Invoice invoice) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Add logo
        Image logo = new Image(ImageDataFactory.create("src/main/resources/assets/logo-lg.png"))
                .setWidth(150)
                .setMarginBottom(30);
        document.add(logo);

        // Add header
        Paragraph header = new Paragraph("I N V O I C E")
                .setFontSize(24).setTextAlignment(TextAlignment.CENTER)
                .setBold();
        document.add(header);


        // Add client information
        Paragraph clientName = new Paragraph("ISSUED TO:")
                .setMarginTop(20)
                .setBold();
        Paragraph clientAddress = new Paragraph(invoice.getClient().getName() + "\n" +
                invoice.getClient().getAddress() + "\n" +
                invoice.getClient().getEmail() + "\n" +
                invoice.getClient().getPhoneNumber());
        document.add(clientName);
        document.add(clientAddress);
        //add invoice details
        Paragraph tableHeader = new Paragraph("INVOICE NUMBER         ISSUE DATE            DUE DATE              STATUS         PRICE")
                .setMarginTop(20).setMarginRight(50)
                .setMarginBottom(10)
                .setBold();
        document.add(tableHeader);

        Paragraph invoiceDetails1 = new Paragraph(invoice.getInvoiceNumber())
                .setMarginRight(100)
                .setMarginBottom(5);
        Paragraph invoiceDetails2 = new Paragraph(String.valueOf(invoice.getIssueDate()))
                .setMarginRight(50)
                .setMarginBottom(5);
        Paragraph invoiceDetails3 = new Paragraph(String.valueOf(invoice.getDueDate()))
                .setMarginRight(50)
                .setMarginBottom(5);
        Paragraph invoiceDetails4 = new Paragraph(String.valueOf(invoice.getStatus()))
                .setMarginRight(50)
                .setMarginBottom(5);
        Paragraph invoiceDetails5 = new Paragraph("$" + invoice.getTotalAmount())
                .setMarginBottom(5);

        document.add(new Paragraph()
                .setMarginBottom(10)
                .add(invoiceDetails1)
                .add(invoiceDetails2)
                .add(invoiceDetails3)
                .add(invoiceDetails4)
                .add(invoiceDetails5));

        // Add total amount
        Paragraph totalAmountParagraph = new Paragraph("TOTAL AMOUNT     $" + invoice.getTotalAmount())
                .setMarginTop(20)
                .setTextAlignment(TextAlignment.RIGHT)
                .setBold();
        document.add(totalAmountParagraph);

        document.close();

        return baos.toByteArray();
    }
    public byte[] generateClientInvoicesPdf(List<Invoice> invoices) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Add logo
        Image logo = new Image(ImageDataFactory.create("src/main/resources/assets/logo-lg.png"))
                .setWidth(150)
                .setMarginBottom(30);
        document.add(logo);

        Paragraph clientInvoicesSummary = new Paragraph("C L I E N T  I N V O I C E S  S U M M A R Y")
                .setFontSize(24).setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20)
                .setMarginBottom(10)
                .setBold();
        document.add(clientInvoicesSummary);

        // Add client information
        Paragraph clientName = new Paragraph(" S U M M A R Y  F O R :")
                .setMarginTop(20)
                .setBold();
        Paragraph clientAddress = new Paragraph(invoices.get(0).getClient().getName() + "\n" +
                invoices.get(0).getClient().getAddress() + "\n" +
                invoices.get(0).getClient().getEmail() + "\n" +
                invoices.get(0).getClient().getPhoneNumber());
        document.add(clientName);
        document.add(clientAddress);


        Paragraph totalInvoicesCount = new Paragraph("Total Invoices: " + invoices.size())
                .setMarginBottom(20);
        document.add(totalInvoicesCount);

        Paragraph tableHeader = new Paragraph("INVOICE NUMBER         ISSUE DATE            DUE DATE              STATUS         PRICE")
                .setMarginTop(20).setMarginRight(50)
                .setMarginBottom(10)
                .setBold();
        document.add(tableHeader);

        BigDecimal totalAmount = invoices.stream()
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (Invoice invoice : invoices) {
            Paragraph invoiceDetails1 = new Paragraph(invoice.getInvoiceNumber())
                    .setMarginRight(100)
                    .setMarginBottom(5);
            Paragraph invoiceDetails2 = new Paragraph(String.valueOf(invoice.getIssueDate()))
                    .setMarginRight(50)
                    .setMarginBottom(5);
            Paragraph invoiceDetails3 = new Paragraph(String.valueOf(invoice.getDueDate()))
                    .setMarginRight(50)
                    .setMarginBottom(5);
            Paragraph invoiceDetails4 = new Paragraph(String.valueOf(invoice.getStatus()))
                    .setMarginRight(50)
                    .setMarginBottom(5);
            Paragraph invoiceDetails5 = new Paragraph("$" + invoice.getTotalAmount())
                    .setMarginBottom(5);

            document.add(new Paragraph()
                    .setMarginBottom(10)
                    .add(invoiceDetails1)
                    .add(invoiceDetails2)
                    .add(invoiceDetails3)
                    .add(invoiceDetails4)
                    .add(invoiceDetails5));
        }

        Paragraph totalAmountParagraph = new Paragraph("TOTAL AMOUNT     $" + totalAmount)
                .setMarginTop(20)
                .setTextAlignment(TextAlignment.RIGHT)
                .setBold();
        document.add(totalAmountParagraph);

        document.close();
        return baos.toByteArray();
    }


	/*public byte[] generateInvoicePdf(Invoice invoice) throws Exception {
	    ByteArrayOutputStream baos = new ByteArrayOutputStream();
	    PdfWriter writer = new PdfWriter(baos);
	    PdfDocument pdf = new PdfDocument(writer);
	    Document document = new Document(pdf);

	    document.add(new Paragraph("Invoice Number: " + invoice.getInvoiceNumber()));
	    document.add(new Paragraph("Issue Date: " + invoice.getIssueDate()));
	    document.add(new Paragraph("Due Date: " + invoice.getDueDate()));
	    document.add(new Paragraph("Total Amount: $" + invoice.getTotalAmount()));
	    document.add(new Paragraph("Status: " + invoice.getStatus()));
	    if (invoice.getClient() != null) {
	        document.add(new Paragraph("Client: " + invoice.getClient().getName()));
	    } else {
	        document.add(new Paragraph("Client: Not specified"));
	    }

	    document.close();

	    return baos.toByteArray();
	}

	public byte[] generateClientInvoicesPdf(List<Invoice> invoices) throws Exception {
	    ByteArrayOutputStream baos = new ByteArrayOutputStream();
	    PdfWriter writer = new PdfWriter(baos);
	    PdfDocument pdf = new PdfDocument(writer);
	    Document document = new Document(pdf);

	    document.add(new Paragraph("Client Invoices Summary"));
	    document.add(new Paragraph("Total Invoices: " + invoices.size()));

	    for (Invoice invoice : invoices) {
	        document.add(new Paragraph("--------------------"));
	        document.add(new Paragraph("Invoice Number: " + invoice.getInvoiceNumber()));
	        document.add(new Paragraph("Issue Date: " + invoice.getIssueDate()));
	        document.add(new Paragraph("Due Date: " + invoice.getDueDate()));
	        document.add(new Paragraph("Total Amount: $" + invoice.getTotalAmount()));
	        document.add(new Paragraph("Status: " + invoice.getStatus()));
	    }

	    document.close();
	    return baos.toByteArray();
	}
	
	*/
}

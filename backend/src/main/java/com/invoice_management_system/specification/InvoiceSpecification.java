package com.invoice_management_system.specification;

import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class InvoiceSpecification {

    public static Specification<Invoice> findByFilters(
            User user,
            String invoiceNumber,
            LocalDate startDate,
            LocalDate endDate,
            Double minAmount,
            Double maxAmount,
            Invoice.Status status,
            Client client
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("user"), user));

            if (invoiceNumber != null && !invoiceNumber.isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("invoiceNumber"), "%" + invoiceNumber + "%"));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("issueDate"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("issueDate"), endDate));
            }

            if (minAmount != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("totalAmount"), minAmount));
            }

            if (maxAmount != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("totalAmount"), maxAmount));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            
            if (client != null) {
                predicates.add(criteriaBuilder.equal(root.get("client"), client));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
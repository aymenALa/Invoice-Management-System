package com.invoice_management_system.repository;

import com.invoice_management_system.model.Invoice;
import com.invoice_management_system.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {
    Page<Invoice> findByUser(User user, Pageable pageable);
    Page<Invoice> findByUserAndStatusIn(User user, List<Invoice.Status> statuses, Pageable pageable);
    boolean existsByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByIdAndUser(Long id, User user);
    boolean existsByIdAndUser(Long id, User user);
    List<Invoice> findTop5ByUserOrderByIssueDateDesc(User user);
    List<Invoice> findAllByUser(User user);
    List<Invoice> findByClientIdAndUser(Long clientId, User user);
//    List<Invoice> findByClientID(Long clientId);
    
}
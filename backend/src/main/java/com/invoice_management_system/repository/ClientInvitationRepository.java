package com.invoice_management_system.repository;

import com.invoice_management_system.model.ClientInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientInvitationRepository extends JpaRepository<ClientInvitation, Long> {
    List<ClientInvitation> findByClient_EmailIgnoreCaseAndUsedAtIsNullOrderByCreatedAtDesc(String email);
    Optional<ClientInvitation> findFirstByClientIdAndUsedAtIsNullOrderByCreatedAtDesc(Long clientId);
    List<ClientInvitation> findByClientIdAndUsedAtIsNull(Long clientId);
}

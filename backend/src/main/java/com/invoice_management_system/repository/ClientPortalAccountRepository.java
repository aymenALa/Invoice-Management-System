package com.invoice_management_system.repository;

import com.invoice_management_system.model.ClientPortalAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientPortalAccountRepository extends JpaRepository<ClientPortalAccount, Long> {
    Optional<ClientPortalAccount> findByEmailIgnoreCase(String email);
    Optional<ClientPortalAccount> findByClientId(Long clientId);
    boolean existsByClientId(Long clientId);
    boolean existsByEmailIgnoreCase(String email);
}

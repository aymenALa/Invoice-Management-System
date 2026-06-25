package com.invoice_management_system.repository;

import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository

public interface ClientRepository extends JpaRepository<Client, Long> {
	

	
    List<Client> findByUser(User user);
    boolean existsByEmailAndUser(String email, User user);
    
}
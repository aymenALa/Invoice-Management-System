package com.invoice_management_system.controller;

import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.User;
import com.invoice_management_system.service.ClientService;
import com.invoice_management_system.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;
    private final UserService userService;

    @Autowired
    public ClientController(ClientService clientService, UserService userService) {
        this.clientService = clientService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Client> createClient(@Valid @RequestBody Client client, Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        Client createdClient = clientService.createClient(client, user);
        return ResponseEntity.ok(createdClient);
    }

    @GetMapping
    public ResponseEntity<List<Client>> getAllClients(Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        List<Client> clients = clientService.getClientsForUser(user);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Client> getClient(@PathVariable Long id, Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        Client client = clientService.getClientById(id, user);
        return ResponseEntity.ok(client);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Client> updateClient(@PathVariable Long id, @Valid @RequestBody Client client, Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        Client updatedClient = clientService.updateClient(id, client, user);
        return ResponseEntity.ok(updatedClient);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id, Authentication authentication) {
        User user = userService.getUserFromAuthentication(authentication);
        clientService.deleteClient(id, user);
        return ResponseEntity.noContent().build();
    }
}
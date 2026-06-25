package com.invoice_management_system.service;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;

    @Autowired
    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public Client createClient(Client client, User user) {
        if (clientRepository.existsByEmailAndUser(client.getEmail(), user)) {
            throw new BusinessException("A client with this email already exists");
        }
        client.setUser(user);  // Ensure the user is set
        return clientRepository.save(client);
    }

    public List<Client> getClientsForUser(User user) {
        return clientRepository.findByUser(user);
    }

    public Client getClientById(Long id, User user) {
        return clientRepository.findById(id)
                .filter(client -> client.getUser().equals(user))
                .orElseThrow(() -> new BusinessException("Client not found or does not belong to user"));
    }

    public Client updateClient(Long id, Client updatedClient, User user) {
        Client existingClient = getClientById(id, user);
        existingClient.setName(updatedClient.getName());
        existingClient.setEmail(updatedClient.getEmail());
        existingClient.setPhoneNumber(updatedClient.getPhoneNumber());
        existingClient.setAddress(updatedClient.getAddress());
        return clientRepository.save(existingClient);
    }

    public void deleteClient(Long id, User user) {
        Client client = getClientById(id, user);
        clientRepository.delete(client);
    }
}
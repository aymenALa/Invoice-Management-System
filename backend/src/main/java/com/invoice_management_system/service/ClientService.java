package com.invoice_management_system.service;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.ClientInvitationRepository;
import com.invoice_management_system.repository.ClientPortalAccountRepository;
import com.invoice_management_system.repository.ClientRepository;
import com.invoice_management_system.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final InvoiceRepository invoiceRepository;
    private final ClientInvitationRepository invitationRepository;
    private final ClientPortalAccountRepository portalAccountRepository;

    @Autowired
    public ClientService(
            ClientRepository clientRepository,
            InvoiceRepository invoiceRepository,
            ClientInvitationRepository invitationRepository,
            ClientPortalAccountRepository portalAccountRepository
    ) {
        this.clientRepository = clientRepository;
        this.invoiceRepository = invoiceRepository;
        this.invitationRepository = invitationRepository;
        this.portalAccountRepository = portalAccountRepository;
    }

    public Client createClient(Client client, User user) {
        String normalizedEmail = client.getEmail() != null ? client.getEmail().trim().toLowerCase() : "";
        if (clientRepository.existsByEmailIgnoreCaseAndUser(normalizedEmail, user)) {
            throw new BusinessException("A client with this email already exists");
        }
        client.setEmail(normalizedEmail);
        client.setUser(user);
        return clientRepository.save(client);
    }

    public List<Client> getClientsForUser(User user) {
        return clientRepository.findByUser(user);
    }

    public Client getClientById(Long id, User user) {
        return clientRepository.findById(id)
                .filter(client -> client.getUser() != null && client.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new BusinessException("Client not found or does not belong to user"));
    }

    @Transactional
    public Client updateClient(Long id, Client updatedClient, User user) {
        Client existingClient = getClientById(id, user);
        String normalizedEmail = updatedClient.getEmail() != null ? updatedClient.getEmail().trim().toLowerCase() : "";

        if (clientRepository.existsByEmailIgnoreCaseAndUserAndIdNot(normalizedEmail, user, id)) {
            throw new BusinessException("A client with this email already exists");
        }

        existingClient.setName(updatedClient.getName().trim());
        existingClient.setEmail(normalizedEmail);
        existingClient.setPhoneNumber(updatedClient.getPhoneNumber());
        existingClient.setAddress(updatedClient.getAddress());

        portalAccountRepository.findByClientId(id).ifPresent(account -> {
            if (!normalizedEmail.equalsIgnoreCase(account.getEmail())) {
                if (portalAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                    throw new BusinessException("Another client portal account already uses this email");
                }
                account.setEmail(normalizedEmail);
                portalAccountRepository.save(account);
            }
        });

        return clientRepository.save(existingClient);
    }

    @Transactional
    public void deleteClient(Long id, User user) {
        Client client = getClientById(id, user);
        if (invoiceRepository.existsByClientIdAndUser(id, user)) {
            throw new BusinessException("Cannot delete client with existing invoices. Delete or reassign their invoices first.");
        }
        invitationRepository.deleteByClientId(id);
        portalAccountRepository.deleteByClientId(id);
        clientRepository.delete(client);
    }
}

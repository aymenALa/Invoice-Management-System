package com.invoice_management_system.service;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.ClientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    private ClientService clientService;
    private User user;

    @BeforeEach
    void setUp() {
        clientService = new ClientService(clientRepository);
        user = new User();
        user.setId(1L);
        user.setUsername("owner");
        user.setEmail("owner@example.com");
        user.setPassword("password");
    }

    @Test
    void createClientSetsUserAndSavesWhenEmailIsUnique() {
        Client client = client("Acme", "billing@acme.com");

        when(clientRepository.existsByEmailAndUser(client.getEmail(), user)).thenReturn(false);
        when(clientRepository.save(client)).thenReturn(client);

        Client result = clientService.createClient(client, user);

        assertSame(client, result);
        assertSame(user, client.getUser());
        verify(clientRepository).save(client);
    }

    @Test
    void createClientThrowsWhenEmailAlreadyExistsForUser() {
        Client client = client("Acme", "billing@acme.com");

        when(clientRepository.existsByEmailAndUser(client.getEmail(), user)).thenReturn(true);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> clientService.createClient(client, user)
        );

        assertEquals("A client with this email already exists", exception.getMessage());
        verify(clientRepository, never()).save(any(Client.class));
    }

    @Test
    void getClientsForUserReturnsRepositoryClients() {
        List<Client> clients = List.of(client("Acme", "billing@acme.com"));

        when(clientRepository.findByUser(user)).thenReturn(clients);

        assertSame(clients, clientService.getClientsForUser(user));
    }

    @Test
    void getClientByIdReturnsClientWhenItBelongsToUser() {
        Client client = client("Acme", "billing@acme.com");
        client.setUser(user);

        when(clientRepository.findById(10L)).thenReturn(Optional.of(client));

        assertSame(client, clientService.getClientById(10L, user));
    }

    @Test
    void getClientByIdThrowsWhenClientDoesNotBelongToUser() {
        User anotherUser = new User();
        anotherUser.setId(2L);

        Client client = client("Acme", "billing@acme.com");
        client.setUser(anotherUser);

        when(clientRepository.findById(10L)).thenReturn(Optional.of(client));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> clientService.getClientById(10L, user)
        );

        assertEquals("Client not found or does not belong to user", exception.getMessage());
    }

    @Test
    void updateClientUpdatesExistingClientAndSaves() {
        Client existingClient = client("Old name", "old@example.com");
        existingClient.setUser(user);
        Client updatedClient = new Client("New name", "new@example.com", "555-0100", "New address", null);

        when(clientRepository.findById(10L)).thenReturn(Optional.of(existingClient));
        when(clientRepository.save(existingClient)).thenReturn(existingClient);

        Client result = clientService.updateClient(10L, updatedClient, user);

        assertSame(existingClient, result);
        assertEquals("New name", existingClient.getName());
        assertEquals("new@example.com", existingClient.getEmail());
        assertEquals("555-0100", existingClient.getPhoneNumber());
        assertEquals("New address", existingClient.getAddress());
        verify(clientRepository).save(existingClient);
    }

    @Test
    void deleteClientDeletesClientWhenItBelongsToUser() {
        Client client = client("Acme", "billing@acme.com");
        client.setUser(user);

        when(clientRepository.findById(10L)).thenReturn(Optional.of(client));

        clientService.deleteClient(10L, user);

        verify(clientRepository).delete(client);
    }

    private Client client(String name, String email) {
        return new Client(name, email, "555-1234", "Main Street", null);
    }
}

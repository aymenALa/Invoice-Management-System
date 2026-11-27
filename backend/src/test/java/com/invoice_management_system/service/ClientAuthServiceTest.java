package com.invoice_management_system.service;

import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.ClientPortalAccount;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.ClientInvitationRepository;
import com.invoice_management_system.repository.ClientPortalAccountRepository;
import com.invoice_management_system.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClientAuthServiceTest {

    @Mock
    private ClientService clientService;
    @Mock
    private ClientInvitationRepository invitationRepository;
    @Mock
    private ClientPortalAccountRepository portalAccountRepository;
    @Mock
    private JavaMailSender mailSender;

    private JwtUtil jwtUtil;
    private ClientAuthService clientAuthService;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "test-secret-key-for-unit-tests-at-least-32-chars");
        clientAuthService = new ClientAuthService(
                clientService,
                invitationRepository,
                portalAccountRepository,
                new BCryptPasswordEncoder(),
                jwtUtil,
                mailSender
        );
    }

    @Test
    void blockedClientAccountCannotUsePreviouslyIssuedToken() {
        User owner = new User();
        owner.setId(1L);
        Client client = new Client("Northwind", "billing@northwind.example", "555", "Addr", owner);
        client.setId(10L);

        ClientPortalAccount account = new ClientPortalAccount();
        account.setId(77L);
        account.setClient(client);
        account.setEmail("billing@northwind.example");
        account.setEnabled(false);

        String token = jwtUtil.generateClientToken(77L, 10L, "billing@northwind.example");
        when(portalAccountRepository.findById(77L)).thenReturn(Optional.of(account));

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> clientAuthService.getAccountFromAuthorizationHeader("Bearer " + token)
        );
        assertEquals("Your client portal account is blocked. Please contact your provider.", ex.getMessage());
    }
}

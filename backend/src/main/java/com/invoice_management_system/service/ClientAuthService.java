package com.invoice_management_system.service;

import com.invoice_management_system.dto.ClientInviteResponse;
import com.invoice_management_system.dto.ClientLoginResponse;
import com.invoice_management_system.dto.ClientPortalAccessResponse;
import com.invoice_management_system.exception.BusinessException;
import com.invoice_management_system.model.Client;
import com.invoice_management_system.model.ClientInvitation;
import com.invoice_management_system.model.ClientPortalAccount;
import com.invoice_management_system.model.User;
import com.invoice_management_system.repository.ClientInvitationRepository;
import com.invoice_management_system.repository.ClientPortalAccountRepository;
import com.invoice_management_system.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClientAuthService {

    private static final int INVITATION_CODE_LENGTH = 8;
    private static final int INVITATION_EXPIRATION_DAYS = 7;
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final ClientService clientService;
    private final ClientInvitationRepository invitationRepository;
    private final ClientPortalAccountRepository portalAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public ClientAuthService(
            ClientService clientService,
            ClientInvitationRepository invitationRepository,
            ClientPortalAccountRepository portalAccountRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            JavaMailSender mailSender
    ) {
        this.clientService = clientService;
        this.invitationRepository = invitationRepository;
        this.portalAccountRepository = portalAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mailSender = mailSender;
    }

    public ClientInviteResponse inviteClient(Long clientId, User user) {
        Client client = clientService.getClientById(clientId, user);

        if (portalAccountRepository.existsByClientId(client.getId())) {
            throw new BusinessException("This client already has portal access");
        }

        return invitationRepository.findFirstByClientIdAndUsedAtIsNullOrderByCreatedAtDesc(client.getId())
                .filter(invitation -> invitation.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(invitation -> new ClientInviteResponse(
                        client.getId(),
                        client.getEmail(),
                        invitation.getInvitationCode(),
                        invitation.getExpiresAt()
                ))
                .orElseGet(() -> createInvitation(client, user));
    }

    public ClientInviteResponse regenerateClientInvitation(Long clientId, User user) {
        Client client = clientService.getClientById(clientId, user);

        if (portalAccountRepository.existsByClientId(client.getId())) {
            throw new BusinessException("This client already has portal access");
        }

        invalidateOpenInvitations(client.getId());
        return createInvitation(client, user);
    }

    public ClientInviteResponse sendClientInvitation(Long clientId, User user) {
        ClientInviteResponse response = inviteClient(clientId, user);
        Client client = clientService.getClientById(clientId, user);
        sendInvitationEmail(client, response.getInvitationCode(), response.getExpiresAt());

        invitationRepository.findFirstByClientIdAndUsedAtIsNullOrderByCreatedAtDesc(client.getId())
                .ifPresent(invitation -> {
                    invitation.setSentAt(LocalDateTime.now());
                    invitationRepository.save(invitation);
                });

        return response;
    }

    public ClientPortalAccessResponse getClientPortalAccess(Long clientId, User user) {
        Client client = clientService.getClientById(clientId, user);
        return portalAccountRepository.findByClientId(client.getId())
                .map(account -> new ClientPortalAccessResponse(client.getId(), true, account.isEnabled()))
                .orElseGet(() -> new ClientPortalAccessResponse(client.getId(), false, false));
    }

    public ClientPortalAccessResponse setClientPortalAccess(Long clientId, User user, boolean enabled) {
        Client client = clientService.getClientById(clientId, user);
        ClientPortalAccount account = portalAccountRepository.findByClientId(client.getId())
                .orElseThrow(() -> new BusinessException("This client has not activated portal access yet"));

        account.setEnabled(enabled);
        portalAccountRepository.save(account);

        return new ClientPortalAccessResponse(client.getId(), true, account.isEnabled());
    }

    private ClientInviteResponse createInvitation(Client client, User user) {
        String invitationCode = generateInvitationCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(INVITATION_EXPIRATION_DAYS);

        ClientInvitation invitation = new ClientInvitation();
        invitation.setClient(client);
        invitation.setCreatedBy(user);
        invitation.setInvitationCode(invitationCode);
        invitation.setCodeHash(passwordEncoder.encode(invitationCode));
        invitation.setExpiresAt(expiresAt);
        invitationRepository.save(invitation);

        return new ClientInviteResponse(client.getId(), client.getEmail(), invitationCode, expiresAt);
    }

    public ClientLoginResponse activateClient(String email, String invitationCode, String password) {
        ClientInvitation invitation = findMatchingInvitation(email, invitationCode);
        Client client = invitation.getClient();

        if (portalAccountRepository.existsByClientId(client.getId())) {
            throw new BusinessException("This client portal account is already active");
        }

        if (portalAccountRepository.existsByEmailIgnoreCase(client.getEmail())) {
            throw new BusinessException("A client portal account already exists for this email");
        }

        ClientPortalAccount account = new ClientPortalAccount();
        account.setClient(client);
        account.setEmail(client.getEmail().trim().toLowerCase());
        account.setPassword(passwordEncoder.encode(password));
        account = portalAccountRepository.save(account);

        invitation.setUsedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        return buildLoginResponse(account);
    }

    public ClientLoginResponse loginClient(String email, String password) {
        ClientPortalAccount account = portalAccountRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new BusinessException("Invalid email or password"));

        if (!account.isEnabled()) {
            throw new BusinessException("Your client portal account is blocked. Please contact your provider.");
        }

        if (!passwordEncoder.matches(password, account.getPassword())) {
            throw new BusinessException("Invalid email or password");
        }

        account.setLastLogin(LocalDateTime.now());
        portalAccountRepository.save(account);

        return buildLoginResponse(account);
    }

    public ClientPortalAccount getAccountFromAuthorizationHeader(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new BusinessException("Missing client authorization token");
        }

        String token = authorizationHeader.substring(7);
        if (!jwtUtil.validateClientToken(token)) {
            throw new BusinessException("Invalid client authorization token");
        }

        Long accountId = jwtUtil.extractClientAccountId(token);
        return portalAccountRepository.findById(accountId)
                .map(account -> {
                    if (!account.isEnabled()) {
                        throw new BusinessException("Your client portal account is blocked. Please contact your provider.");
                    }
                    return account;
                })
                .orElseThrow(() -> new BusinessException("Client portal account not found"));
    }

    private ClientInvitation findMatchingInvitation(String email, String invitationCode) {
        List<ClientInvitation> invitations = invitationRepository
                .findByClient_EmailIgnoreCaseAndUsedAtIsNullOrderByCreatedAtDesc(email.trim());

        return invitations.stream()
                .filter(invitation -> invitation.getExpiresAt().isAfter(LocalDateTime.now()))
                .filter(invitation -> passwordEncoder.matches(invitationCode, invitation.getCodeHash()))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Invalid or expired invitation code"));
    }

    private void invalidateOpenInvitations(Long clientId) {
        List<ClientInvitation> openInvitations = invitationRepository.findByClientIdAndUsedAtIsNull(clientId);
        LocalDateTime now = LocalDateTime.now();
        openInvitations.forEach(invitation -> invitation.setUsedAt(now));
        invitationRepository.saveAll(openInvitations);
    }

    private void sendInvitationEmail(Client client, String invitationCode, LocalDateTime expiresAt) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(client.getEmail());
        message.setSubject("Invoice Management System client portal invitation");
        message.setText(
                "Hello " + client.getName() + ",\n\n" +
                "You have been invited to access your invoices in the client portal.\n\n" +
                "Open the portal here:\n" + frontendUrl + "/auth\n\n" +
                "Use this email address: " + client.getEmail() + "\n" +
                "Invitation code: " + invitationCode + "\n\n" +
                "This code expires on " + expiresAt + "."
        );

        mailSender.send(message);
    }

    private ClientLoginResponse buildLoginResponse(ClientPortalAccount account) {
        Client client = account.getClient();
        String token = jwtUtil.generateClientToken(account.getId(), client.getId(), account.getEmail());
        return new ClientLoginResponse(token, client.getId(), client.getName(), account.getEmail());
    }

    private String generateInvitationCode() {
        StringBuilder code = new StringBuilder(INVITATION_CODE_LENGTH);
        for (int i = 0; i < INVITATION_CODE_LENGTH; i++) {
            code.append(CODE_ALPHABET.charAt(secureRandom.nextInt(CODE_ALPHABET.length())));
        }
        return code.toString();
    }
}

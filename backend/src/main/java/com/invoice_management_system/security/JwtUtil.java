package com.invoice_management_system.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private final Environment environment;

    public JwtUtil(Environment environment) {
        this.environment = environment;
    }

    public JwtUtil() {
        this.environment = null;
    }

    @PostConstruct
    void validateProductionSecret() {
        boolean isProd = environment != null && environment.acceptsProfiles(Profiles.of("prod"));
        if (isProd && (secret == null || secret.isBlank() || secret.contains("change-me") || secret.length() < 32)) {
            throw new IllegalStateException("Production profile requires a strong JWT_SECRET environment variable (min 32 chars).");
        }
    }

    private Key getSigningKey() {
        byte[] keyBytes = secret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("accountType", "USER");
        return createToken(claims, userDetails.getUsername());
    }

    public String generateClientToken(Long clientAccountId, Long clientId, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("accountType", "CLIENT");
        claims.put("clientAccountId", clientAccountId);
        claims.put("clientId", clientId);
        return createToken(claims, email);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10 hours token validity
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public Boolean validateClientToken(String token) {
        try {
            return "CLIENT".equals(extractClaim(token, claims -> claims.get("accountType", String.class))) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractAccountType(String token) {
        return extractClaim(token, claims -> claims.get("accountType", String.class));
    }

    public Long extractClientAccountId(String token) {
        Number clientAccountId = extractClaim(token, claims -> claims.get("clientAccountId", Number.class));
        return clientAccountId.longValue();
    }
}

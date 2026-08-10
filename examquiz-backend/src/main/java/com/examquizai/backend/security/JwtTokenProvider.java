package com.examquizai.backend.security;

import com.examquizai.backend.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Responsible for issuing, parsing, and validating JWT access/refresh tokens.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());
    }

    public String generateAccessToken(String userId, String email, Collection<? extends GrantedAuthority> authorities) {
        return buildToken(userId, email, authorities, jwtProperties.getAccessTokenExpirationMs());
    }

    public String generateRefreshToken(String userId, String email) {
        return buildToken(userId, email, List.of(), jwtProperties.getRefreshTokenExpirationMs());
    }

    private String buildToken(String userId,
                               String email,
                               Collection<? extends GrantedAuthority> authorities,
                               long expirationMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        List<String> roles = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(email)
                .claim(SecurityConstants.CLAIM_USER_ID, userId)
                .claim(SecurityConstants.CLAIM_ROLES, roles)
                .issuer(jwtProperties.getIssuer())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.debug("JWT expired: {}", ex.getMessage());
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Invalid JWT: {}", ex.getMessage());
        }
        return false;
    }

    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public String getUserIdFromToken(String token) {
        return parseClaims(token).get(SecurityConstants.CLAIM_USER_ID, String.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        return parseClaims(token).get(SecurityConstants.CLAIM_ROLES, List.class);
    }

    public long getAccessTokenExpirationMs() {
        return jwtProperties.getAccessTokenExpirationMs();
    }

    public static SimpleGrantedAuthority toAuthority(String role) {
        return new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role);
    }
}

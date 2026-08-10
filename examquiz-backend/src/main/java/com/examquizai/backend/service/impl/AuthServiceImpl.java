package com.examquizai.backend.service.impl;

import com.examquizai.backend.dto.request.LoginRequest;
import com.examquizai.backend.dto.request.RefreshTokenRequest;
import com.examquizai.backend.dto.request.RegisterRequest;
import com.examquizai.backend.dto.response.AuthResponse;
import com.examquizai.backend.dto.response.UserResponse;
import com.examquizai.backend.exception.BadRequestException;
import com.examquizai.backend.exception.UnauthorizedException;
import com.examquizai.backend.model.document.User;
import com.examquizai.backend.model.enums.Role;
import com.examquizai.backend.repository.UserRepository;
import com.examquizai.backend.security.JwtTokenProvider;
import com.examquizai.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Implements registration, login, and refresh-token flows backed by MongoDB and JWT.
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists");
        }

        Set<Role> defaultRoles = new HashSet<>();
        defaultRoles.add(Role.STUDENT);

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(defaultRoles)
                .enabled(true)
                .accountNonLocked(true)
                .build();

        User savedUser = userRepository.save(user);

        return buildAuthResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase(),
                            request.getPassword()
                    )
            );
        } catch (Exception ex) {
            throw new UnauthorizedException("Invalid email or password");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        return buildAuthResponse(user);
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();

        if (!jwtTokenProvider.isTokenValid(token)) {
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User associated with this token no longer exists"));

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        user.getRoles().forEach(role -> authorities.add(JwtTokenProvider.toAuthority(role.name())));

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), authorities);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(userResponse)
                .build();
    }
}

package com.examquizai.backend.service;

import com.examquizai.backend.dto.request.LoginRequest;
import com.examquizai.backend.dto.request.RefreshTokenRequest;
import com.examquizai.backend.dto.request.RegisterRequest;
import com.examquizai.backend.dto.response.AuthResponse;

/**
 * Handles user registration, login, and token refresh.
 */
public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);
}

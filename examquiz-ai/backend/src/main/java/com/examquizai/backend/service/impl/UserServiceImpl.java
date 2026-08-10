package com.examquizai.backend.service.impl;

import com.examquizai.backend.dto.request.UpdateUserRequest;
import com.examquizai.backend.dto.response.UserResponse;
import com.examquizai.backend.exception.ResourceNotFoundException;
import com.examquizai.backend.model.document.User;
import com.examquizai.backend.repository.UserRepository;
import com.examquizai.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Implements user profile retrieval and update operations.
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return toUserResponse(user);
    }

    @Override
    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUser(String email, UpdateUserRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName());
        }

        User savedUser = userRepository.save(user);
        return toUserResponse(savedUser);
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

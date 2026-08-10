package com.examquizai.backend.service;

import com.examquizai.backend.dto.request.UpdateUserRequest;
import com.examquizai.backend.dto.response.UserResponse;

/**
 * User profile management operations.
 */
public interface UserService {

    UserResponse getCurrentUser(String email);

    UserResponse getUserById(String id);

    UserResponse updateCurrentUser(String email, UpdateUserRequest request);
}

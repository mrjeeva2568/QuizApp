package com.examquizai.backend.config;

import com.examquizai.backend.model.document.User;
import com.examquizai.backend.model.enums.Role;
import com.examquizai.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Set;

/**
 * Provisions a single bootstrap ADMIN account on application startup, driven by
 * {@link AdminProperties} (app.admin.* / ADMIN_EMAIL / ADMIN_PASSWORD env vars).
 *
 * <p>This is intentionally the <b>only</b> way an ADMIN account is created —
 * there is no public "admin registration" endpoint. The run is idempotent:
 * if an account with the configured email already exists, nothing happens.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements ApplicationRunner {

    private final AdminProperties adminProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!adminProperties.isSeedEnabled()) {
            log.debug("Admin account seeding is disabled (app.admin.seed-enabled=false)");
            return;
        }

        if (!StringUtils.hasText(adminProperties.getEmail()) || !StringUtils.hasText(adminProperties.getPassword())) {
            log.warn("Admin seeding is enabled but app.admin.email / app.admin.password are not set - skipping");
            return;
        }

        String email = adminProperties.getEmail().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            log.debug("Admin account '{}' already exists - skipping seed", email);
            return;
        }

        User admin = User.builder()
                .fullName(StringUtils.hasText(adminProperties.getFullName())
                        ? adminProperties.getFullName() : "Administrator")
                .email(email)
                .password(passwordEncoder.encode(adminProperties.getPassword()))
                .roles(Set.of(Role.ADMIN))
                .enabled(true)
                .accountNonLocked(true)
                .build();

        userRepository.save(admin);
        log.info("Bootstrap ADMIN account created for '{}'", email);
    }
}

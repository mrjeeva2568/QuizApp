package com.examquizai.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds the bootstrap ADMIN account configuration (prefix: app.admin.*).
 *
 * <p>Since public registration only ever creates STUDENT accounts, this is the
 * sanctioned way an ADMIN account comes into existence: it is provisioned on
 * application startup from configuration/environment variables, not via any
 * public endpoint.</p>
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.admin")
public class AdminProperties {

    /**
     * Whether to auto-provision the default admin account on startup.
     */
    private boolean seedEnabled;

    private String email;

    private String password;

    private String fullName;
}

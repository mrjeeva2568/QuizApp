package com.examquizai.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

/**
 * Enables MongoDB auditing (@CreatedDate / @LastModifiedDate) and repository scanning.
 */
@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.examquizai.backend.repository")
public class MongoConfig {
}

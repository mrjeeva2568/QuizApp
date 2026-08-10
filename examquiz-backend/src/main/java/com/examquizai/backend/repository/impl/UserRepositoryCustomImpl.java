package com.examquizai.backend.repository.impl;

import com.examquizai.backend.model.document.User;
import com.examquizai.backend.model.enums.Role;
import com.examquizai.backend.repository.UserRepositoryCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Implements {@link UserRepositoryCustom}. Named {@code UserRepositoryCustomImpl}
 * (custom-interface name + "Impl") so Spring Data's repository factory picks it
 * up automatically as the fragment implementation for {@code UserRepository} —
 * no manual wiring needed beyond it living under the scanned repository package.
 */
@Repository
@RequiredArgsConstructor
public class UserRepositoryCustomImpl implements UserRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<User> searchStudents(String search, Boolean enabled, Pageable pageable) {
        List<Criteria> criteriaList = new ArrayList<>();

        // MongoDB array-containment: {roles: STUDENT} matches any document whose
        // roles array contains STUDENT - no $elemMatch needed for a scalar match.
        criteriaList.add(Criteria.where("roles").is(Role.STUDENT));

        if (StringUtils.hasText(search)) {
            String pattern = Pattern.quote(search.trim());
            criteriaList.add(new Criteria().orOperator(
                    Criteria.where("fullName").regex(pattern, "i"),
                    Criteria.where("email").regex(pattern, "i")
            ));
        }

        if (enabled != null) {
            criteriaList.add(Criteria.where("enabled").is(enabled));
        }

        Criteria finalCriteria = new Criteria().andOperator(criteriaList.toArray(new Criteria[0]));

        Query query = Query.query(finalCriteria).with(pageable);
        List<User> content = mongoTemplate.find(query, User.class);

        return PageableExecutionUtils.getPage(
                content,
                pageable,
                () -> mongoTemplate.count(Query.query(finalCriteria), User.class));
    }
}

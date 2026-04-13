package com.devteria.cinemaback_end.user.repository;

import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
    boolean existsByName(RoleName name);
    Optional<Role> findByName(RoleName name);
}
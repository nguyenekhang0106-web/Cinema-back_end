package com.devteria.cinemaback_end.user.repository;

import com.devteria.cinemaback_end.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
}
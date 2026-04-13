package com.devteria.cinemaback_end.configuration;

import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import com.devteria.cinemaback_end.user.repository.RoleRepository;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    UserRepository userRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder; // ✅ inject qua constructor

    @Bean
    ApplicationRunner applicationRunner() {
        return args -> {

            if (userRepository.findByfullName("admin").isEmpty()) {

                // ✅ Lấy role ADMIN từ DB
                Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                        .orElseThrow(() -> new RuntimeException("Role ADMIN chưa tồn tại"));

                var roles = new HashSet<Role>();
                roles.add(adminRole);

                User user = User.builder()
                        .fullName("admin")
                        .email("admin@gmail.com") // ✅ FIX lỗi 400
                        .password(passwordEncoder.encode("admin"))
                        .roles(roles) // ✅ đúng kiểu
                        .build();

                userRepository.save(user);

                log.warn("Admin user created with default password: admin");
            }
        };
    }
}
package com.devteria.cinemaback_end.configuration;

import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.entity.enums.Gender;
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

import java.util.Set;

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

            // 1. Tạo role nếu chưa có
            Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                    .orElseGet(() -> roleRepository.save(
                            Role.builder().name(RoleName.ADMIN).build()
                    ));

            Role userRole = roleRepository.findByName(RoleName.USER)
                    .orElseGet(() -> roleRepository.save(
                            Role.builder().name(RoleName.USER).build()
                    ));

            // 2. Tạo user admin nếu chưa có
            if (userRepository.findByEmail("admin@gmail.com").isEmpty()) {
                User admin = User.builder()
                        .email("admin@gmail.com")
                        .password(passwordEncoder.encode("admin123"))
                        .fullName("Admin")
                        .gender(Gender.Nam)
                        .emailVerified(true)
                        .build();

                admin.setRoles(Set.of(adminRole));

                userRepository.save(admin);
            } else {
                userRepository.findByEmail("admin@gmail.com").ifPresent(admin -> {
                    if (!admin.isEmailVerified()) {
                        admin.setEmailVerified(true);
                        userRepository.save(admin);
                    }
                });
            }
        };
    }
}

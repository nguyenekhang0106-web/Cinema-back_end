package com.devteria.cinemaback_end;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CinemaBackEndApplication {

    public static void main(String[] args) {
        SpringApplication.run(CinemaBackEndApplication.class, args);
    }

}

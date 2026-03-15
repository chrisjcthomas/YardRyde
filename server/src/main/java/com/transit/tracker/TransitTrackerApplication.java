package com.transit.tracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TransitTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TransitTrackerApplication.class, args);
    }
}

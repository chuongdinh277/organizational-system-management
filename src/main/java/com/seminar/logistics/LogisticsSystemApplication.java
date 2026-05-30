package com.seminar.logistics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class LogisticsSystemApplication {

  public static void main(String[] args) {
    SpringApplication.run(LogisticsSystemApplication.class, args);
  }
}

package com.invoice_management_system.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.fasterxml.jackson.datatype.hibernate5.jakarta.Hibernate5JakartaModule;

@Configuration
public class JacksonConfig {
    @Bean
    public Hibernate5JakartaModule hibernate5Module() {
        return new Hibernate5JakartaModule();
    }
}
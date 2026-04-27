package com.example.appointments;

import com.example.appointments.model.Appointment;
import com.example.appointments.repository.AppointmentRepository;
import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedAppointments(AppointmentRepository appointmentRepository) {
        return args -> {
            if (appointmentRepository.count() > 0) {
                return;
            }

            appointmentRepository.save(new Appointment("Aarav Sharma", "Dr. Smith", LocalDateTime.of(2026, 4, 28, 9, 0)));
            appointmentRepository.save(new Appointment("Meera Patel", "Dr. Smith", LocalDateTime.of(2026, 4, 28, 10, 0)));
            appointmentRepository.save(new Appointment("Kabir Singh", "Dr. Adams", LocalDateTime.of(2026, 4, 28, 11, 0)));
            appointmentRepository.save(new Appointment("Ananya Rao", "Dr. Brown", LocalDateTime.of(2026, 4, 28, 12, 0)));
        };
    }
}

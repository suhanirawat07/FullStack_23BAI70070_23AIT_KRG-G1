package com.example.appointments.controller;

import com.example.appointments.model.Appointment;
import com.example.appointments.repository.AppointmentRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;

    public AppointmentController(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @GetMapping("/search")
    public List<Appointment> searchByDoctor(@RequestParam("doctor") String doctorName) {
        return appointmentRepository.findByDoctorNameCaseInsensitive(doctorName);
    }
}

package com.example.appointments.repository;

import com.example.appointments.model.Appointment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("select a from Appointment a where lower(a.doctorName) = lower(:doctorName) order by a.id asc")
    List<Appointment> findByDoctorNameCaseInsensitive(@Param("doctorName") String doctorName);
}

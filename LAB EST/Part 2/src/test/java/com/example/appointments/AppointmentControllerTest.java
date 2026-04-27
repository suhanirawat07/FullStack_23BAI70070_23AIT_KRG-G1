package com.example.appointments;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void searchReturnsAppointmentsForDoctorNameCaseInsensitive() throws Exception {
        mockMvc.perform(get("/appointments/search").param("doctor", "dr. smith"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].doctorName").value("Dr. Smith"))
            .andExpect(jsonPath("$[1].doctorName").value("Dr. Smith"));
    }

    @Test
    void searchReturnsDifferentDoctorName() throws Exception {
        mockMvc.perform(get("/appointments/search").param("doctor", "DR. ADAMS"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].doctorName").value("Dr. Adams"));
    }
}

package com.udlaeats.ms_cliente.repository;

import com.udlaeats.ms_cliente.model.Estudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    // Buscar por email para el login
    Optional<Estudiante> findByEmail(String email);
    Optional<Estudiante> findByEmailAndPassword(String email, String password);
}

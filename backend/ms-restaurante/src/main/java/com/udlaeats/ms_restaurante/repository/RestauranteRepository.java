package com.udlaeats.ms_restaurante.repository;

import com.udlaeats.ms_restaurante.model.Restaurante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestauranteRepository extends JpaRepository<Restaurante, Long> {
    // Metodo para buscar por usuario y contraseña
    Optional<Restaurante> findByUsuarioAndPassword(String usuario, String password);
}
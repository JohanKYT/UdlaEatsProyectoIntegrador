package com.udlaeats.ms_repartidor.repository;

import com.udlaeats.ms_repartidor.model.Repartidor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RepartidorRepository extends JpaRepository<Repartidor, Long> {
    Optional<Repartidor> findByEmailAndPassword(String email, String password);
    Optional<Repartidor> findByEmail(String email);
}
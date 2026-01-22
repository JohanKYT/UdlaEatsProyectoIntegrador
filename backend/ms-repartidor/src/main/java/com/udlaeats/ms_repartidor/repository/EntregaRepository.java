package com.udlaeats.ms_repartidor.repository;

import com.udlaeats.ms_repartidor.model.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EntregaRepository extends JpaRepository<Entrega, Long> {
    // Buscar entregas que nadie ha tomado aún
    List<Entrega> findByEstado(String estado);
    Optional<Entrega> findByPedidoOriginalId(Long id);
}
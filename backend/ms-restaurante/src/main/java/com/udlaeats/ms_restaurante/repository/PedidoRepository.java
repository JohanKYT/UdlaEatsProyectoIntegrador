package com.udlaeats.ms_restaurante.repository;

import com.udlaeats.ms_restaurante.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByRestauranteIdAndEstado(Long restauranteId, String estado);
    List<Pedido> findByClienteId(Long clienteId);
    List<Pedido> findByRestauranteIdAndEstadoNot(Long restauranteId, String estado);
}

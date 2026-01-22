package com.udlaeats.ms_repartidor.service;

import com.udlaeats.ms_repartidor.model.Entrega;
import com.udlaeats.ms_repartidor.repository.EntregaRepository;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class RabbitConsumer {

    @Autowired
    private EntregaRepository entregaRepository;

    // Escucha la cola. Si no existe, la crea.
    @RabbitListener(queuesToDeclare = @Queue(name = "cola_pedidos_nuevos", durable = "true"))
    public void recibirPedido(Map<String, Object> datos) {
        try {
            Long pedidoIdOriginal = Long.valueOf(datos.get("pedidoOriginalId").toString());

            // 1. VALIDACIÓN ANTI-DUPLICADOS
            if (entregaRepository.findByPedidoOriginalId(pedidoIdOriginal).isPresent()) {
                System.out.println("⚠️ Pedido " + pedidoIdOriginal + " ya existe. Ignorando duplicado.");
                return; // Nos salimos sin hacer nada
            }

            System.out.println("🛵 RABBITMQ: Nuevo pedido recibido: " + datos);

            Entrega e = new Entrega();
            e.setPedidoOriginalId(pedidoIdOriginal);
            e.setRestauranteNombre(datos.get("restauranteNombre").toString());
            e.setDireccionRecogida(datos.get("direccionRecogida").toString());
            e.setClienteNombre(datos.get("clienteNombre").toString());
            e.setDescripcionPaquete(datos.get("descripcionPaquete").toString());
            e.setCodigoSeguridad(datos.get("codigoSeguridad").toString());

            e.setGanancia(0.25);
            e.setEstado("PENDIENTE");
            e.setRepartidorId(null);

            entregaRepository.save(e);
            System.out.println("✅ Pedido #" + pedidoIdOriginal + " guardado.");

        } catch (Exception ex) {
            System.err.println("❌ Error consumiendo mensaje: " + ex.getMessage());
        }
    }
}
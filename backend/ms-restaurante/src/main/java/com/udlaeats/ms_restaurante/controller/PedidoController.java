package com.udlaeats.ms_restaurante.controller;

import com.udlaeats.ms_restaurante.model.Pedido;
import com.udlaeats.ms_restaurante.repository.PedidoRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.client.RestTemplate;
import com.udlaeats.ms_restaurante.repository.RestauranteRepository;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "*")
public class PedidoController {

    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private RestauranteRepository restauranteRepository; // INYECTAR ESTO
    @Autowired private RabbitTemplate rabbitTemplate;

    @PostMapping
    public Pedido crearPedido(@RequestBody Pedido pedido) {
        int randomCode = 1000 + (int)(Math.random() * 9000);
        pedido.setCodigoVerificacion(String.valueOf(randomCode));
        pedido.setFecha(LocalDateTime.now());
        pedido.setEstado("PENDIENTE");

        Pedido guardado = pedidoRepository.save(pedido);

        // BUSCAR NOMBRE REAL
        String nombreRestaurante = "Restaurante #" + guardado.getRestauranteId();
        var restauranteOpt = restauranteRepository.findById(guardado.getRestauranteId());
        if(restauranteOpt.isPresent()) {
            nombreRestaurante = restauranteOpt.get().getNombrePublico();
        }

        try {
            Map<String, Object> msj = new HashMap<>();
            msj.put("pedidoOriginalId", guardado.getId());
            msj.put("restauranteNombre", nombreRestaurante); // ENVIAMOS NOMBRE REAL
            msj.put("direccionRecogida", guardado.getCampus());
            msj.put("clienteNombre", guardado.getClienteNombre());
            msj.put("descripcionPaquete", guardado.getDescripcionPedido());
            msj.put("codigoSeguridad", guardado.getCodigoVerificacion());

            rabbitTemplate.convertAndSend("cola_pedidos_nuevos", msj);
        } catch (Exception e) {
            System.err.println("Fallo Rabbit: " + e.getMessage());
        }
        return guardado;
    }

    @PutMapping("/{id}/estado")
    public Pedido cambiarEstado(@PathVariable Long id, @RequestBody String nuevoEstado) {
        Pedido p = pedidoRepository.findById(id).orElseThrow();
        String estadoLimpio = nuevoEstado.replace("\"", "").trim();
        p.setEstado(estadoLimpio);
        if(estadoLimpio.equals("LISTO")) {
            try { new RestTemplate().put("http://localhost:8083/api/logistica/actualizar-estado-externo/" + p.getId() + "/LISTO", null); } catch (Exception e) {}
        }
        return pedidoRepository.save(p);
    }

    @GetMapping("/restaurante/{id}")
    public List<Pedido> pedidosPorRestaurante(@PathVariable Long id) { return pedidoRepository.findByRestauranteIdAndEstadoNot(id, "ENTREGADO"); }
    @GetMapping("/cliente/{id}")
    public List<Pedido> pedidosPorCliente(@PathVariable Long id) { return pedidoRepository.findByClienteId(id); }
    @GetMapping("/historial/{id}")
    public List<Pedido> historialVentas(@PathVariable Long id) { return pedidoRepository.findByRestauranteIdAndEstado(id, "ENTREGADO"); }
}
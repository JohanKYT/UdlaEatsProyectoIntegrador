package com.udlaeats.ms_repartidor.controller;

import com.udlaeats.ms_repartidor.model.Entrega;
import com.udlaeats.ms_repartidor.model.Repartidor;
import com.udlaeats.ms_repartidor.repository.EntregaRepository;
import com.udlaeats.ms_repartidor.repository.RepartidorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/logistica")
@CrossOrigin(origins = "*")
public class LogisticaController {

    @Autowired private EntregaRepository entregaRepository;
    @Autowired private RepartidorRepository repartidorRepository;

    private void avisarAlRestaurante(Long pedidoId, String nuevoEstado) {
        try { new RestTemplate().put("http://localhost:8081/api/pedidos/" + pedidoId + "/estado", nuevoEstado); } catch (Exception e) {}
    }

    // Muestra PENDIENTES o LISTOS (sin dueño)
    @GetMapping("/disponibles")
    public List<Entrega> verDisponibles() {
        return entregaRepository.findAll().stream()
                .filter(e -> e.getRepartidorId() == null &&
                        (e.getEstado().equals("PENDIENTE") || e.getEstado().equals("LISTO"))) // <--- CORRECCIÓN AQUÍ
                .collect(Collectors.toList());
    }

    // 2. ACEPTAR PEDIDO (Maneja si ya estaba listo)
    @PutMapping("/{id}/tomar/{repartidorId}")
    public ResponseEntity<?> tomarPedido(@PathVariable Long id, @PathVariable Long repartidorId) {
        return entregaRepository.findById(id).map(e -> {
            if (e.getRepartidorId() != null) return ResponseEntity.badRequest().body("Ocupado");

            e.setRepartidorId(repartidorId);

            // Si ya estaba LISTO, se queda LISTO (para que el repartidor vaya directo a recoger)
            // Si estaba PENDIENTE, pasa a ACEPTADO
            if (!e.getEstado().equals("LISTO")) {
                e.setEstado("ACEPTADO");
                avisarAlRestaurante(e.getPedidoOriginalId(), "ACEPTADO");
            } else {
                // Si ya era LISTO, solo avisamos que ya tiene dueño, pero el estado sigue siendo LISTO
                // Opcional: Podríamos notificar "REPARTIDOR_ASIGNADO" sin cambiar estado visual
            }

            return ResponseEntity.ok(entregaRepository.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    // CANCELAR (Solo si no es 'EN_CAMINO' o 'LLEGO') ---
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarPedido(@PathVariable Long id) {
        return entregaRepository.findById(id).map(entrega -> {
            // No dejar cancelar si ya lo tiene encima
            if (entrega.getEstado().equals("EN_CAMINO") || entrega.getEstado().equals("LLEGO") || entrega.getEstado().equals("ENTREGADO")) {
                return ResponseEntity.badRequest().body("Demasiado tarde para cancelar.");
            }

            entrega.setRepartidorId(null);
            // Si ya estaba listo, lo devolvemos al radar como LISTO, si no, como PENDIENTE
            // Para simplificar y evitar errores, lo devolvemos a PENDIENTE para reiniciar el ciclo o lo dejamos como estaba
            // Mejor estrategia: Volver a PENDIENTE para que el restaurante sepa que se cayó el viaje
            entrega.setEstado("PENDIENTE");
            entregaRepository.save(entrega);

            avisarAlRestaurante(entrega.getPedidoOriginalId(), "PENDIENTE");
            return ResponseEntity.ok("Cancelado");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/recoger")
    public ResponseEntity<?> recogerPedido(@PathVariable Long id) { return entregaRepository.findById(id).map(e -> { e.setEstado("EN_CAMINO"); avisarAlRestaurante(e.getPedidoOriginalId(), "EN_CAMINO"); return ResponseEntity.ok(entregaRepository.save(e)); }).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}/llegue")
    public ResponseEntity<?> marcarLlegado(@PathVariable Long id) { return entregaRepository.findById(id).map(e -> { e.setEstado("LLEGO"); avisarAlRestaurante(e.getPedidoOriginalId(), "LLEGO"); return ResponseEntity.ok(entregaRepository.save(e)); }).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}/finalizar")
    public ResponseEntity<?> finalizarEntrega(@PathVariable Long id, @RequestBody String codigoInput) { Entrega e = entregaRepository.findById(id).orElseThrow(); if (e.getCodigoSeguridad().equals(codigoInput.replace("\"", "").trim())) { e.setEstado("ENTREGADO"); entregaRepository.save(e); Repartidor r = repartidorRepository.findById(e.getRepartidorId()).orElseThrow(); r.setSaldoTotal(r.getSaldoTotal() + e.getGanancia()); repartidorRepository.save(r); avisarAlRestaurante(e.getPedidoOriginalId(), "ENTREGADO"); return ResponseEntity.ok("OK"); } return ResponseEntity.badRequest().body("Código incorrecto"); }
    @GetMapping("/historial/{repartidorId}")
    public List<Entrega> historial(@PathVariable Long repartidorId) { return entregaRepository.findAll().stream().filter(e -> e.getRepartidorId() != null && e.getRepartidorId().equals(repartidorId) && e.getEstado().equals("ENTREGADO")).collect(Collectors.toList()); }
    @GetMapping("/{id}")
    public ResponseEntity<Entrega> obtener(@PathVariable Long id) { return entregaRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @GetMapping("/pedido-original/{id}")
    public ResponseEntity<Entrega> porOriginal(@PathVariable Long id) { return entregaRepository.findByPedidoOriginalId(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }

    // CHAT
    @PutMapping("/{id}/chat")
    public ResponseEntity<?> chat(@PathVariable Long id, @RequestBody String msg) {
        return entregaRepository.findById(id).map(e -> {
            String descActual = e.getDescripcionPaquete() == null ? "" : e.getDescripcionPaquete();
            String mensajeLimpio = msg.replace("\"", "");
            e.setDescripcionPaquete(descActual + "|MSG|" + mensajeLimpio);
            return ResponseEntity.ok(entregaRepository.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/actualizar-estado-externo/{pedidoId}/{estado}")
    public void actualizarExterno(@PathVariable Long pedidoId, @PathVariable String estado) { Optional<Entrega> opt = entregaRepository.findByPedidoOriginalId(pedidoId); if (opt.isPresent()) { Entrega e = opt.get(); if (!e.getEstado().equals("EN_CAMINO") && !e.getEstado().equals("ENTREGADO")) { e.setEstado(estado); entregaRepository.save(e); }}}
    @DeleteMapping("/reset") public void borrarTodo() { entregaRepository.deleteAll(); }
}
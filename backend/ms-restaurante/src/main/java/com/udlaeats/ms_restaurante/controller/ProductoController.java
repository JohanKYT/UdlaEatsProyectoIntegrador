package com.udlaeats.ms_restaurante.controller;

import com.udlaeats.ms_restaurante.model.Producto;
import com.udlaeats.ms_restaurante.model.StockEvent;
import com.udlaeats.ms_restaurante.repository.ProductoRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate; // <--- Importante
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*") //Conexion con Front
public class ProductoController {

    private final ProductoRepository productoRepository;
    private final RabbitTemplate rabbitTemplate; // <--- 1. Inyectamos Rabbit

    // Constructor actualizado
    public ProductoController(ProductoRepository productoRepository, RabbitTemplate rabbitTemplate) {
        this.productoRepository = productoRepository;
        this.rabbitTemplate = rabbitTemplate;
    }



    // GET: Ver productos (filtrar por restaurante)
    @GetMapping
    public List<Producto> listarProductos(@RequestParam(required = false) Long restauranteId) {
        if (restauranteId != null) {
            return productoRepository.findByRestauranteId(restauranteId);
        }
        return productoRepository.findAll(); // Si no hay ID
    }

    @PostMapping
    public Producto guardarProducto(@RequestBody Producto producto) {
        return productoRepository.save(producto);
    }

    @PutMapping("/{id}")
    public Producto actualizarProducto(@PathVariable Long id, @RequestBody Producto productoDetalles) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Detectar si CAMBIÓ la disponibilidad (Para no enviar eventos por gusto)
        boolean estadoAnterior = producto.getDisponible();
        boolean nuevoEstado = productoDetalles.getDisponible();

        // Actualizamos datos
        producto.setNombre(productoDetalles.getNombre());
        producto.setDescripcion(productoDetalles.getDescripcion());
        producto.setPrecio(productoDetalles.getPrecio());
        producto.setImagenUrl(productoDetalles.getImagenUrl());
        producto.setDisponible(nuevoEstado);

        Producto productoGuardado = productoRepository.save(producto);

        // SI HUBO CAMBIO DE STOCK, ENVIAMOS EL EVENTO
        if (estadoAnterior != nuevoEstado) {
            StockEvent evento = new StockEvent(id, nuevoEstado, producto.getNombre());

            // Enviamos el mensaje a RabbitMQ
            // ("Exchange", "RoutingKey", "Mensaje")
            rabbitTemplate.convertAndSend("exchange_stock", "stock.update", evento);

            System.out.println("📢 EVENTO ENVIADO: " + evento);
        }

        return productoGuardado;
    }

    // DELETE: Borrar un plato
    @DeleteMapping("/{id}")
    public void eliminarProducto(@PathVariable Long id) {
        productoRepository.deleteById(id);
    }
}
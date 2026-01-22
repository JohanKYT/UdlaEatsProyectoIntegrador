package com.udlaeats.ms_restaurante.controller;

import com.udlaeats.ms_restaurante.model.Producto; // <--- Importar
import com.udlaeats.ms_restaurante.model.Restaurante;
import com.udlaeats.ms_restaurante.repository.ProductoRepository; // <--- Importar
import com.udlaeats.ms_restaurante.repository.RestauranteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publico")
@CrossOrigin(origins = "*") // Importante para evitar bloqueos
public class PublicoController {

    @Autowired
    private RestauranteRepository restauranteRepository;

    @Autowired // <--- AGREGAR ESTA INYECCIÓN
    private ProductoRepository productoRepository;

    // Listar Restaurantes
    @GetMapping("/restaurantes")
    public List<Restaurante> listarRestaurantes() {
        return restauranteRepository.findAll();
    }

    // Listar Productos por Restaurante
    @GetMapping("/productos")
    public List<Producto> listarProductosPublicos(@RequestParam Long restauranteId) {
        // Devuelve solo los productos de ese restaurante
        return productoRepository.findByRestauranteId(restauranteId);
    }
}
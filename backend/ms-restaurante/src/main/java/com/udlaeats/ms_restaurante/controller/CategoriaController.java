package com.udlaeats.ms_restaurante.controller;

import com.udlaeats.ms_restaurante.model.Categoria;
import com.udlaeats.ms_restaurante.repository.CategoriaRepository;
import com.udlaeats.ms_restaurante.repository.ProductoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@CrossOrigin(origins = "*")
public class CategoriaController {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    public CategoriaController(CategoriaRepository categoriaRepository, ProductoRepository productoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    @GetMapping
    public List<Categoria> listar(@RequestParam Long restauranteId) {
        return categoriaRepository.findByRestauranteId(restauranteId);
    }

    @PostMapping
    public Categoria guardar(@RequestBody Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    // BORRADO SEGURO
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        // Verificamos si hay productos usando esta categoría
        if (productoRepository.existsByCategoriaId(id)) {
            return ResponseEntity.badRequest().body("No puedes eliminar esta categoría porque tiene productos asociados. Muevelos o elimínalos primero.");
        }
        // Si está vacía, procedemos
        categoriaRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
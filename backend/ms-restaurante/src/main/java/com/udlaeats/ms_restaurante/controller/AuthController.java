package com.udlaeats.ms_restaurante.controller;

import com.udlaeats.ms_restaurante.model.Restaurante;

import com.udlaeats.ms_restaurante.repository.RestauranteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final RestauranteRepository restauranteRepository;

    public AuthController(RestauranteRepository restauranteRepository) {
        this.restauranteRepository = restauranteRepository;
    }

    // LOGIN: Recibe usuario y pass, devuelve el Restaurante si existe
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Restaurante credenciales) {
        return restauranteRepository.findByUsuarioAndPassword(credenciales.getUsuario(), credenciales.getPassword())
                .map(restaurante -> ResponseEntity.ok(restaurante))
                .orElse(ResponseEntity.status(401).build()); // 401 = No autorizado
    }

    // REGISTRO (Para crear restaurantes rápido)
    @PostMapping("/registro")
    public Restaurante registrar(@RequestBody Restaurante restaurante) {
        return restauranteRepository.save(restaurante);
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<?> eliminarCuenta(@PathVariable Long id) {
        if (!restauranteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        // si configuraste CascadeType.ALL, si no, primero habría que borrar productos.
        restauranteRepository.deleteById(id);
        return ResponseEntity.ok("Cuenta eliminada con éxito");
    }

}

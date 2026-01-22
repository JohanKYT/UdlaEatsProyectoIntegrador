package com.udlaeats.ms_cliente.controller;

import com.udlaeats.ms_cliente.model.Estudiante;
import com.udlaeats.ms_cliente.repository.EstudianteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cliente")
public class AuthController {

    @Autowired
    private EstudianteRepository estudianteRepository;

    // 1. REGISTRO
    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody Estudiante nuevo) {
        // Validación básica: que no se repita el correo
        if (estudianteRepository.findByEmail(nuevo.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("El correo ya está registrado");
        }
        return ResponseEntity.ok(estudianteRepository.save(nuevo));
    }

    // 2. LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Estudiante loginData) {
        // Busca por email Y contraseña
        return estudianteRepository.findByEmailAndPassword(loginData.getEmail(), loginData.getPassword())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build());
    }

    // 3. OBTENER PERFIL
    @GetMapping("/{id}")
    public ResponseEntity<Estudiante> getPerfil(@PathVariable Long id) {
        return estudianteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. ELIMINAR CUENTA
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCuenta(@PathVariable Long id) {
        if (estudianteRepository.existsById(id)) {
            estudianteRepository.deleteById(id);
            return ResponseEntity.ok("Cuenta de estudiante eliminada");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
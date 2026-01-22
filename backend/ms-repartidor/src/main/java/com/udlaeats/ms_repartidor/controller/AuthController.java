package com.udlaeats.ms_repartidor.controller;

import com.udlaeats.ms_repartidor.model.Repartidor;
import com.udlaeats.ms_repartidor.repository.RepartidorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private RepartidorRepository repartidorRepository;

    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody Repartidor r) {
        if (repartidorRepository.findByEmail(r.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("El correo ya existe");
        }
        return ResponseEntity.ok(repartidorRepository.save(r));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Repartidor loginData) {
        return repartidorRepository.findByEmailAndPassword(loginData.getEmail(), loginData.getPassword())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCuenta(@PathVariable Long id) {
        if (repartidorRepository.existsById(id)) {
            repartidorRepository.deleteById(id);
            return ResponseEntity.ok("Cuenta eliminada correctamente");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}

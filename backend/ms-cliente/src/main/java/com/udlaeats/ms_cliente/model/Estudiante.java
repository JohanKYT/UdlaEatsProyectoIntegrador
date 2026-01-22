package com.udlaeats.ms_cliente.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "estudiantes")
public class Estudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email; // Ej: kevin.maquis@udla.edu.ec
    private String nombre; // Ej: Kevin Maquis
    private String password;
    private String celular; // Para contacto
}
package com.udlaeats.ms_restaurante.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "categorias")
public class Categoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre; // Ej: "Bebidas", "Hamburguesas"
    private Long restauranteId; // Cada restaurante tiene sus propias categorías
}
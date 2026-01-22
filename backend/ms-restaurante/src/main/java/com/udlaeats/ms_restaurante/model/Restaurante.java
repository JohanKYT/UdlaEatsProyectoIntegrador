package com.udlaeats.ms_restaurante.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "restaurantes")
public class Restaurante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true) // El usuario no puede repetirse
    private String usuario; // Ej: "burgerking_udla"

    private String password; // En el futuro la encriptaremos
    private String nombrePublico; // Ej: "Burger King - Patio de Comidas"
    private String campus; // Ej: "Granados", "Udlapark"
    private String logoUrl; // Para mostrarlo en el app
}

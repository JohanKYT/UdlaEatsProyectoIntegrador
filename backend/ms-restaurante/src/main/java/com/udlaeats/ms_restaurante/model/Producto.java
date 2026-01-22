package com.udlaeats.ms_restaurante.model;

import jakarta.persistence.*;
import lombok.Data;

@Data // Lombok: Crea getters, setters y toString automático
@Entity // Esto le dice a Java: "Esta clase representa una tabla en la BD"
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    @Column(columnDefinition = "TEXT")
    private String descripcion;

    private Double precio;

    @Column(columnDefinition = "TEXT")
    private String imagenUrl;
    private Boolean disponible;

    // --- NUEVO CAMPO: Restauranted
    private Long restauranteId;

    // NUEVO CAMPO
    private Long categoriaId;
}

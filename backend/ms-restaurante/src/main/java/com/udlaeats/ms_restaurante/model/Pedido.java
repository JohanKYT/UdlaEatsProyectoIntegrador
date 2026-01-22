package com.udlaeats.ms_restaurante.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "pedidos")
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String clienteNombre;
    private String campus;
    private Double total;
    private String estado;

    @Column(columnDefinition = "TEXT")
    private String descripcionPedido;

    private Long restauranteId;
    private Long clienteId;

    private String codigoVerificacion;


    private LocalDateTime fecha;

    @PrePersist
    public void prePersist() {
        this.fecha = LocalDateTime.now();
        if(this.estado == null) this.estado = "PENDIENTE";
    }
}
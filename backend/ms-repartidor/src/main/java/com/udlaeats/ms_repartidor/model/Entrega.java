package com.udlaeats.ms_repartidor.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "entregas")
public class Entrega {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long pedidoOriginalId;
    private String restauranteNombre;
    private String direccionRecogida;
    private String clienteNombre;
    private String descripcionPaquete;
    private String codigoSeguridad;
    private String estado;
    private Long repartidorId;
    private Double ganancia;
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();
        if(this.estado == null) this.estado = "DISPONIBLE";
        if(this.ganancia == null) this.ganancia = 3.50;
    }
}
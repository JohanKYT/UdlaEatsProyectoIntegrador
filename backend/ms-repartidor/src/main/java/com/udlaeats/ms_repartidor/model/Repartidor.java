package com.udlaeats.ms_repartidor.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "repartidores")
public class Repartidor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String email;
    private String password;
    private String vehiculo;

    private Double saldoTotal;

    @PrePersist
    public void prePersist() {
        if(this.saldoTotal == null) this.saldoTotal = 0.0;
    }
}
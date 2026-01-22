package com.udlaeats.ms_restaurante.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor // Crea constructor con argumentos automáticamente
@NoArgsConstructor  // Crea constructor vacío automáticamente
public class StockEvent {
    private Long productoId;
    private Boolean disponible;
    private String nombre;
}

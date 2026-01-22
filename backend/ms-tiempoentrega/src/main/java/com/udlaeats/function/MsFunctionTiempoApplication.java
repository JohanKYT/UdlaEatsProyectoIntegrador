package com.udlaeats.function;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.util.function.Function;

@SpringBootApplication
public class MsFunctionTiempoApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsFunctionTiempoApplication.class, args);
    }

    // LAMBDA SERVERLESS
    // Recibe: Integer (Número total de platos)
    // Retorna: String (Mensaje formateado)
    @Bean
    public Function<Integer, String> estimarTiempo() {
        return (cantidadPlatos) -> {
            // 15 min caminar al edificio + 5  min de preparación por cada plato
            int tiempoTotal = 15 + (cantidadPlatos * 5);

            return String.format("🕒 Estimación: Tu pedido de %d platos llegará en %d minutos aprox.",
                    cantidadPlatos, tiempoTotal);
        };
    }
}
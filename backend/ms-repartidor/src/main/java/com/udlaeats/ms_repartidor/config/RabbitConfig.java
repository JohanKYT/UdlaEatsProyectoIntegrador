package com.udlaeats.ms_repartidor.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    // COLA DE PEDIDOS (La principal)
    @Bean
    public Queue colaPedidos() {
        // "true" significa que es Durable (no se borra si reinicias el PC)
        return new Queue("cola_pedidos_nuevos", true);
    }

    // COLA DE NOTIFICACIONES
    // Esto sirve para demostrar escalabilidad
    @Bean
    public Queue colaNotificaciones() {
        return new Queue("cola_notificaciones_app", true);
    }
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
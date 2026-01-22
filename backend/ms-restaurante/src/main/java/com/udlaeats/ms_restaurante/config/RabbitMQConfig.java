package com.udlaeats.ms_restaurante.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Cola Principal: Pedidos Nuevos (La más importante)
    @Bean
    public Queue colaPedidos() {
        // "true" = durable (si reinicias RabbitMQ, los mensajes no se borran)
        return new Queue("cola_pedidos_nuevos", true);
    }

    // Cola Secundaria: Stock
    @Bean
    public Queue stockQueue() {
        return new Queue("cola_stock_updates", true);
    }

    // CONFIGURACIÓN DE EXCHANGES (Para Stock)
    @Bean
    public TopicExchange stockExchange() {
        return new TopicExchange("exchange_stock");
    }

    @Bean
    public Binding binding(Queue stockQueue, TopicExchange stockExchange) {
        return BindingBuilder.bind(stockQueue).to(stockExchange).with("stock.#");
    }

    // CONVERTIDOR JSON
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
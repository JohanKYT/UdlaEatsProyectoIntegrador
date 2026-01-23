# 🍔 UdlaEats - Plataforma de Delivery Universitario

![Status](https://img.shields.io/badge/Status-Completado-green) ![Java](https://img.shields.io/badge/Backend-Spring%20Boot-brightgreen) ![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue) ![Docker](https://img.shields.io/badge/Infra-Docker-blue)

## 📖 Descripción del Proyecto
**UdlaEats** es un ecosistema de microservicios diseñado para optimizar la gestión de pedidos de comida dentro del campus universitario. Soluciona el problema de las largas filas y la ineficiencia logística mediante una arquitectura distribuida en tiempo real.

### 🚀 Características Principales
* **Arquitectura de Microservicios:** Separación clara entre Cliente, Restaurante y Logística.
* **Comunicación Asíncrona:** Uso de **RabbitMQ** para garantizar que ningún pedido se pierda, incluso si el sistema se satura.
* **Chat en Tiempo Real:** Comunicación bidireccional entre el Repartidor (Walker) y el Estudiante.
* **Radar de Pedidos:** Sistema de geolocalización lógica para asignar pedidos cercanos.
* **Documentación API:** Integración completa con **Swagger/OpenAPI**.

---

## 🏗️ Arquitectura Técnica

El sistema consta de tres módulos principales interconectados:

1.  **MS-Restaurante (Puerto 8081):** Gestiona el menú, stock y recepción de pedidos.
2.  **MS-Cliente (Puerto 8082):** Maneja el catálogo, carrito y perfil de usuario.
3.  **MS-Repartidor (Puerto 8083):** Gestiona la logística, asignación de walkers y chat.
4.  **MS-TiempoEntrega (Puerto 8084):** Módulo **Serverless**.
    * Implementado con **Spring Cloud Function**.
    * **Función Lambda Stateless:** Calcula tiempos de entrega basados en carga de trabajo sin persistencia de datos.

**Tecnologías:**
* **Base de Datos:** PostgreSQL (3 bases de datos aisladas en contenedor).
* **Mensajería:** RabbitMQ (Colas durables para tolerancia a fallos).
* **Backend:** Java 21 + Spring Boot 3.2.
* **Frontend:** React 18 + TailwindCSS (Diseño Mobile-First).
* **Serverless:** Spring Cloud Function (Lambda).

---

## ⚙️ Guía de Instalación y Ejecución

Sigue estos pasos para levantar el proyecto desde cero.

### 1. Infraestructura (Docker)
El proyecto utiliza Docker Compose para orquestar la base de datos y el broker de mensajería.

bash

```cd infrastructure```

```docker-compose up -d```

Esto levantará PostgreSQL (puerto 5432) y RabbitMQ (puerto 5672) automáticamente.

2. Backend (Microservicios)
Es necesario iniciar cada microservicio por separado.

Abrir la carpeta backend/ en IntelliJ IDEA.

Ejecutar la clase Application.java de cada servicio:

```ms-restaurante```

```ms-cliente```

```ms-repartidor```

```ms-tiempoentrega```

Verificar Swagger:

```Restaurante: http://localhost:8081/swagger-ui/index.html```

```Repartidor: http://localhost:8083/swagger-ui/index.html```

3. Frontend (Aplicaciones Web/Móvil)
Para cada aplicación en la carpeta frontend/ Abrimos un terminar en la carperta /frontend_cliente, /frontend_repartidor, /frontend-restaurante:

Bash

```npm install```

```npm run dev -- --host```

⚠️ Nota Importante sobre Conectividad Móvil: Para probar desde un celular real, asegúrese de actualizar la constante IP_PC en el archivo App.jsx con la dirección IPv4 de su ordenador (ej: 192.168.100.X).

🧪 Pruebas Realizadas
Flujo Completo: Creación de pedido -> Recepción en cocina -> Asignación a Repartidor -> Entrega con Código de Seguridad.

Resiliencia: Reinicio de RabbitMQ sin pérdida de mensajes (Colas Durales).

Concurrencia: Múltiples usuarios pidiendo simultáneamente.

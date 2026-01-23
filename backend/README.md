# UdlaEats - Backend Microservices Architecture

Este repositorio contiene la lógica de negocio distribuida de la plataforma **UdlaEats**. El sistema está diseñado bajo una arquitectura de **Microservicios** desacoplados, utilizando comunicación asíncrona (RabbitMQ) y bases de datos aisladas (Database per Service pattern).

## ⚡ Stack Tecnológico

* **Lenguaje:** Java 21
* **Framework:** Spring Boot 3.2
* **Base de Datos:** PostgreSQL (Contenerizada en Docker)
* **Mensajería:** RabbitMQ (Event-Driven Architecture)
* **Documentación:** OpenAPI 3.0 (Swagger)
* **Serverless:** Spring Cloud Function (Lambda)

---

## 🔗 Mapa de Microservicios

| Servicio | Puerto | Descripción | Base de Datos |
| :--- | :--- | :--- | :--- |
| **MS-Restaurante** | `8081` | Core transaccional. Gestiona menú, stock y pedidos. | `db_restaurante` |
| **MS-Cliente** | `8082` | Gestión de identidad de estudiantes y perfiles. | `db_cliente` |
| **MS-Repartidor** | `8083` | Logística, radar de pedidos y chat en tiempo real. | `db_repartidor` |
| **MS-Function** | `8084` | **Lambda Serverless** para cálculo de tiempos. | *(Stateless)* |

---

## 📚 API Reference (Documentación de Endpoints)

A continuación se detalla la especificación técnica de los endpoints expuestos por cada microservicio.

### 1️⃣ Microservicio Restaurante (Puerto 8081)
**Responsabilidad:** Administración del negocio, gestión del menú y ciclo de vida inicial del pedido.

#### 📦 Productos y Menú (Admin)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/productos` | Lista todos los productos (con filtros por restaurante). |
| `POST` | `/api/productos` | Crea un nuevo plato en el menú. |
| `PUT` | `/api/productos/{id}` | Actualiza precio, stock o descripción. |
| `DELETE` | `/api/productos/{id}` | Elimina un producto del menú. |
| `GET` | `/api/categorias` | Lista categorías (ej: Bebidas, Fuertes). |
| `POST` | `/api/categorias` | Crea nueva categoría. |

#### 🧾 Gestión de Pedidos (Core)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/pedidos` | **[CRÍTICO]** Crea un pedido, reserva stock y notifica a RabbitMQ. |
| `PUT` | `/api/pedidos/{id}/estado` | Avanza el flujo: `PENDIENTE` → `ACEPTADO` → `LISTO`. |
| `GET` | `/api/pedidos/restaurante/{id}` | Bandeja de entrada de pedidos para la cocina. |
| `GET` | `/api/pedidos/cliente/{id}` | Historial de pedidos del estudiante. |

#### 🔐 Auth Restaurante & Acceso Público
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/auth/registro` | Registra un nuevo local comercial. |
| `POST` | `/api/auth/login` | Autenticación de administradores de restaurante. |
| `GET` | `/api/publico/restaurantes` | **(Público)** Catálogo de locales para la App Cliente. |
| `GET` | `/api/publico/productos` | **(Público)** Menú visible para estudiantes. |

---

### 2️⃣ Microservicio Cliente (Puerto 8082)
**Responsabilidad:** Autenticación y gestión de usuarios finales (Estudiantes).

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/cliente/registro` | Registro de estudiante (Valida correo @udla.edu.ec). |
| `POST` | `/api/cliente/login` | Inicio de sesión. |
| `GET` | `/api/cliente/{id}` | Obtiene perfil del estudiante. |
| `DELETE` | `/api/cliente/{id}` | Elimina cuenta y datos personales (GDPR Compliance). |

---

### 3️⃣ Microservicio Repartidor / Logística (Puerto 8083)
**Responsabilidad:** Sistema de reparto tipo Uber/Rappi. Maneja estados complejos y chat.

#### 🛵 Flujo de Entrega (Walker)
El ciclo de vida de una entrega sigue este orden estricto:

1.  **Radar:** El repartidor busca pedidos cercanos.
2.  **Tomar:** Asigna el pedido a su ID.
3.  **Recoger:** Confirma que tiene el paquete en el restaurante.
4.  **Llegue:** Notifica al cliente que está en el aula/ubicación.
5.  **Finalizar:** Entrega validada con **Código de Seguridad**.

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/logistica/disponibles` | **Radar:** Muestra pedidos listos para recoger. |
| `PUT` | `/api/logistica/{id}/tomar/{repartidorId}` | Asigna un pedido al repartidor. |
| `PUT` | `/api/logistica/{id}/recoger` | Cambia estado a `EN_CAMINO`. |
| `PUT` | `/api/logistica/{id}/llegue` | Cambia estado a `LLEGO` (Notifica al cliente). |
| `PUT` | `/api/logistica/{id}/finalizar` | **Valida Código de Seguridad** y cierra el pedido (`ENTREGADO`). |
| `PUT` | `/api/logistica/{id}/cancelar` | Libera el pedido para que otro lo tome. |

#### 💬 Chat y Utilidades
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `PUT` | `/api/logistica/{id}/chat` | Envía mensajes bidireccionales (Cliente <-> Repartidor). |
| `GET` | `/api/logistica/historial/{id}` | Historial de ganancias y entregas del repartidor. |
| `GET` | `/api/logistica/pedido-original/{id}` | Obtiene metadatos sincronizados con el Restaurante. |

#### 🔐 Auth Repartidor
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/auth/registro` | Registro de Walker (Incluye datos de vehículo/bici). |
| `POST` | `/api/auth/login` | Acceso a la App de Reparto. |

---

### 4️⃣ Módulo Serverless (Puerto 8084)
**Responsabilidad:** Computación efímera para cálculos auxiliares.

> Este servicio no utiliza arquitectura MVC tradicional. Implementa **Spring Cloud Function** para exponer una Lambda Java como endpoint HTTP.

| Método | Endpoint | Input | Output |
| :--- | :--- | :--- | :--- |
| `POST` | `/estimarTiempo` | `Integer` (Num. Platos) | `String` (Mensaje con tiempo estimado) |

---

## 🛠️ Guía de Despliegue Local

1.  **Infraestructura:** Levantar bases de datos y RabbitMQ.
    ```bash
    cd infrastructure
    docker-compose up -d
    ```

2.  **Ejecución de Servicios:**
    Es necesario levantar cada microservicio en su terminal independiente (o usar la configuración Run Dashboard de IntelliJ):
    * `Backend/ms-restaurante`
    * `Backend/ms-cliente`
    * `Backend/ms-repartidor`
    * `Backend/ms-tiempoentrega`

3.  **Verificación:**
    Acceder a `http://localhost:8081/swagger-ui/index.html` para verificar que el núcleo está activo.

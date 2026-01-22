# UdlaEats - Frontend

Este directorio contiene la suite de aplicaciones de usuario (SPA - Single Page Applications) desarrolladas con **React 18** y **Vite**. El ecosistema Frontend está diseñado bajo el principio de **Mobile-First** para los usuarios finales y **Dashboard Desktop** para la administración.

## ⚡ Tech Stack

* **Framework:** React 18
* **Build Tool:** Vite (Ultra-fast HMR)
* **Estilos:** TailwindCSS (Utility-first CSS)
* **Estado:** React Hooks (`useState`, `useEffect`, `useRef`)
* **Comunicación:** Fetch API (Native)
* **Integración:** Consumo de Microservices (REST) y Serverless Functions.

---

## 📱 Mapa de Aplicaciones

El sistema se divide en 3 clientes independientes, cada uno consumiendo su propia API Gateway lógica:

| Aplicación | Ruta | Perfil de Usuario | Enfoque de Diseño |
| :--- | :--- | :--- | :--- |
| **App Cliente** | `./frontend_cliente` | Estudiantes / Profesores | **Mobile-First**. Interfaz ágil para pedir comida rápidamente entre clases. |
| **Web Restaurante** | `./frontend-restaurante` | Administrador de Local | **Desktop Dashboard**. Panel de control para gestión de pedidos e inventario. |
| **App Repartidor** | `./frontend_repartidor` | Walkers (Repartidores) | **Mobile-First**. Interfaz operativa con radar de pedidos y chat. |

---

## 🚀 Detalles Funcionales por Módulo

### 1️⃣ App Cliente (Estudiantes)
La interfaz principal para la generación de ingresos.
* **Catálogo Dinámico:** Carga de menús en tiempo real desde `ms-restaurante`.
* **Integración Serverless:** Al confirmar el pedido, consulta a la Lambda (`ms-function-tiempo`) para mostrar una estimación de entrega basada en la carga de cocina.
* **Seguimiento en Vivo:** Polling inteligente para actualizar el estado del pedido (`COCINANDO` -> `EN CAMINO`).
* **Seguridad:** Recepción de **Código de Verificación** único para validar la entrega.

### 2️⃣ Web Restaurante (Administración)
Panel de control centralizado para los dueños de los locales.
* **Gestión de Menú (CRUD):** Creación y edición de platos/categorías.
* **Control de Pedidos:** Kanban visual para cambiar estados (`PENDIENTE` -> `ACEPTADO` -> `LISTO`).
* **Historial de Ventas:** Visualización de pedidos finalizados.

### 3️⃣ App Repartidor (Logística)
Herramienta de trabajo para los walkers dentro del campus.
* **Radar de Pedidos:** Lista de pedidos cercanos disponibles para "Tomar".
* **Flujo de Estado:** Control estricto de pasos (`TOMAR` -> `RECOGER` -> `LLEGUE` -> `FINALIZAR`).
* **Chat Bidireccional:** Sistema de mensajería integrado con el cliente final.
* **Validación:** Input para ingresar el código de seguridad y liberar el pago.

---

## ⚙️ Configuración y Despliegue

### Requisitos Previos
* Node.js v18+
* NPM

### Instalación General
Cada proyecto es independiente. Para instalar dependencias, ejecutar en cada subcarpeta:

```npm install```

```npm run dev -- --host```

La bandera --host es crucial para exponer la aplicación en la red local y permitir pruebas desde dispositivos móviles reales.

⚠️ Configuración de Conectividad (IP)
Debido a que el backend corre en contenedores o en el host, es necesario configurar la IP de la máquina de desarrollo para pruebas móviles.

Editar el archivo src/App.jsx en cada proyecto y ajustar la constante:

// Reemplazar con la IPv4 de tu máquina (ipconfig/ifconfig)
const IP_PC = '192.168.100.XXX'; 

🔄 Flujo de Datos Frontend-Backend
Request: React realiza fetch() a los puertos del Backend (8081, 8082, 8083, 8084).

CORS: Se manejan cabeceras de seguridad para permitir peticiones cruzadas.

Feedback: Se utilizan alertas nativas o SweetAlert para notificar éxito/error al usuario.

Real-time: Simulación de tiempo real mediante Short Polling (actualización cada 3-5 segundos) para estados de pedidos y chat.

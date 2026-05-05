# MS-03 · Gestión de Mascotas (Reportes)
**Proyecto:** Sanos y Salvos  
**Stack:** Node.js · TypeScript · Express.js · TypeORM · PostgreSQL · RabbitMQ · Multer

---

## Descripción

Microservicio central que gestiona el ciclo de vida de los reportes de mascotas perdidas y encontradas. Aplica los patrones **Repository**, **Factory Method** y **Circuit Breaker** exigidos por el DAS, y publica eventos hacia RabbitMQ para que el MS-04 (Localización) y el MS-05 (Matching) reaccionen de forma asíncrona.

---

## Estructura del proyecto

```
ms-mascotas/
├── src/
│   ├── config/
│   │   └── database.ts            # DataSource TypeORM (conexión PostgreSQL)
│   ├── entities/
│   │   ├── Reporte.ts             # Entidad principal + ENUMs (tipo, estado, tamaño)
│   │   └── ReporteFoto.ts         # Entidad de imágenes asociadas al reporte
│   ├── factories/
│   │   └── ReporteFactory.ts      # Factory Method: instancia PERDIDA o ENCONTRADA
│   ├── repositories/
│   │   ├── IReporteRepository.ts  # Interfaz del repositorio (contrato)
│   │   └── ReporteRepository.ts   # Implementación concreta con TypeORM
│   ├── services/
│   │   ├── ReporteService.ts      # Lógica de negocio + orquestación de eventos
│   │   └── MensajeriaService.ts   # Cliente RabbitMQ (publicación de eventos)
│   ├── controllers/
│   │   └── ReporteController.ts   # Manejadores HTTP (entrada/salida)
│   ├── middlewares/
│   │   ├── auth.ts                # Validación JWT + extracción de usuario/rol
│   │   ├── upload.ts              # Multer: subida de imágenes (JPEG/PNG/WebP)
│   │   ├── validaciones.ts        # Reglas express-validator por endpoint
│   │   └── errorHandler.ts        # Manejador global de errores HTTP
│   ├── routes/
│   │   └── reportes.routes.ts     # Definición y composición de rutas
│   └── index.ts                   # Bootstrap: DB + RabbitMQ + Express
├── migrations/
│   └── 001_create_reportes.sql    # DDL: tablas, ENUMs, índices y trigger
├── Dockerfile                     # Build multi-etapa (builder + production)
├── docker-compose.yml             # ms-mascotas + postgres + rabbitmq
├── .env.example                   # Variables de entorno documentadas
├── package.json                   # Dependencias y scripts npm
└── tsconfig.json                  # Configuración TypeScript
```

---

## Modelo de datos — Clase `Reporte`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único (PK) |
| `nombreMascota` | string | Nombre de la mascota |
| `raza` | string | Raza del animal |
| `color` | string | Color o descripción de pelaje |
| `tamanio` | PEQUEÑO / MEDIANO / GRANDE | Talla estandarizada |
| `tipo` | PERDIDA / ENCONTRADA | Tipo de reporte (Factory Method) |
| `estado` | EN_BUSQUEDA / RESUELTO / ABANDONADO / OCULTO | Estado del ciclo de vida |
| `fechaPublicacion` | Date | Asignada automáticamente al crear |
| `ubicacionLatitud` | float8 | Latitud del lugar de pérdida/encuentro |
| `ubicacionLongitud` | float8 | Longitud del lugar de pérdida/encuentro |
| `direccionReferencia` | string? | Dirección legible (opcional) |
| `descripcion` | string? | Señas particulares adicionales |
| `usuarioId` | UUID | Propietario del reporte |
| `fotos` | ReporteFoto[] | Imágenes adjuntas |

### ¿Por qué lat/lng y no un texto de dirección?

La ubicación se almacena como coordenadas geográficas (`float8`) porque:
1. **MS-04 (Localización/PostGIS)** las consume directamente al recibir el evento RabbitMQ para crear un `POINT(lng, lat)` en la base de datos espacial, sin geocodificación extra.
2. **Leaflet.js** (frontend) las renderiza como marcador en el mapa interactivo sin transformación.
3. **MS-05 (Matching)** puede calcular distancias reales entre reportes (`ST_Distance`) para el scoring geográfico.

El campo `direccionReferencia` (opcional) guarda la dirección legible para mostrarla al usuario.

---

## Endpoints

Todas las rutas requieren `Authorization: Bearer <JWT>` (token emitido por MS-01 y validado en el API Gateway).

| Método | Ruta | Descripción | Rol mínimo |
|---|---|---|---|
| `POST` | `/reportes` | Crear reporte (multipart/form-data) | USUARIO |
| `GET` | `/reportes` | Listar con filtros opcionales | USUARIO |
| `GET` | `/reportes/:id` | Obtener uno | USUARIO |
| `PUT` | `/reportes/:id` | Editar datos y/o agregar fotos | USUARIO (propio) |
| `PATCH` | `/reportes/:id/estado` | Cambiar estado del reporte | USUARIO (propio) |
| `DELETE` | `/reportes/:id` | Eliminar | USUARIO (propio, solo RESUELTO/ABANDONADO) |

### Filtros disponibles en `GET /reportes`

| Query param | Valores |
|---|---|
| `tipo` | `PERDIDA`, `ENCONTRADA` |
| `estado` | `EN_BUSQUEDA`, `RESUELTO`, `ABANDONADO`, `OCULTO` |
| `raza` | Texto libre (búsqueda parcial) |
| `color` | Texto libre (búsqueda parcial) |
| `usuarioId` | UUID del usuario |

### Body `POST /reportes` (multipart/form-data)

```
nombreMascota     string   requerido
raza              string   requerido
color             string   requerido
tamanio           PEQUEÑO | MEDIANO | GRANDE   requerido
tipo              PERDIDA | ENCONTRADA          requerido
ubicacionLatitud  float   requerido  (-90 a 90)
ubicacionLongitud float   requerido  (-180 a 180)
direccionReferencia string  opcional
descripcion       string   opcional
fotos             File[]   opcional (máx. 5, JPEG/PNG/WebP, 5 MB c/u)
```

---

## Eventos RabbitMQ publicados

Exchange: `sanos_y_salvos_events` (tipo: `topic`)

| Routing Key | Consumidores | Payload relevante |
|---|---|---|
| `mascota.reporte.creado` | MS-04, MS-05 | `reporteId`, `ubicacionLatitud`, `ubicacionLongitud`, `raza`, `color`, `tamanio` |
| `mascota.reporte.actualizado` | MS-04 | `reporteId`, nuevas coordenadas |
| `mascota.reporte.estado_cambiado` | MS-04, MS-05 | `reporteId`, `estado` |
| `mascota.reporte.eliminado` | MS-04 | `reporteId` |

---

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Levantar con Docker Compose
docker compose up -d

# 3. Desarrollo local (requiere PostgreSQL y RabbitMQ corriendo)
npm install
npm run dev
```

> La red `sanos-y-salvos-net` debe existir previamente:  
> `docker network create sanos-y-salvos-net`

---

## Patrones implementados

| Patrón | Ubicación | Propósito |
|---|---|---|
| **Repository** | `IReporteRepository` / `ReporteRepository` | Desacoplar lógica de negocio del acceso a datos |
| **Factory Method** | `ReporteFactory` | Instanciar `Reporte` según tipo (PERDIDA / ENCONTRADA) |
| **Circuit Breaker** | A implementar en el API Gateway (librería Opossum) | Resiliencia ante caída del microservicio |

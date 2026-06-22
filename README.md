# Sistema Inteligente de Recepción, Clasificación y Gestión de Cheques

Sistema que permite registrar cheques mediante una fotografía, extraer sus datos automáticamente con inteligencia artificial (Google Gemini Vision), almacenarlos en una base de datos PostgreSQL y visualizarlos en un dashboard web en tiempo real.

## Arquitectura del sistema

```
Foto del cheque
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Formulario │────▶│  Cloudinary  │────▶│  Gemini IA   │────▶│  Neon (DB)   │
│    HTML     │     │  (imágenes)  │     │  (OCR + IA)  │     │ (PostgreSQL) │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                                                                    ▼
                                                             ┌─────────────┐
                                                             │  Dashboard   │
                                                             │    HTML      │
                                                             └─────────────┘
```

La automatización completa corre en **n8n** (plataforma de workflows), que conecta todos los servicios sin necesidad de un backend propio.

## Funcionalidades

- **OCR con IA**: subís una foto del cheque y Gemini Vision extrae automáticamente número, banco, cliente, CUIT, monto, fechas.
- **Detección de inconsistencias**: la IA detecta si un cheque está vencido, si el monto no coincide, o si falta información clave.
- **Nivel de confianza**: cada extracción tiene un porcentaje de confianza para que el usuario sepa si necesita revisión manual.
- **Dashboard en tiempo real**: muestra cheques pendientes, depositados, rechazados, próximos vencimientos y distribución por banco.
- **Cambio de estado**: desde el dashboard se puede cambiar el estado de un cheque (Pendiente → Depositado → Acreditado / Rechazado).
- **Historial automático**: cada cambio de estado queda registrado en una tabla de auditoría mediante triggers de PostgreSQL.
- **Alertas de vencimiento**: workflow programado que envía alertas por email cuando un cheque está por vencer.

## Estructura del proyecto

```
├── dashboard_cheques.html        # Dashboard conectado a la base de datos
├── subir_cheque_test.html        # Formulario para subir imágenes de cheques
├── schema_neon.sql               # Script SQL para crear las tablas en Neon/PostgreSQL
├── workflow_cheques_n8n.json     # Workflow de n8n: OCR + clasificación + inserción
├── workflow_api_cheques.json     # Workflow de n8n: API endpoints para el dashboard
└── README.md
```

## Tecnologías utilizadas

| Componente | Tecnología | Función |
|---|---|---|
| Frontend | HTML + CSS + JavaScript | Dashboard y formulario de carga |
| Automatización | n8n (Cloud) | Orquesta todo el flujo sin backend propio |
| IA / OCR | Google Gemini Flash (Vision) | Lee imágenes de cheques y extrae datos estructurados |
| Base de datos | Neon (PostgreSQL serverless) | Almacena cheques, historial, usuarios |
| Almacenamiento de imágenes | Cloudinary | Guarda las fotos de los cheques en la nube |

## Instalación y configuración

### 1. Base de datos (Neon)

1. Crear una cuenta en [neon.tech](https://neon.tech).
2. Crear un proyecto nuevo.
3. En el SQL Editor, ejecutar el contenido de `schema_neon.sql`.
4. Copiar los datos de conexión (Host, Database, User, Password).

### 2. Cloudinary

1. Crear una cuenta en [cloudinary.com](https://cloudinary.com).
2. Ir a Settings → Upload → Upload presets.
3. Crear un preset llamado `cheques_upload` en modo **Unsigned**.
4. Copiar el Cloud name.

### 3. Google Gemini

1. Ir a [aistudio.google.com](https://aistudio.google.com).
2. Crear una API key.

### 4. n8n

1. Crear una cuenta en [n8n.io](https://n8n.io).
2. Importar `workflow_cheques_n8n.json` (flujo de OCR).
3. Importar `workflow_api_cheques.json` (API para el dashboard) en el mismo workflow.
4. Configurar las credenciales:
   - **Cloudinary**: configurar la URL del nodo HTTP Request con el Cloud name.
   - **Gemini**: pegar la API key en la URL del nodo HTTP Request.
   - **PostgreSQL**: crear credencial con los datos de Neon (Host, DB, User, Password, Port 5432, SSL Allow).
5. Publicar y activar el workflow.

### 5. Usar el sistema

1. Abrir `subir_cheque_test.html` en el navegador.
2. Pegar la Test URL del webhook de n8n.
3. Subir una foto de un cheque.
4. Abrir `dashboard_cheques.html` en el navegador.
5. Pegar la Production URL base del webhook (ej: `https://tu-instancia.app.n8n.cloud/webhook`).
6. Hacer clic en Conectar.

## Flujo de datos

1. El usuario sube una foto de un cheque desde el formulario.
2. El webhook de n8n recibe la imagen.
3. La imagen se sube a Cloudinary (almacenamiento permanente).
4. Se convierte a base64 y se envía a Gemini Vision.
5. Gemini analiza la imagen y devuelve un JSON con los datos extraídos.
6. Se validan los datos (número de cheque no vacío, monto mayor a 0).
7. Si son válidos, se insertan en la base de datos de Neon.
8. Los triggers de PostgreSQL registran automáticamente el historial.
9. El dashboard consulta la API y muestra los datos en tiempo real.

## Base de datos

### Tablas
- **cheques**: tabla principal con todos los datos del cheque + campos de IA (datos_ia, confianza_ia, inconsistencia).
- **historial_estados**: se llena automáticamente con triggers. Registra cada cambio de estado.
- **usuarios**: tabla preparada para agregar autenticación con roles (administrativo, tesorería, contador, responsable financiero).

### Vistas precalculadas
- **vista_resumen_estados**: cantidad y monto total por estado.
- **vista_proximos_vencimientos**: cheques pendientes que vencen en los próximos 7 días.
- **vista_distribucion_banco**: distribución de montos por banco emisor.
- **vista_inconsistencias**: cheques donde la IA detectó problemas.

## Usuarios del sistema

- Personal administrativo
- Área de tesorería
- Contadores
- Responsables financieros
- Personal de caja o recepción de pagos

## Autor

Proyecto académico de Ingeniería — Automatización con IA.

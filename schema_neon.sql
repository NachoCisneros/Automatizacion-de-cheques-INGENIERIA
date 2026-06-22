-- ============================================================
-- Sistema Inteligente de Recepción, Clasificación y Gestión de Cheques
-- Schema para Neon (PostgreSQL)
-- ============================================================

-- Extensión para UUIDs (Neon la trae habilitada, pero por las dudas)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Tabla principal: cheques
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cheques (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_cheque       VARCHAR(30) NOT NULL UNIQUE,
    banco_emisor        VARCHAR(100) NOT NULL,
    cliente_razon_social VARCHAR(150) NOT NULL,
    cuit                VARCHAR(15),
    monto               NUMERIC(14,2) NOT NULL CHECK (monto > 0),
    fecha_emision       DATE NOT NULL,
    fecha_vencimiento   DATE NOT NULL,
    estado              VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
                         CHECK (estado IN ('Pendiente', 'Depositado', 'Acreditado', 'Rechazado')),
    imagen_url          TEXT,                  -- link a la imagen en storage (ej. Cloudinary, S3, Drive)
    datos_ia            JSONB,                 -- respuesta cruda de la IA (Gemini) al leer la imagen
    confianza_ia        NUMERIC(4,3),          -- 0.000 a 1.000, qué tan segura estuvo la IA del OCR
    inconsistencia      BOOLEAN DEFAULT FALSE, -- la IA detectó algo raro (monto ilegible, fecha vencida al cargar, etc.)
    observaciones        TEXT,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Historial de cambios de estado (auditoría)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_estados (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cheque_id       UUID NOT NULL REFERENCES cheques(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(20),
    estado_nuevo    VARCHAR(20) NOT NULL,
    motivo          TEXT,
    origen          VARCHAR(20) DEFAULT 'manual' CHECK (origen IN ('manual', 'automatico', 'ia')),
    cambiado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Usuarios del sistema (opcional, si vas a manejar login)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    rol         VARCHAR(30) NOT NULL DEFAULT 'administrativo'
                CHECK (rol IN ('administrativo', 'tesoreria', 'contador', 'responsable_financiero')),
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Trigger: actualizar "actualizado_en" automáticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cheques_actualizado ON cheques;
CREATE TRIGGER trg_cheques_actualizado
    BEFORE UPDATE ON cheques
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ------------------------------------------------------------
-- Trigger: registrar automáticamente en historial cuando cambia el estado
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION registrar_historial_estado()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado) THEN
        INSERT INTO historial_estados (cheque_id, estado_anterior, estado_nuevo, origen)
        VALUES (NEW.id, OLD.estado, NEW.estado, 'manual');
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO historial_estados (cheque_id, estado_anterior, estado_nuevo, origen)
        VALUES (NEW.id, NULL, NEW.estado, 'automatico');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cheques_historial ON cheques;
CREATE TRIGGER trg_cheques_historial
    AFTER INSERT OR UPDATE ON cheques
    FOR EACH ROW
    EXECUTE FUNCTION registrar_historial_estado();

-- ------------------------------------------------------------
-- Índices para las búsquedas y filtros que pide el wireframe
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cheques_estado       ON cheques (estado);
CREATE INDEX IF NOT EXISTS idx_cheques_banco         ON cheques (banco_emisor);
CREATE INDEX IF NOT EXISTS idx_cheques_cliente       ON cheques (cliente_razon_social);
CREATE INDEX IF NOT EXISTS idx_cheques_vencimiento   ON cheques (fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_historial_cheque_id   ON historial_estados (cheque_id);

-- ------------------------------------------------------------
-- Vistas útiles para el dashboard y reportes
-- ------------------------------------------------------------

-- Resumen por estado (tarjetas del dashboard)
CREATE OR REPLACE VIEW vista_resumen_estados AS
SELECT estado, COUNT(*) AS cantidad, SUM(monto) AS monto_total
FROM cheques
GROUP BY estado;

-- Próximos vencimientos (próximos 7 días, solo pendientes)
CREATE OR REPLACE VIEW vista_proximos_vencimientos AS
SELECT id, numero_cheque, cliente_razon_social, banco_emisor, monto, fecha_vencimiento,
       (fecha_vencimiento - CURRENT_DATE) AS dias_restantes
FROM cheques
WHERE estado = 'Pendiente'
  AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY fecha_vencimiento ASC;

-- Distribución por banco
CREATE OR REPLACE VIEW vista_distribucion_banco AS
SELECT banco_emisor, COUNT(*) AS cantidad, SUM(monto) AS monto_total
FROM cheques
GROUP BY banco_emisor
ORDER BY monto_total DESC;

-- Cheques con inconsistencias detectadas por la IA
CREATE OR REPLACE VIEW vista_inconsistencias AS
SELECT id, numero_cheque, cliente_razon_social, observaciones, confianza_ia, creado_en
FROM cheques
WHERE inconsistencia = TRUE
ORDER BY creado_en DESC;

-- ------------------------------------------------------------
-- Datos de ejemplo (para pruebas, igual que el wireframe)
-- ------------------------------------------------------------
INSERT INTO cheques (numero_cheque, banco_emisor, cliente_razon_social, monto, fecha_emision, fecha_vencimiento, estado)
VALUES
    ('12345', 'Nación',  'Empresa A', 250000, '2026-05-10', '2026-06-05', 'Pendiente'),
    ('12346', 'Macro',   'Empresa B', 150000, '2026-05-02', '2026-05-20', 'Depositado'),
    ('12347', 'Galicia', 'Empresa C', 500000, '2026-04-22', '2026-05-01', 'Rechazado')
ON CONFLICT (numero_cheque) DO NOTHING;

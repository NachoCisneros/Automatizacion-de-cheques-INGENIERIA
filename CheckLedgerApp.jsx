import React, { useState, useMemo } from "react";

// ---------- Mock data (basado en el wireframe) ----------
const initialCheques = [
  { id: "12345", cliente: "Empresa A", banco: "Nación", monto: 250000, emision: "2026-05-10", vence: "2026-06-05", estado: "Pendiente" },
  { id: "12346", cliente: "Empresa B", banco: "Macro", monto: 150000, emision: "2026-05-02", vence: "2026-05-20", estado: "Depositado" },
  { id: "12347", cliente: "Empresa C", banco: "Galicia", monto: 500000, emision: "2026-04-22", vence: "2026-05-01", estado: "Rechazado" },
  { id: "12348", cliente: "Empresa D", banco: "Galicia", monto: 120000, emision: "2026-06-01", vence: "2026-06-07", estado: "Pendiente" },
  { id: "12349", cliente: "Empresa E", banco: "Macro", monto: 85000, emision: "2026-06-02", vence: "2026-06-08", estado: "Pendiente" },
  { id: "12350", cliente: "Empresa F", banco: "Nación", monto: 320000, emision: "2026-05-15", vence: "2026-05-25", estado: "Acreditado" },
];

const estadoColor = {
  Pendiente: "#C98A2B",
  Depositado: "#2F6F4E",
  Acreditado: "#3D6FA1",
  Rechazado: "#A13D2B",
};

function fmtMoney(n) {
  return "$" + n.toLocaleString("es-AR");
}
function fmtDate(d) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y.slice(2)}`;
}
function daysUntil(dateStr) {
  const today = new Date("2026-06-21");
  const target = new Date(dateStr);
  return Math.round((target - today) / 86400000);
}

// ---------- Shared bits ----------
function PerforatedDivider() {
  return (
    <div
      style={{
        height: 1,
        margin: "28px 0",
        backgroundImage:
          "repeating-linear-gradient(to right, #C7BFAE 0 6px, transparent 6px 12px)",
      }}
    />
  );
}

function EstadoTag({ estado }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: estadoColor[estado],
        border: `1px solid ${estadoColor[estado]}`,
        borderRadius: 3,
        padding: "3px 8px",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: estadoColor[estado],
          display: "inline-block",
        }}
      />
      {estado}
    </span>
  );
}

function StatCard({ label, value, accent, sub }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 150,
        background: "#FBF8F2",
        border: "1px solid #C7BFAE",
        borderRadius: 4,
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: accent,
        }}
      />
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#6b6457",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 32,
          fontWeight: 600,
          color: "#1F2D3D",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#8a8273", marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

// ---------- Views ----------
function DashboardView({ cheques, onSelect }) {
  const pendientes = cheques.filter((c) => c.estado === "Pendiente");
  const depositados = cheques.filter((c) => c.estado === "Depositado");
  const rechazados = cheques.filter((c) => c.estado === "Rechazado");
  const proximos = [...cheques]
    .filter((c) => c.estado === "Pendiente")
    .sort((a, b) => new Date(a.vence) - new Date(b.vence));

  const totalPorBanco = useMemo(() => {
    const map = {};
    cheques.forEach((c) => {
      map[c.banco] = (map[c.banco] || 0) + c.monto;
    });
    return map;
  }, [cheques]);
  const maxBanco = Math.max(...Object.values(totalPorBanco));

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard
          label="Pendientes"
          value={pendientes.length}
          accent={estadoColor.Pendiente}
          sub={fmtMoney(pendientes.reduce((s, c) => s + c.monto, 0))}
        />
        <StatCard
          label="Depositados"
          value={depositados.length}
          accent={estadoColor.Depositado}
          sub={fmtMoney(depositados.reduce((s, c) => s + c.monto, 0))}
        />
        <StatCard
          label="Rechazados"
          value={rechazados.length}
          accent={estadoColor.Rechazado}
          sub={fmtMoney(rechazados.reduce((s, c) => s + c.monto, 0))}
        />
      </div>

      <PerforatedDivider />

      <h3 style={sectionTitle}>Próximos vencimientos</h3>
      <div style={{ border: "1px solid #C7BFAE", borderRadius: 4, overflow: "hidden" }}>
        {proximos.map((c, i) => {
          const d = daysUntil(c.vence);
          return (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
                alignItems: "center",
                padding: "12px 16px",
                borderTop: i === 0 ? "none" : "1px solid #E4DECF",
                cursor: "pointer",
                background: i % 2 ? "#FBF8F2" : "#F4F1EA",
              }}
            >
              <span style={{ fontWeight: 600, color: "#1F2D3D" }}>{c.cliente}</span>
              <span style={{ color: "#6b6457", fontSize: 14 }}>{c.banco}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
                {fmtDate(c.vence)}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
                {fmtMoney(c.monto)}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: d <= 2 ? "#A13D2B" : "#8a8273",
                  justifySelf: "end",
                }}
              >
                {d <= 0 ? "vencido" : `en ${d}d`}
              </span>
            </div>
          );
        })}
      </div>

      <PerforatedDivider />

      <h3 style={sectionTitle}>Distribución por banco</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.entries(totalPorBanco).map(([banco, total]) => (
          <div key={banco} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 80, fontSize: 13, color: "#1F2D3D" }}>{banco}</span>
            <div style={{ flex: 1, background: "#E4DECF", borderRadius: 2, height: 10 }}>
              <div
                style={{
                  width: `${(total / maxBanco) * 100}%`,
                  height: "100%",
                  background: "#3D6FA1",
                  borderRadius: 2,
                }}
              />
            </div>
            <span
              style={{
                width: 100,
                textAlign: "right",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: "#6b6457",
              }}
            >
              {fmtMoney(total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NuevoChequeView({ onGuardar }) {
  const [form, setForm] = useState({
    numero: "",
    banco: "",
    cliente: "",
    monto: "",
    emision: "",
    vence: "",
  });
  const [saved, setSaved] = useState(false);

  const field = (key, label, type = "text", placeholder) => (
    <label style={fieldLabel}>
      {label}
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        style={inputStyle}
      />
    </label>
  );

  const handleGuardar = () => {
    if (!form.numero || !form.cliente || !form.banco || !form.monto) return;
    onGuardar({
      id: form.numero,
      cliente: form.cliente,
      banco: form.banco,
      monto: Number(form.monto),
      emision: form.emision || "2026-06-21",
      vence: form.vence || "2026-06-21",
      estado: "Pendiente",
    });
    setSaved(true);
    setForm({ numero: "", banco: "", cliente: "", monto: "", emision: "", vence: "" });
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h3 style={sectionTitle}>Nuevo cheque</h3>
      <div
        style={{
          border: "1px solid #C7BFAE",
          borderRadius: 4,
          padding: 24,
          background: "#FBF8F2",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {field("numero", "Número de cheque", "text", "ej. 12351")}
          {field("banco", "Banco", "text", "ej. Nación")}
        </div>
        <div style={{ marginTop: 16 }}>
          {field("cliente", "Cliente / Razón social", "text", "ej. Empresa G")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          {field("monto", "Monto", "number", "0")}
          <div />
          {field("emision", "Fecha de emisión", "date")}
          {field("vence", "Fecha de vencimiento", "date")}
        </div>

        <div style={{ marginTop: 16 }}>
          <span style={fieldLabel.props ? null : null} />
          <span style={{ ...fieldLabel, display: "block" }}>Imagen del cheque</span>
          <div
            style={{
              marginTop: 6,
              border: "1px dashed #C7BFAE",
              borderRadius: 4,
              padding: "24px 16px",
              textAlign: "center",
              color: "#8a8273",
              fontSize: 13,
              background: "#F4F1EA",
            }}
          >
            Arrastrá una imagen o hacé clic para seleccionar
            <br />
            <span style={{ fontSize: 11 }}>La IA extraerá los datos automáticamente (OCR)</span>
          </div>
        </div>

        <PerforatedDivider />

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button style={btnGhost}>Cancelar</button>
          <button style={btnPrimary} onClick={handleGuardar}>
            Guardar cheque
          </button>
        </div>
        {saved && (
          <div style={{ marginTop: 12, fontSize: 13, color: "#2F6F4E" }}>
            ✓ Cheque guardado correctamente.
          </div>
        )}
      </div>
    </div>
  );
}

function GestionView({ cheques, onSelect, filtroEstado, setFiltroEstado, busqueda, setBusqueda }) {
  const filtrados = cheques.filter((c) => {
    const matchEstado = filtroEstado === "Todos" || c.estado === filtroEstado;
    const matchBusqueda =
      busqueda === "" ||
      c.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.id.includes(busqueda);
    return matchEstado && matchBusqueda;
  });

  return (
    <div>
      <h3 style={sectionTitle}>Gestión de cheques</h3>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar por cliente o número..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...inputStyle, width: 240 }}
        />
        {["Todos", "Pendiente", "Depositado", "Acreditado", "Rechazado"].map((e) => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            style={{
              ...btnGhost,
              padding: "6px 14px",
              fontSize: 12,
              background: filtroEstado === e ? "#1F2D3D" : "transparent",
              color: filtroEstado === e ? "#F4F1EA" : "#1F2D3D",
              borderColor: filtroEstado === e ? "#1F2D3D" : "#C7BFAE",
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <div style={{ border: "1px solid #C7BFAE", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 1.2fr 1fr 1fr 1fr",
            padding: "10px 16px",
            background: "#1F2D3D",
            color: "#F4F1EA",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <span>Nº</span>
          <span>Cliente</span>
          <span>Banco</span>
          <span>Monto</span>
          <span>Estado</span>
        </div>
        {filtrados.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#8a8273", fontSize: 13 }}>
            No hay cheques que coincidan con la búsqueda.
          </div>
        )}
        {filtrados.map((c, i) => (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              display: "grid",
              gridTemplateColumns: "0.8fr 1.2fr 1fr 1fr 1fr",
              alignItems: "center",
              padding: "12px 16px",
              borderTop: i === 0 ? "none" : "1px solid #E4DECF",
              cursor: "pointer",
              background: i % 2 ? "#FBF8F2" : "#F4F1EA",
            }}
          >
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{c.id}</span>
            <span style={{ fontWeight: 600 }}>{c.cliente}</span>
            <span style={{ fontSize: 14, color: "#6b6457" }}>{c.banco}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
              {fmtMoney(c.monto)}
            </span>
            <EstadoTag estado={c.estado} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetalleView({ cheque, onUpdateEstado }) {
  if (!cheque) {
    return (
      <div style={{ color: "#8a8273", fontSize: 14 }}>
        Seleccioná un cheque desde el Dashboard o la Gestión para ver el detalle.
      </div>
    );
  }
  const estados = ["Pendiente", "Depositado", "Acreditado", "Rechazado"];

  return (
    <div style={{ maxWidth: 480 }}>
      <h3 style={sectionTitle}>Cheque Nº {cheque.id}</h3>
      <div
        style={{
          border: "1px solid #C7BFAE",
          borderRadius: 4,
          padding: 24,
          background: "#FBF8F2",
        }}
      >
        <DetailRow label="Cliente" value={cheque.cliente} />
        <DetailRow label="Banco" value={cheque.banco} />
        <DetailRow label="Monto" value={fmtMoney(cheque.monto)} mono />
        <DetailRow label="Emisión" value={fmtDate(cheque.emision)} mono />
        <DetailRow label="Vencimiento" value={fmtDate(cheque.vence)} mono />

        <PerforatedDivider />

        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b6457", marginBottom: 10 }}>
          Estado
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {estados.map((e) => (
            <label
              key={e}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontSize: 14,
                color: cheque.estado === e ? "#1F2D3D" : "#6b6457",
              }}
            >
              <input
                type="radio"
                checked={cheque.estado === e}
                onChange={() => onUpdateEstado(cheque.id, e)}
              />
              <EstadoTag estado={e} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #E4DECF",
        fontSize: 14,
      }}
    >
      <span style={{ color: "#6b6457" }}>{label}</span>
      <span
        style={{
          fontWeight: 600,
          color: "#1F2D3D",
          fontFamily: mono ? "'IBM Plex Mono', monospace" : "inherit",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------- Styles ----------
const sectionTitle = {
  fontFamily: "'Fraunces', serif",
  fontSize: 18,
  fontWeight: 600,
  color: "#1F2D3D",
  margin: "0 0 14px 0",
};
const fieldLabel = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#6b6457",
};
const inputStyle = {
  border: "1px solid #C7BFAE",
  borderRadius: 3,
  padding: "9px 10px",
  fontSize: 14,
  fontFamily: "inherit",
  color: "#1F2D3D",
  background: "#FFFFFF",
  outline: "none",
};
const btnPrimary = {
  background: "#1F2D3D",
  color: "#F4F1EA",
  border: "none",
  borderRadius: 3,
  padding: "10px 20px",
  fontSize: 13,
  cursor: "pointer",
  fontWeight: 600,
};
const btnGhost = {
  background: "transparent",
  color: "#1F2D3D",
  border: "1px solid #C7BFAE",
  borderRadius: 3,
  padding: "10px 20px",
  fontSize: 13,
  cursor: "pointer",
};

// ---------- App shell ----------
export default function CheckLedgerApp() {
  const [cheques, setCheques] = useState(initialCheques);
  const [tab, setTab] = useState("Dashboard");
  const [seleccionado, setSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  const tabs = ["Dashboard", "Nuevo Cheque", "Gestión", "Detalle"];

  const handleSelect = (c) => {
    setSeleccionado(c);
    setTab("Detalle");
  };

  const handleGuardar = (nuevo) => {
    setCheques((prev) => [nuevo, ...prev]);
    setTab("Gestión");
  };

  const handleUpdateEstado = (id, estado) => {
    setCheques((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
    setSeleccionado((prev) => (prev && prev.id === id ? { ...prev, estado } : prev));
  };

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', Inter, sans-serif",
        background: "#EFE9DD",
        minHeight: "100%",
        color: "#1F2D3D",
        padding: "0 0 60px 0",
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
      />
      <div
        style={{
          borderBottom: "1px solid #C7BFAE",
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#F4F1EA",
        }}
      >
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700 }}>
            Libro de Cheques
          </div>
          <div style={{ fontSize: 12, color: "#8a8273" }}>
            Sistema inteligente de recepción y clasificación
          </div>
        </div>
        <nav style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? "#1F2D3D" : "transparent",
                color: tab === t ? "#F4F1EA" : "#1F2D3D",
                border: "none",
                borderRadius: 3,
                padding: "8px 16px",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: tab === t ? 600 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ padding: "28px 32px" }}>
        {tab === "Dashboard" && <DashboardView cheques={cheques} onSelect={handleSelect} />}
        {tab === "Nuevo Cheque" && <NuevoChequeView onGuardar={handleGuardar} />}
        {tab === "Gestión" && (
          <GestionView
            cheques={cheques}
            onSelect={handleSelect}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
          />
        )}
        {tab === "Detalle" && (
          <DetalleView cheque={seleccionado} onUpdateEstado={handleUpdateEstado} />
        )}
      </div>
    </div>
  );
}

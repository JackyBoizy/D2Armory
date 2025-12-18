import React, { useEffect, useState, useCallback } from "react";

/* -----------------------------
   Helper: Bungie icon resolver
------------------------------ */
function Icon({ src, size = 48 }) {
  if (!src) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: "#333",
          borderRadius: 4,
        }}
      />
    );
  }

  const url = src.startsWith("/")
    ? `https://www.bungie.net${src}`
    : src;

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}

/* =============================
   MAIN APP
============================= */
export default function App() {
  /* -------- state -------- */
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* -------- data fetch -------- */
  const loadWeapons = useCallback(async (q = "") => {
    if (!window.api?.getWeapons) {
      setError("window.api.getWeapons not available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await window.api.getWeapons({
        limit: 200,
        q,
        itemType: 3, // Weapons
      });

      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load weapons");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  /* -------- initial load -------- */
  useEffect(() => {
    loadWeapons("");
  }, [loadWeapons]);

  /* -------- search -------- */
  useEffect(() => {
    const t = setTimeout(() => loadWeapons(query), 250);
    return () => clearTimeout(t);
  }, [query, loadWeapons]);

  /* -------- open item -------- */
  const openItem = async (hash) => {
    if (!window.api?.getItem) return;

    try {
      const item = await window.api.getItem(hash);
      setSelected(item);
    } catch (err) {
      console.error(err);
    }
  };

  /* =============================
     RENDER
  ============================= */
  return (
    <>
      {/* 🔴 HARD RENDER PROOF */}
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: 9999,
          background: "red",
          color: "white",
          padding: "6px 10px",
          fontWeight: 700,
        }}
      >
        APP RENDERED ✅
      </div>

      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "#0f172a",
          color: "#e5e7eb",
        }}
      >
        {/* =============================
            LEFT PANEL — LIST
        ============================= */}
        <div
          style={{
            width: 420,
            borderRight: "1px solid #1f2933",
            display: "flex",
            flexDirection: "column",
            padding: 12,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>
            Weapons
          </h2>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search weapons..."
            style={{
              marginTop: 8,
              padding: 8,
              background: "#020617",
              border: "1px solid #334155",
              color: "white",
              borderRadius: 4,
            }}
          />

          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
            {loading ? "Loading…" : `${total} results`}
          </div>

          {error && (
            <div style={{ color: "salmon", marginTop: 6 }}>
              {error}
            </div>
          )}

          <div
            style={{
              marginTop: 10,
              overflow: "auto",
              flex: 1,
            }}
          >
            {items.map((w) => (
              <div
                key={w.hash}
                onClick={() => openItem(w.hash)}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 8,
                  cursor: "pointer",
                  borderBottom: "1px solid #1f2933",
                }}
              >
                <Icon src={w.displayProperties?.icon} size={40} />

                <div>
                  <div style={{ fontWeight: 600 }}>
                    {w.displayProperties?.name}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    {w.itemTypeDisplayName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =============================
            RIGHT PANEL — DETAILS
        ============================= */}
        <div style={{ flex: 1, padding: 16, overflow: "auto" }}>
          {selected ? (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700 }}>
                {selected.displayProperties?.name}
              </h2>

              <Icon
                src={selected.displayProperties?.icon}
                size={96}
              />

              <p style={{ maxWidth: 600, marginTop: 10 }}>
                {selected.displayProperties?.description}
              </p>

              <pre
                style={{
                  marginTop: 16,
                  fontSize: 11,
                  background: "#020617",
                  padding: 12,
                  maxHeight: "60vh",
                  overflow: "auto",
                }}
              >
                {JSON.stringify(selected, null, 2)}
              </pre>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select a weapon to view details
            </div>
          )}
        </div>
      </div>
    </>
  );
}

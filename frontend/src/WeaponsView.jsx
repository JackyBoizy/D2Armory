// frontend/src/WeaponsView.jsx
import React, { useEffect, useState } from "react";

export default function WeaponsView() {
  const [weapons, setWeapons] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔎 PROOF: component render + preload check
  console.log("WeaponsView rendered");
  console.log("window.api =", window.api);

  useEffect(() => {
    if (!window.api?.getWeapons) {
      setError("window.api.getWeapons is not available");
      return;
    }

    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await window.api.getWeapons({
          limit: 200,
          q,
          itemType: 3, // weapons
        });

        if (!alive) return;

        const items = (res.items || []).map((w) => ({
          hash: w.hash,
          name: w.displayProperties?.name || "Unknown Weapon",
          icon: w.displayProperties?.icon || null,
          type: w.itemTypeDisplayName || "",
        }));

        setWeapons(items);
        setTotal(res.total ?? items.length);
      } catch (err) {
        console.error(err);
        if (alive) setError("Failed to load weapons");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [q]);

  const openItem = async (hash) => {
    if (!window.api?.getItem) return;

    try {
      const item = await window.api.getItem(hash);
      setSelected(item);
    } catch (e) {
      console.error(e);
      setError("Failed to load item details");
    }
  };

  return (
    <div
      style={{
        padding: 16,
        display: "flex",
        gap: 16,
        height: "100vh",
        boxSizing: "border-box",
        color: "#fff",
      }}
    >
      {/* 🔴 VERY OBVIOUS RENDER PROOF */}
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          background: "red",
          color: "white",
          padding: "6px 10px",
          fontWeight: 700,
          zIndex: 9999,
        }}
      >
        WeaponsView RENDERED
      </div>

      {/* LEFT PANE */}
      <div style={{ width: 420, display: "flex", flexDirection: "column" }}>
        <h2>Weapons</h2>

        <input
          placeholder="Search weapons"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 6, marginBottom: 8 }}
        />

        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
          {loading ? "Loading…" : `Results: ${total}`}
        </div>

        {error && (
          <div style={{ color: "salmon", marginBottom: 8 }}>{error}</div>
        )}

        <div
          style={{
            flex: 1,
            overflow: "auto",
            border: "1px solid #333",
          }}
        >
          {weapons.map((w) => (
            <div
              key={w.hash}
              onClick={() => openItem(w.hash)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 6,
                cursor: "pointer",
                borderBottom: "1px solid #222",
              }}
            >
              {w.icon && (
                <img
                  src={w.icon}
                  alt=""
                  style={{ width: 40, height: 40 }}
                />
              )}

              <div>
                <div style={{ fontWeight: 600 }}>{w.name}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{w.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANE */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {selected ? (
          <>
            <h2>{selected.displayProperties?.name}</h2>

            {selected.displayProperties?.icon && (
              <img
                src={selected.displayProperties.icon}
                alt=""
                style={{ width: 96 }}
              />
            )}

            <p style={{ maxWidth: 600 }}>
              {selected.displayProperties?.description}
            </p>

            <pre
              style={{
                fontSize: 11,
                background: "#111",
                padding: 8,
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
  );
}

import React, { useEffect, useState, useCallback } from "react";

/* =============================
   CONSTANTS
============================= */
const BUNGIE = "https://www.bungie.net";

const SLOT_ICONS = {
  1498876634: "/img/destiny_content/icons/kinetic.png", // Kinetic
  2465295065: "/img/destiny_content/icons/energy.png",  // Energy
  953998645: "/img/destiny_content/icons/power.png",    // Power
};

/* =============================
   ICON HELPER
============================= */
function Icon({ src, size = 48 }) {
  if (!src) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: "#1f2933",
          borderRadius: 4,
        }}
      />
    );
  }

  const url = src.startsWith("/") ? `${BUNGIE}${src}` : src;

  return (
    <img
      src={url}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      alt=""
    />
  );
}

/* =============================
   PERK GRID
============================= */
function PerkGrid({ item }) {
  if (!item?.sockets?.socketEntries) return null;

  const perks = item.sockets.socketEntries
    .map((s) => s.singleInitialItemHash)
    .filter(Boolean)
    .map((hash) => window.api?.getItemSync?.(hash))
    .filter(Boolean);

  if (!perks.length) return null;

  return (
    <div>
      <h3 style={{ marginBottom: 6 }}>Perks</h3>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {perks.map((p) => (
          <div key={p.hash} title={p.displayProperties?.name}>
            <Icon src={p.displayProperties?.icon} size={40} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============================
   MAIN APP
============================= */
export default function App() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* -------- fetch weapons -------- */
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
        itemType: 3,
      });

      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch {
      setError("Failed to load weapons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeapons("");
  }, [loadWeapons]);

  useEffect(() => {
    const t = setTimeout(() => loadWeapons(query), 250);
    return () => clearTimeout(t);
  }, [query, loadWeapons]);

  const openItem = async (hash) => {
    if (!window.api?.getItem) return;
    const item = await window.api.getItem(hash);
    setSelected(item);
  };

  /* =============================
     RENDER
  ============================= */
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "#e5e7eb" }}>
      {/* =============================
          LEFT — LIST
      ============================= */}
      <div style={{ width: 420, borderRight: "1px solid #1f2933", padding: 12 }}>
        <h2>Weapons</h2>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          style={{
            marginTop: 8,
            padding: 8,
            width: "100%",
            background: "#020617",
            color: "#fff",
            border: "1px solid #334155",
          }}
        />

        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          {loading ? "Loading…" : `${total} results`}
        </div>

        {error && <div style={{ color: "salmon" }}>{error}</div>}

        <div style={{ marginTop: 10, overflow: "auto", height: "85%" }}>
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
          RIGHT — DETAILS
      ============================= */}
      <div style={{ flex: 1, padding: 16, overflow: "auto" }}>
        {selected ? (
          <>
            {/* HEADER */}
            <div style={{ display: "flex", gap: 16 }}>
              <Icon src={selected.displayProperties?.icon} size={96} />

              <div>
                <h2 style={{ fontSize: 26 }}>
                  {selected.displayProperties?.name}
                </h2>

                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <Icon
                    src={SLOT_ICONS[selected.inventory?.bucketTypeHash]}
                    size={28}
                  />
                  <span style={{ opacity: 0.7 }}>
                    {selected.itemTypeDisplayName}
                  </span>
                </div>

                <p style={{ marginTop: 10, maxWidth: 600 }}>
                  {selected.displayProperties?.description}
                </p>
              </div>
            </div>

            {/* PERKS */}
            <div style={{ marginTop: 20 }}>
              <PerkGrid item={selected} />
            </div>

            {/* RAW JSON */}
            <details style={{ marginTop: 20 }}>
              <summary style={{ cursor: "pointer" }}>
                Raw Item JSON
              </summary>
              <pre
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  background: "#020617",
                  padding: 12,
                  maxHeight: 400,
                  overflow: "auto",
                }}
              >
                {JSON.stringify(selected, null, 2)}
              </pre>
            </details>
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

import React, { useEffect, useState, useCallback } from "react";

const BUNGIE_ROOT = "https://www.bungie.net";
const ACCENT_COLOR = "#facc15";

// These are the *socketCategoryHash* values (not socketTypeHash)
const CATEGORY_HASH = {
  BARREL: 3956125808,
  MAGAZINE: 4241085061,
  TRAITS: 2614797986,
  ORIGIN: 3993098925,
};

function Icon({ src, size = 36, selected = false }) {
  if (!src) return <div style={{ width: size + 12, height: size + 12 }} />;
  const url = src.startsWith("/") ? `${BUNGIE_ROOT}${src}` : src;

  return (
    <div
      style={{
        width: size + 12,
        height: size + 12,
        borderRadius: "50%",
        background: "#1e293b",
        border: selected ? `2px solid ${ACCENT_COLOR}` : "1px solid #374151",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <img src={url} width={size} height={size} alt="" style={{ borderRadius: 4 }} />
    </div>
  );
}

function isRealPerk(perk) {
  if (!perk?.displayProperties?.icon) return false;

  const name = (perk.displayProperties?.name || "").toLowerCase();
  const type = (perk.itemTypeDisplayName || "").toLowerCase();
  const cat = perk.plug?.plugCategoryIdentifier || "";

  return !(
    cat.includes("memento") ||
    cat.includes("ornament") ||
    cat.includes("tracker") ||
    cat.includes("masterwork") ||
    cat.includes("mod") ||
    cat.includes("extractor") ||
    name.includes("deepsight") ||
    type.includes("shader")
  );
}

function dedupeByHash(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    if (!p?.hash) continue;
    if (seen.has(p.hash)) continue;
    seen.add(p.hash);
    out.push(p);
  }
  return out;
}

function PerkGrid({ item }) {
  const [hover, setHover] = useState(null);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    let alive = true;

    async function build() {
      if (!item?.sockets?.socketEntries || !window.api?.getSocketType) {
        if (alive) setColumns([]);
        return;
      }

      const next = [];
      let traitIndex = 0;

      for (const socket of item.sockets.socketEntries) {
        // 1) resolve socket type -> socketCategoryHash
        const st = await window.api.getSocketType(socket.socketTypeHash);
        const categoryHash = st?.socketCategoryHash;

        let label = null;

        if (categoryHash === CATEGORY_HASH.BARREL) label = "Barrel";
        else if (categoryHash === CATEGORY_HASH.MAGAZINE) label = "Magazine";
        else if (categoryHash === CATEGORY_HASH.ORIGIN) label = "Origin";
        else if (categoryHash === CATEGORY_HASH.TRAITS) {
          label = traitIndex === 0 ? "Trait 1" : "Trait 2";
          traitIndex++;
        }

        if (!label) continue;

        // 2) gather plug candidates
        let plugHashes = [];

        // socket.reusablePlugItems sometimes empty; still try it
        if (Array.isArray(socket.reusablePlugItems) && socket.reusablePlugItems.length) {
          plugHashes.push(...socket.reusablePlugItems.map((p) => p.plugItemHash));
        }

        // 3) plugSet is usually where the *real perk pool* is
        const plugSetHash = socket.randomizedPlugSetHash || socket.reusablePlugSetHash;
        if (plugSetHash && window.api?.getPlugSet) {
          const plugSet = await window.api.getPlugSet(plugSetHash);
          const plugs =
            plugSet?.randomizedPlugItems ||
            plugSet?.reusablePlugItems ||
            [];

          plugHashes.push(...plugs.map((p) => p.plugItemHash));
        }

        // 4) resolve to item defs and filter
        const perks = dedupeByHash(
          plugHashes
            .map((h) => window.api.getItemSync(h))
            .filter(isRealPerk)
        );

        if (!perks.length) continue;

        next.push({ label, perks });
      }

      if (alive) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColumns(next);
      }
    }

    build();
    return () => {
      alive = false;
    };
  }, [item]);

  if (!columns.length) {
    return <div style={{ opacity: 0.6, marginTop: 20 }}>No perks found</div>;
  }

  return (
    <div style={{ display: "flex", gap: 20, marginTop: 24 }}>
      {columns.map((col) => (
        <div key={col.label} style={{ width: 90 }}>
          <div style={{ textAlign: "center", fontSize: 12, opacity: 0.7 }}>{col.label}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {col.perks.map((perk) => (
              <div
                key={perk.hash}
                onMouseEnter={() => setHover(perk)}
                onMouseLeave={() => setHover(null)}
              >
                <Icon src={perk.displayProperties?.icon} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {hover && (
        <div
          style={{
            marginLeft: 20,
            padding: 12,
            width: 300,
            background: "#020617",
            border: "1px solid #1f2933",
            borderRadius: 8,
          }}
        >
          <h4 style={{ margin: 0 }}>{hover.displayProperties?.name}</h4>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
            {hover.displayProperties?.description}
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [weapons, setWeapons] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadWeapons = useCallback(async (q) => {
    const res = await window.api.getWeapons({ limit: 200, q, itemType: 3 });
    setWeapons(res.items || []);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadWeapons(query), 250);
    return () => clearTimeout(timer);
  }, [query, loadWeapons]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b1524", color: "#e5e7eb" }}>
      <div style={{ width: 360, borderRight: "1px solid #1f2937", padding: 16, overflow: "hidden" }}>
        <h2 style={{ margin: 0, fontSize: 20, color: "#f9fafb" }}>Weapons</h2>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          style={{
            marginTop: 12,
            padding: "8px 10px",
            width: "100%",
            borderRadius: 6,
            border: "1px solid #374151",
            background: "#1e293b",
            color: "#f1f5f9",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        <div style={{ marginTop: 12, overflowY: "auto", height: "calc(100% - 72px)" }}>
          {weapons.map((w) => (
            <div
              key={w.hash}
              onClick={async () => setSelected(await window.api.getItem(w.hash))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px",
                borderRadius: 6,
                cursor: "pointer",
                marginBottom: 4,
                background: selected?.hash === w.hash ? "#1e293b" : "transparent",
                border: selected?.hash === w.hash ? `1px solid ${ACCENT_COLOR}` : "1px solid transparent",
              }}
            >
              <Icon src={w.icon} size={32} selected={selected?.hash === w.hash} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f9fafb", lineHeight: 1.2 }}>
                  {w.name}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{w.itemTypeDisplayName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        {selected ? (
          <>
            <h2 style={{ marginTop: 0, fontSize: 22, fontWeight: 600, color: "#f9fafb" }}>
              {selected.displayProperties?.name}
            </h2>
            <PerkGrid item={selected} />
          </>
        ) : (
          <div style={{ opacity: 0.5, color: "#94a3b8", padding: 20, fontSize: 14 }}>
            Select a weapon
          </div>
        )}
      </div>
    </div>
  );
}

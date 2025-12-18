import React, { useEffect, useState, useCallback, useMemo } from "react";

const BUNGIE = "https://www.bungie.net";

// Icon helper
function Icon({ src, size = 40, selected = false }) {
  if (!src) return <div style={{ width: size, height: size }} />;
  const url = src.startsWith("/") ? `${BUNGIE}${src}` : src;
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt=""
      style={{
        borderRadius: 6,
        border: selected ? "2px solid #facc15" : "1px solid #1f2933",
        boxShadow: selected ? "0 0 10px rgba(250,204,21,.7)" : "none",
      }}
    />
  );
}

// Perk filter – remove curated or cosmetic plugs
function isRealPerk(perk) {
  if (!perk?.displayProperties?.icon) return false;
  const name = (perk.displayProperties.name || "").toLowerCase();
  const type = (perk.itemTypeDisplayName || "").toLowerCase();
  const cat  = perk.plug?.plugCategoryIdentifier || "";
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

// Socket category hashes – D2 Foundry reference
const SOCKET_CATEGORY = {
  BARREL:   3956125808,
  MAGAZINE: 4241085061,
  TRAITS:   2614797986,
  ORIGIN:   3993098925,
};

// PerkGrid component: shows barrels, magazines, traits, origin
function PerkGrid({ item }) {
  const [hover, setHover] = useState(null);

  // Build columns from sockets
  const columns = useMemo(() => {
    if (!item?.sockets?.socketEntries) return null;

    // Setup columns (trait columns will be split dynamically)
    const cols = {
      Barrel: [],
      Magazine: [],
      "Trait 1": [],
      "Trait 2": [],
      Origin: [],
    };
    let traitCounter = 1;

    for (const socket of item.sockets.socketEntries) {
      if (!socket.socketCategoryHashes) continue;

      let col = null;
      if (socket.socketCategoryHashes.includes(SOCKET_CATEGORY.BARREL))
        col = "Barrel";
      else if (socket.socketCategoryHashes.includes(SOCKET_CATEGORY.MAGAZINE))
        col = "Magazine";
      else if (socket.socketCategoryHashes.includes(SOCKET_CATEGORY.ORIGIN))
        col = "Origin";
      else if (socket.socketCategoryHashes.includes(SOCKET_CATEGORY.TRAITS)) {
        col = traitCounter === 1 ? "Trait 1" : "Trait 2";
        traitCounter++;
      }
      if (!col) continue;

      // Use randomizedPlugSetHash first for rollable perks
      const plugSetHash = socket.randomizedPlugSetHash || socket.reusablePlugSetHash;
      if (!plugSetHash) continue;

      const plugSet = window.api.getPlugSet(plugSetHash);
      const plugs   = plugSet?.randomizedPlugItems || plugSet?.reusablePlugItems || [];
      for (const p of plugs) {
        const perk = window.api.getItemSync(p.plugItemHash);
        if (isRealPerk(perk)) cols[col].push(perk);
      }
    }

    // Deduplicate within each column
    for (const key in cols) {
      const seen = new Set();
      cols[key] = cols[key].filter(perk => {
        if (seen.has(perk.hash)) return false;
        seen.add(perk.hash);
        return true;
      });
    }

    return cols;
  }, [item]);

  if (!columns || !Object.values(columns).some(v => v.length)) {
    return <div style={{ opacity: 0.6, marginTop: 20 }}>No perks found</div>;
  }

  return (
    <div style={{ display: "flex", gap: 20, marginTop: 24 }}>
      {Object.entries(columns).map(([label, perks]) => (
        <div key={label} style={{ width: 90 }}>
          <div style={{ textAlign: "center", fontSize: 12, opacity: 0.7 }}>
            {label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {perks.map(perk => (
              <div
                key={perk.hash}
                onMouseEnter={() => setHover(perk)}
                onMouseLeave={() => setHover(null)}
              >
                <Icon src={perk.displayProperties.icon} />
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
            width: 260,
            background: "#020617",
            border: "1px solid #1f2933",
            borderRadius: 8,
          }}
        >
          <h4>{hover.displayProperties.name}</h4>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            {hover.displayProperties.description}
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

  // Load weapon index
  const loadWeapons = useCallback(async (q) => {
    const res = await window.api.getWeapons({
      limit: 200,
      q,
      itemType: 3, // weapons
    });
    setWeapons(res.items || []);
  }, []);

  // Search weapons (debounced)
  useEffect(() => {
    const timer = setTimeout(() => loadWeapons(query), 250);
    return () => clearTimeout(timer);
  }, [query, loadWeapons]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
      }}
    >
      {/* Weapon list */}
      <div
        style={{ width: 420, borderRight: "1px solid #1f2933", padding: 12 }}
      >
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
        <div
          style={{
            marginTop: 10,
            overflowY: "auto",
            height: "85%",
          }}
        >
          {weapons.map((w) => (
            <div
              key={w.hash}
              onClick={async () =>
                setSelected(await window.api.getItem(w.hash))
              }
              style={{
                display: "flex",
                gap: 10,
                padding: 8,
                cursor: "pointer",
                borderBottom: "1px solid #1f2933",
              }}
            >
              <Icon src={w.icon} />
              <div>
                <div style={{ fontWeight: 600 }}>{w.name}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  {w.itemTypeDisplayName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected weapon details */}
      <div style={{ flex: 1, padding: 16 }}>
        {selected ? (
          <>
            <h2>{selected.displayProperties.name}</h2>
            <PerkGrid item={selected} />
          </>
        ) : (
          <div style={{ opacity: 0.6 }}>Select a weapon</div>
        )}
      </div>
    </div>
  );
}

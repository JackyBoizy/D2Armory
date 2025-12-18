import React, { useEffect, useState, useCallback, useMemo } from "react";

const BUNGIE = "https://www.bungie.net";

/* =============================
   ICON
============================= */
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

/* =============================
   PERK FILTER (D2 Foundry accurate)
============================= */
function isRealPerk(perk) {
  if (!perk?.displayProperties?.icon) return false;

  const name = perk.displayProperties.name.toLowerCase();
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

/* =============================
   SOCKET CATEGORY HASHES
   (THIS IS THE KEY FIX)
============================= */
const SOCKET_CATEGORY = {
  BARREL: 3956125808,
  MAGAZINE: 4241085061,
  TRAITS: 2614797986,
  ORIGIN: 3993098925,
};

/* =============================
   PERK GRID (D2 Foundry logic)
============================= */
function PerkGrid({ item }) {
  const [selected, setSelected] = useState({});
  const [hover, setHover] = useState(null);

  const columns = useMemo(() => {
    if (!item?.sockets?.socketEntries) return null;

    const result = {
      Barrel: [],
      Magazine: [],
      "Trait 1": [],
      "Trait 2": [],
      Origin: [],
    };

    let traitColumn = 1;

    for (const socket of item.sockets.socketEntries) {
      if (!socket.socketCategoryHashes) continue;

      let column = null;

      if (socket.socketCategoryHashes.includes(SOCKET_CATEGORY.BARREL))
        column = "Barrel";
      else if (socket.socketCategoryHashes.includes(SOCKET_CATEGORY.MAGAZINE))
        column = "Magazine";
      else if (socket.socketCategoryHashes.includes(SOCKET_CATEGORY.ORIGIN))
        column = "Origin";
      else if (socket.socketCategoryHashes.includes(SOCKET_CATEGORY.TRAITS)) {
        column = traitColumn === 1 ? "Trait 1" : "Trait 2";
        traitColumn++;
      }

      if (!column) continue;

      const plugSetHash =
        socket.randomizedPlugSetHash || socket.reusablePlugSetHash;

      if (!plugSetHash) continue;

      const plugSet = window.api.getPlugSet
        ? window.api.getPlugSet(plugSetHash)
        : null;

      const plugs =
        plugSet?.randomizedPlugItems ||
        plugSet?.reusablePlugItems ||
        [];

      for (const plug of plugs) {
        const perk = window.api.getItemSync(plug.plugItemHash);
        if (!isRealPerk(perk)) continue;
        result[column].push(perk);
      }
    }

    // Deduplicate
    for (const key in result) {
      const seen = new Set();
      result[key] = result[key].filter(p => {
        if (seen.has(p.hash)) return false;
        seen.add(p.hash);
        return true;
      });
    }

    return result;
  }, [item]);

  if (!columns || !Object.values(columns).some(c => c.length)) {
    return <div style={{ opacity: 0.6, marginTop: 20 }}>No perks found</div>;
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", gap: 20 }}>
        {Object.entries(columns).map(([label, perks]) => (
          <div key={label} style={{ width: 90 }}>
            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                opacity: 0.7,
                marginBottom: 8,
              }}
            >
              {label}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {perks.map(perk => {
                const isSel = selected[label] === perk.hash;
                return (
                  <div
                    key={perk.hash}
                    onMouseEnter={() => setHover(perk)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() =>
                      setSelected(prev => ({ ...prev, [label]: perk.hash }))
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <Icon
                      src={perk.displayProperties.icon}
                      selected={isSel}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {hover && (
          <div
            style={{
              marginLeft: 20,
              padding: 12,
              background: "#020617",
              border: "1px solid #1f2933",
              borderRadius: 8,
              width: 260,
            }}
          >
            <h4>{hover.displayProperties.name}</h4>
            <p style={{ fontSize: 13, opacity: 0.8 }}>
              {hover.displayProperties.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* =============================
   MAIN APP
============================= */
export default function App() {
  const [query, setQuery] = useState("");
  const [weapons, setWeapons] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadWeapons = useCallback(async q => {
    const res = await window.api.getWeapons({
      limit: 200,
      q,
      itemType: 3,
    });
    setWeapons(res.items || []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadWeapons(query), 250);
    return () => clearTimeout(t);
  }, [query, loadWeapons]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "#e5e7eb" }}>
      {/* LEFT */}
      <div style={{ width: 420, borderRight: "1px solid #1f2933", padding: 12 }}>
        <h2>Weapons</h2>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
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

        <div style={{ marginTop: 10, overflowY: "auto", height: "85%" }}>
          {weapons.map(w => (
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

      {/* RIGHT */}
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

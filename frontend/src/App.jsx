import React, { useEffect, useState, useCallback } from "react";

// A small utility to prefix Bungie-hosted icons with the root domain.  Many of
// the Destiny definitions expose icon paths that begin with a slash.  When
// building URLs for images we need to attach them to the host; otherwise the
// browser will treat them as relative paths.  See the D2 Foundry weapon pages
// for examples of properly constructed icon URLs【431942982955006†L88-L109】.
const BUNGIE_ROOT = "https://www.bungie.net";

// Accent colour used throughout the UI to highlight selected items.  D2
// Foundry uses a number of highlight colours for perks and elements; we've
// chosen a warm yellow inspired by their perk outlines【431942982955006†L88-L109】.
const ACCENT_COLOR = "#facc15";

/**
 * Icon
 *
 * Displays a small circular button that wraps a Destiny perk or weapon icon.
 * The underlying image is padded inside a coloured circle, which better
 * resembles the perk buttons on D2 Foundry's weapon pages.  When the
 * `selected` flag is true the button's border is tinted with the accent
 * colour.  Missing icons are rendered as an empty space to preserve
 * alignment.
 */
function Icon({ src, size = 36, selected = false }) {
  // If we don't have a source just render an empty placeholder.  The
  // placeholder dimensions account for the circular wrapper around the
  // underlying image.
  if (!src) return <div style={{ width: size + 12, height: size + 12 }} />;

  // Build a complete URL for Bungie-hosted assets.  Some definitions begin
  // their icon paths with a slash.
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
        transition: "border-color 0.15s",
      }}
    >
      <img
        src={url}
        width={size}
        height={size}
        alt=""
        style={{ borderRadius: 4 }}
      />
    </div>
  );
}

/**
 * isRealPerk
 *
 * Filters out plugs that are ornamental, cosmetic or otherwise not relevant
 * for perk selection.  This helper is unchanged from the original code and
 * continues to filter deepsight, shader, memento and similar categories.  It
 * avoids listing cosmetic sockets in the perk grid.
 */
function isRealPerk(perk) {
  if (!perk?.displayProperties?.icon) return false;
  const name = (perk.displayProperties.name || "").toLowerCase();
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

// Known socketTypeHashes for various perk columns.  These values are
// identical to the ones used in the original implementation and refer to
// barrels, magazines, trait columns and the origin trait respectively.  See
// the curated perk columns on D2 Foundry for examples of how these columns
// are grouped【431942982955006†L88-L109】.
const SOCKET_CATEGORY = {
  BARREL: 1282012138,
  MAGAZINE: 1282012139,
  TRAITS: 1282012140,
  ORIGIN: 3993098925,
};

/**
 * PerkGrid
 *
 * Renders a series of columns containing the weapon's available perks.  Each
 * column groups perks by socket type (barrel, magazine, trait 1, trait 2
 * and origin).  When a perk is hovered a description panel appears on the
 * right-hand side, similar to the "Effects" panel on D2 Foundry's weapon
 * pages【431942982955006†L88-L109】.
 */
function PerkGrid({ item }) {
  const [hovered, setHovered] = useState(null);

  if (!item?.sockets?.socketEntries) {
    return <div style={{ opacity: 0.6 }}>No sockets</div>;
  }

  // Build columns for each category.  We explicitly name our trait
  // columns rather than relying on Destiny's enumerations so that the UI
  // remains consistent.
  const columns = {
    Barrel: [],
    Magazine: [],
    "Trait 1": [],
    "Trait 2": [],
    Origin: [],
  };

  let traitIndex = 0;
  for (const socket of item.sockets.socketEntries) {
    let columnName = null;
    switch (socket.socketTypeHash) {
      case SOCKET_CATEGORY.BARREL:
        columnName = "Barrel";
        break;
      case SOCKET_CATEGORY.MAGAZINE:
        columnName = "Magazine";
        break;
      case SOCKET_CATEGORY.TRAITS:
        // There are two trait columns; increment an index to distinguish them.
        columnName = traitIndex++ === 0 ? "Trait 1" : "Trait 2";
        break;
      case SOCKET_CATEGORY.ORIGIN:
        columnName = "Origin";
        break;
      default:
        continue;
    }

    if (!socket.reusablePlugItems?.length) continue;
    for (const plug of socket.reusablePlugItems) {
      const perk = window.api.getItemSync(plug.plugItemHash);
      if (!isRealPerk(perk)) continue;
      columns[columnName].push(perk);
    }
  }

  // If no perks were found display a simple message.
  if (!Object.values(columns).some((perks) => perks.length)) {
    return <div style={{ opacity: 0.6 }}>No perks found</div>;
  }

  return (
    <div style={{ display: "flex", gap: 32, marginTop: 32 }}>
      {Object.entries(columns).map(([label, perks]) => (
        <div
          key={label}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#94a3b8",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {perks.map((perk) => (
              <div
                key={perk.hash}
                onMouseEnter={() => setHovered(perk)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <Icon
                  src={perk.displayProperties.icon}
                  size={32}
                  selected={hovered?.hash === perk.hash}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {/* Detail panel */}
      {hovered && (
        <div
          style={{
            marginLeft: 32,
            padding: 16,
            width: 260,
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 8,
            color: "#e5e7eb",
          }}
        >
          <h4 style={{ margin: 0, color: "#f9fafb" }}>{hovered.displayProperties.name}</h4>
          {hovered.displayProperties.description && (
            <p
              style={{
                fontSize: 13,
                marginTop: 6,
                lineHeight: 1.4,
                color: "#cbd5e1",
              }}
            >
              {hovered.displayProperties.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * App
 *
 * Main component that presents a searchable list of weapons on the left and
 * renders the perk grid for the selected weapon on the right.  The layout
 * draws inspiration from D2 Foundry: a dark, two‑pane interface with
 * highlighted selections and context panels for detailed information【431942982955006†L88-L109】.
 */
export default function App() {
  const [query, setQuery] = useState("");
  const [weapons, setWeapons] = useState([]);
  const [selected, setSelected] = useState(null);

  // Fetch a list of weapons matching the query.  This callback is debounced
  // via a timeout in the effect below.  It mirrors the original logic for
  // loading up to 200 weapons at a time.
  const loadWeapons = useCallback(async (q) => {
    const res = await window.api.getWeapons({
      limit: 200,
      q,
      itemType: 3, // weapons
    });
    setWeapons(res.items || []);
  }, []);

  // Update the weapon list when the query changes.  Debounce the calls so
  // that we don't flood the API while the user is typing.
  useEffect(() => {
    const timer = setTimeout(() => loadWeapons(query), 250);
    return () => clearTimeout(timer);
  }, [query, loadWeapons]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0b1524",
        color: "#e5e7eb",
        fontFamily: "sans-serif",
      }}
    >
      {/* Weapon list panel */}
      <div
        style={{
          width: 360,
          borderRight: "1px solid #1f2937",
          padding: 16,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, color: "#f9fafb" }}>Weapons</h2>
        <input
          type="text"
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
        <div
          style={{
            marginTop: 12,
            overflowY: "auto",
            height: "calc(100% - 72px)",
          }}
        >
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
                background:
                  selected?.hash === w.hash ? "#1e293b" : "transparent",
                border:
                  selected?.hash === w.hash
                    ? `1px solid ${ACCENT_COLOR}`
                    : "1px solid transparent",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <Icon
                src={w.icon}
                size={32}
                selected={selected?.hash === w.hash}
              />
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#f9fafb",
                    lineHeight: 1.2,
                  }}
                >
                  {w.name}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {w.itemTypeDisplayName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail pane */}
      <div
        style={{
          flex: 1,
          padding: 24,
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        {selected ? (
          <>
            <h2
              style={{
                marginTop: 0,
                fontSize: 22,
                fontWeight: 600,
                color: "#f9fafb",
              }}
            >
              {selected.displayProperties.name}
            </h2>
            <PerkGrid item={selected} />
          </>
        ) : (
          <div
            style={{
              opacity: 0.5,
              color: "#94a3b8",
              padding: 20,
              fontSize: 14,
            }}
          >
            Select a weapon
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState, useCallback } from 'react';

const BUNGIE = 'https://www.bungie.net';
const SLOT_ICONS = {
  1498876634: '/img/destiny_content/icons/kinetic.png',
  2465295065: '/img/destiny_content/icons/energy.png',
  953998645: '/img/destiny_content/icons/power.png',
};

// Filter helper – excludes mementos, mods, trackers, ornaments, masterworks, deepsight, shaders
function isValidPerk(perk) {
  if (!perk?.displayProperties?.icon) return false;
  const name = (perk.displayProperties?.name || '').toLowerCase();
  const typeName = (perk.itemTypeDisplayName || '').toLowerCase();
  const plugCat = perk.plug?.plugCategoryIdentifier || '';
  return !(
    plugCat.includes('memento') ||
    plugCat.includes('extractor') ||
    plugCat.includes('mod') ||
    plugCat.includes('tracker') ||
    plugCat.includes('ornament') ||
    plugCat.includes('masterwork') ||
    name.includes('deepsight') ||
    typeName.includes('shader') ||
    typeName.includes('ornament') ||
    name.includes('ornament')
  );
}

function Icon({ src, size = 40, selected = false }) {
  if (!src) return <div style={{ width: size, height: size }} />;
  const url = src.startsWith('/') ? `${BUNGIE}${src}` : src;
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt=""
      style={{
        borderRadius: 4,
        border: selected ? '2px solid #facc15' : '1px solid #1f2933',
        boxShadow: selected ? '0 0 8px rgba(250,204,21,.8)' : 'none',
      }}
    />
  );
}

function PerkColumns({ item }) {
  const [columns, setColumns] = useState([]);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function buildColumns() {
      if (!item?.sockets?.socketEntries || !window.api?.getPlugSet) return;
      const cols = [];
      for (let idx = 0; idx < item.sockets.socketEntries.length; idx++) {
        const socket = item.sockets.socketEntries[idx];
        const plugSetHash =
          socket.randomizedPlugSetHash || socket.reusablePlugSetHash;
        let perks = [];

        if (plugSetHash) {
          const plugSet = await window.api.getPlugSet(plugSetHash);
          if (plugSet?.reusablePlugItems) {
            perks = plugSet.reusablePlugItems
              .map((p) => window.api.getItemSync(p.plugItemHash))
              .filter(isValidPerk);
          }
        }

        // fallback to reusablePlugItems if no plug set
        if (!perks.length && Array.isArray(socket.reusablePlugItems)) {
          perks = await Promise.all(
            socket.reusablePlugItems.map(async (p) => {
              const perk = await window.api.getItem(p.plugItemHash);
              return isValidPerk(perk) ? perk : null;
            })
          ).then((arr) => arr.filter(Boolean));
        }

        // fallback to single initial item if still empty
        if (!perks.length && socket.singleInitialItemHash) {
          const perk = window.api.getItemSync(socket.singleInitialItemHash);
          if (isValidPerk(perk)) perks = [perk];
        }

        // deduplicate by hash
        const seen = new Set();
        perks = perks.filter((perk) => {
          if (seen.has(perk.hash)) return false;
          seen.add(perk.hash);
          return true;
        });

        if (perks.length) {
          cols.push({
            socketIndex: idx,
            perks,
          });
        }
      }
      if (!cancelled) {
        setColumns(cols);
        setSelected({});
      }
    }
    buildColumns();
    return () => {
      cancelled = true;
    };
  }, [item]);

  if (!columns.length) return null;

  const labels = ['Barrel', 'Magazine', 'Trait 1', 'Trait 2', 'Origin'];

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Perks</h3>
      <div style={{ display: 'flex', gap: 16 }}>
        {columns.map((col, index) => (
          <div key={col.socketIndex}>
            <div
              style={{
                fontSize: 12,
                opacity: 0.6,
                textAlign: 'center',
              }}
            >
              {labels[index] || `Slot ${index + 1}`}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {col.perks.map((perk) => {
                const isSel = selected[col.socketIndex] === perk.hash;
                return (
                  <div
                    key={perk.hash}
                    title={`${perk.displayProperties?.name}\n\n${perk.displayProperties?.description || ''}`}
                    onClick={() =>
                      setSelected((prev) => ({
                        ...prev,
                        [col.socketIndex]: perk.hash,
                      }))
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon
                      src={perk.displayProperties?.icon}
                      selected={isSel}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [weapons, setWeapons] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadWeapons = useCallback(async (q = '') => {
    if (!window.api?.getWeapons) {
      setError('window.api.getWeapons not available');
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
      setWeapons(res.items || []);
    } catch {
      setError('Failed to load weapons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadWeapons(query), 250);
    return () => clearTimeout(t);
  }, [query, loadWeapons]);

  const handleSelect = async (hash) => {
    if (!window.api?.getItem) return;
    const item = await window.api.getItem(hash);
    setSelected(item);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#0f172a',
        color: '#e5e7eb',
      }}
    >
      <div
        style={{
          width: 420,
          padding: 12,
          borderRight: '1px solid #1f2933',
        }}
      >
        <h2>Weapons</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          style={{
            marginTop: 8,
            padding: 8,
            width: '100%',
            background: '#020617',
            color: '#fff',
            border: '1px solid #334155',
          }}
        />
        {loading && (
          <div
            style={{
              marginTop: 6,
            }}
          >
            Loading…
          </div>
        )}
        {error && (
          <div
            style={{
              marginTop: 6,
              color: 'salmon',
            }}
          >
            {error}
          </div>
        )}
        <div
          style={{
            marginTop: 10,
            overflowY: 'auto',
            height: '85%',
          }}
        >
          {weapons.map((w) => (
            <div
              key={w.hash}
              onClick={() => handleSelect(w.hash)}
              style={{
                display: 'flex',
                gap: 10,
                padding: 8,
                cursor: 'pointer',
                borderBottom: '1px solid #1f2933',
              }}
            >
              <Icon src={w.displayProperties?.icon} size={40} />
              <div>
                <div style={{ fontWeight: 600 }}>
                  {w.displayProperties?.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.6,
                  }}
                >
                  {w.itemTypeDisplayName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
        }}
      >
        {selected ? (
          <>
            <div
              style={{
                display: 'flex',
                gap: 16,
              }}
            >
              <Icon
                src={selected.displayProperties?.icon}
                size={96}
              />
              <div>
                <h2>
                  {selected.displayProperties?.name}
                </h2>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <Icon
                    src={
                      SLOT_ICONS[
                        selected.inventory?.bucketTypeHash
                      ] || null
                    }
                    size={28}
                  />
                  <span
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    {selected.itemTypeDisplayName}
                  </span>
                </div>
                <p
                  style={{
                    marginTop: 10,
                    maxWidth: 600,
                  }}
                >
                  {
                    selected.displayProperties?.description
                  }
                </p>
              </div>
            </div>
            <PerkColumns item={selected} />
          </>
        ) : (
          <div
            style={{
              opacity: 0.6,
            }}
          >
            Select a weapon to view details
          </div>
        )}
      </div>
    </div>
  );
}

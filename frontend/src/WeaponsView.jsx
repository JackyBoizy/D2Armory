// frontend/src/WeaponsView.jsx
import React, { useEffect, useState } from 'react';

export default function WeaponsView() {
  const [weapons, setWeapons] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await window.api.getWeapons({ limit: 200, q, itemType: 3 });
        if (!mounted) return;
        setWeapons(res.items || []);
        setTotal(res.total || 0);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false; };
  }, [q]);

  const openItem = async (hash) => {
    const item = await window.api.getItem(hash);
    setSelected(item);
  };

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ width: 420 }}>
        <div style={{ marginBottom: 8 }}>
          <input placeholder="Search weapons" value={q} onChange={e => setQ(e.target.value)} />
          <div>Results: {total}</div>
        </div>

        <div style={{ maxHeight: '75vh', overflow: 'auto' }}>
          {weapons.map(w => (
            <div key={w.hash} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, cursor: 'pointer' }} onClick={() => openItem(w.hash)}>
              <img src={w.icon} alt="" style={{ width: 44, height: 44, objectFit: 'contain' }} />
              <div>
                <div style={{ fontWeight: 600 }}>{w.name}</div>
                <div style={{ fontSize: 12 }}>{w.itemTypeDisplayName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {selected ? (
          <div>
            <h2>{selected.displayProperties?.name}</h2>
            <img src={selected.displayProperties?.icon} alt="" />
            <p>{selected.displayProperties?.description}</p>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflow: 'auto' }}>
              {JSON.stringify(selected, null, 2)}
            </pre>
          </div>
        ) : (
          <div>Select a weapon to view details</div>
        )}
      </div>
    </div>
  );
}

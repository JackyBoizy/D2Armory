// frontend/src/App.jsx
// LocalD2Foundry React UI (single-file starter)
// Drop this file into frontend/src/App.jsx (replace existing App.jsx)
// Requires TailwindCSS configured in your Vite React project.

import React, { useEffect, useState, useMemo } from 'react';

// ------ Utility: debounce ------
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// ------ Small UI pieces in one file ------
function Icon({ src, alt, className = '' }) {
  if (!src) return <div className={`bg-gray-800 ${className}`} />;
  const url = src.startsWith('/') ? `https://www.bungie.net${src}` : src;
  return <img src={url} alt={alt} className={className} />;
}

function Sidebar({ itemType, setItemType, onRefresh }) {
  return (
    <aside className="w-64 p-4 border-r border-slate-700 bg-slate-900 text-slate-200 flex flex-col gap-4">
      <div className="text-xl font-semibold">D2 Foundry — Local</div>
      <div className="mt-2 text-sm text-slate-400">Browse the local Destiny manifest.</div>

      <div className="mt-4">
        <div className="text-xs text-slate-400 mb-1">Category</div>
        <select
          value={itemType}
          onChange={(e) => setItemType(Number(e.target.value))}
          className="w-full bg-slate-800 text-slate-200 p-2 rounded"
        >
          <option value={3}>Weapons</option>
          <option value={2}>Armor</option>
          <option value={0}>General</option>
        </select>
      </div>

      <div className="mt-auto flex gap-2">
        <button onClick={onRefresh} className="flex-1 p-2 rounded bg-emerald-600 hover:bg-emerald-500">Re-index</button>
        <button onClick={() => window.location.reload()} className="p-2 rounded bg-slate-700">Reload</button>
      </div>
    </aside>
  );
}

function ItemCard({ item, onOpen }) {
  return (
    <div
      className="bg-slate-800 rounded-md overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
      onClick={() => onOpen(item.hash)}
    >
      <div className="flex gap-3 p-3 items-center">
        <div className="w-14 h-14 flex-shrink-0">
          <Icon src={item.icon} alt={item.name} className="w-14 h-14 object-contain" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-100">{item.name}</div>
          <div className="text-xs text-slate-400">{item.itemTypeDisplayName}</div>
        </div>
        <div className="text-sm text-slate-300">{''}</div>
      </div>
      <div className="px-3 pb-3 text-xs text-slate-400">Hash: {item.hash}</div>
    </div>
  );
}

function ItemGrid({ items, onOpen }) {
  if (!items) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((it) => (
        <ItemCard key={it.hash} item={it} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ItemDetail({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="p-4 bg-slate-900 text-slate-100 h-full overflow-auto">
      <div className="flex items-start gap-4">
        <div className="w-28 h-28">
          <Icon src={item.displayProperties?.icon} alt={item.displayProperties?.name} className="w-28 h-28 object-contain" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{item.displayProperties?.name}</h2>
          <div className="text-sm text-slate-400">{item.itemTypeDisplayName}</div>
          <p className="mt-2 text-slate-300">{item.displayProperties?.description}</p>
        </div>
      </div>

      <hr className="my-4 border-slate-700" />

      <div className="text-sm text-slate-200">Sockets / Perks (raw JSON preview)</div>
      <pre className="mt-2 text-xs bg-slate-800 p-3 rounded text-slate-200 overflow-auto max-h-64">
        {JSON.stringify(item.sockets || item, null, 2)}
      </pre>

      <div className="mt-4">
        <button onClick={onClose} className="px-3 py-2 rounded bg-rose-600">Close</button>
      </div>
    </div>
  );
}

// ------ App Component ------
export default function App() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [itemType, setItemType] = useState(3);
  const [loading, setLoading] = useState(false);

  const fetchItems = async (query = q, type = itemType) => {
    setLoading(true);
    try {
      const res = await window.api.getWeapons({ limit: 200, q: query, itemType: type });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // debounced search
  const debouncedFetch = useMemo(() => debounce((val, t) => fetchItems(val, t), 250), []);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType]);

  useEffect(() => {
    debouncedFetch(q, itemType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const openItem = async (hash) => {
    const full = await window.api.getItem(hash);
    setSelected(full);
  };

  return (
    <div className="h-screen flex bg-slate-900 text-slate-100">
      <Sidebar itemType={itemType} setItemType={setItemType} onRefresh={() => fetchItems(q, itemType)} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Local D2 Foundry</h1>
            <div className="text-sm text-slate-400">{loading ? 'Loading…' : `${total} results`}</div>
          </div>

          <div className="flex items-center gap-2">
            <input
              className="p-2 bg-slate-800 rounded text-slate-200"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <ItemGrid items={items} onOpen={openItem} />
      </main>

      <div className="w-96 border-l border-slate-700">
        {selected ? (
          <ItemDetail item={selected} onClose={() => setSelected(null)} />
        ) : (
          <div className="p-6 text-slate-400">Select an item to view details</div>
        )}
      </div>
    </div>
  );
}

/*
=== Tailwind Setup (if you haven't already) ===

1) Install Tailwind + deps (run in frontend folder):
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p

2) In tailwind.config.cjs set content paths:
   module.exports = {
     content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
     theme: { extend: {} },
     plugins: [],
   }

3) In src/index.css (or main css) add:
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

4) Import the css in src/main.jsx or src/main.tsx:
   import './index.css';

5) Start dev server (from project root):
   npm run dev


=== Notes ===
- This starter expects `window.api.getWeapons` and `window.api.getItem` to be exposed via your Electron preload (as we discussed).
- Images from the manifest are fetched from Bungie CDN; if you need fully offline icons, we can add a local caching step.
- We kept the design dark and compact; tweak Tailwind classes to taste.
*/
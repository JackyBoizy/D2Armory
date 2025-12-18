import React, { useEffect, useState, useMemo, useCallback } from "react";

// Small debounce utility
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export default function App() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [itemType, setItemType] = useState(3);
  const [loading, setLoading] = useState(false);

  // ✅ Wrap fetchItems in useCallback so the reference is stable
  const fetchItems = useCallback(async (query = q, type = itemType) => {
    setLoading(true);
    try {
      if (window.api?.getWeapons) {
        const res = await window.api.getWeapons({
          limit: 200,
          q: query,
          itemType: type,
        });
        setItems(res.items || []);
        setTotal(res.total || 0);
      } else if (typeof window.fetch === "function") {
        const resp = await fetch(
          `/api/weapons?q=${encodeURIComponent(query)}&itemType=${type}`
        );
        if (resp.ok) {
          const data = await resp.json();
          setItems(data.items || []);
          setTotal(data.total || 0);
        } else {
          setItems([]);
          setTotal(0);
        }
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (e) {
      console.error("fetchItems error", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, itemType]); // include state dependencies if you want latest values

  // ✅ Memoized debounced function
  const debouncedFetch = useMemo(
    () => debounce(fetchItems, 250),
    [fetchItems]
  );

  // Fetch items when itemType changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems, itemType]);

  // Fetch items when query changes (debounced)
  useEffect(() => {
    debouncedFetch(q, itemType);
  }, [q, itemType, debouncedFetch]);

  // Rest of your component remains unchanged...


  const openItem = async (hash) => {
    if (window.api?.getItem) {
      const full = await window.api.getItem(hash);
      setSelected(full);
    } else {
      setSelected(null);
    }
  };

  return (
    <>
      {/* 🔴 HARD PROOF RENDER */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 9999,
          background: "red",
          color: "white",
          padding: "10px",
          fontSize: "18px",
        }}
      >
        APP RENDERED ✅
      </div>

      <div className="h-screen flex bg-slate-900 text-slate-100">
        <Sidebar
          itemType={itemType}
          setItemType={setItemType}
          onReindex={() => fetchItems(q, itemType)}
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Local D2 Foundry</h1>
              <div className="text-sm text-slate-400">
                {loading ? "Loading…" : `${total} results`}
              </div>
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
            <div className="p-6 text-slate-400">
              Select an item to view details
            </div>
          )}
        </div>
      </div>
    </>
  );
}

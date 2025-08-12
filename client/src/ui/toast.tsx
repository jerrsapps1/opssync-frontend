import React from "react";
let push: ((t: {title: string; body?: string}) => void) | null = null;

export function ToastProvider() {
  const [items, setItems] = React.useState<{id:number;title:string;body?:string}[]>([]);

  React.useEffect(() => {
    push = (t) => {
      const id = Date.now();
      setItems((prev) => [...prev, { id, title: t.title, body: t.body }]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 3500);
    };
    return () => { push = null; };
  }, []);

  return (
    <div className="fixed z-[10000] right-4 bottom-4 space-y-2">
      {items.map(i => (
        <div key={i.id} className="rounded-[var(--brand-radius)] border border-gray-800 bg-[#0b1220] text-gray-100 shadow-xl p-3 w-[280px]">
          <div className="text-sm font-medium">{i.title}</div>
          {i.body && <div className="text-xs text-gray-300 mt-1">{i.body}</div>}
        </div>
      ))}
    </div>
  );
}

export function toast(title: string, body?: string) {
  if (push) push({ title, body });
}

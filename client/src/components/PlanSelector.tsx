import React from "react";

export default function PlanSelector({
  value,
  onChange
}: {
  value: "single" | "five" | "ten";
  onChange: (v: "single" | "five" | "ten") => void;
}) {
  const plans: ("single" | "five" | "ten")[] = ["single", "five", "ten"];
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
      {plans.map((p) => {
        const active = value === p;
        const label = p === "single" ? "Single User" : p === "five" ? "5 Users" : "10 Users";
        const seats = p === "single" ? "1 seat" : `Up to ${p === "five" ? 5 : 10} seats`;
        return (
          <label key={p} style={boxStyle(active)}>
            <input
              type="radio"
              name="plan"
              value={p}
              checked={active}
              onChange={() => onChange(p)}
            />
            <div>
              <div><b>{label}</b></div>
              <div>{seats}</div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

function boxStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid " + (active ? "black" : "#ccc"),
    alignItems: "center",
    cursor: "pointer"
  };
}
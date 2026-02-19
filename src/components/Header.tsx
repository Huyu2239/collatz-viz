import { useState } from "react";

type Props = {
  maxNumber: number;
  onChange: (value: number) => void;
};

const MIN = 4;
const MAX = 100000;

export default function Header({ maxNumber, onChange }: Props) {
  const [text, setText] = useState(String(maxNumber));

  const apply = () => {
    const n = parseInt(text, 10);
    if (isNaN(n)) {
      setText(String(maxNumber));
      return;
    }
    const clamped = Math.max(MIN, Math.min(MAX, n));
    setText(String(clamped));
    onChange(clamped);
  };

  return (
    <header
      style={{
        height: 44,
        background: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        fontFamily: "monospace",
        color: "#e0e0e0",
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: "bold" }}>CollatzViz</span>
      <label style={{ marginLeft: "auto" }}>
        max:{" "}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply();
          }}
          style={{
            width: 72,
            background: "#2a2a2a",
            color: "#e0e0e0",
            border: "1px solid #444",
            borderRadius: 4,
            padding: "2px 6px",
            fontFamily: "monospace",
            fontSize: 14,
          }}
        />
      </label>
    </header>
  );
}

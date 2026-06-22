// Cosmetic indicator of the active model mode (ILMU sovereign vs default).
// Mirrors the backend LLM_PROVIDER swap — in-country, PDPA-resident inference.
export function SovereignToggle() {
  const on = process.env.NEXT_PUBLIC_SOVEREIGN === "1";
  return (
    <span
      className="chip"
      style={on ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
      title={on ? "Inference + data kept in Malaysia (ILMU Claw)" : "Default model provider"}
    >
      {on ? "🇲🇾 Sovereign · ILMU" : "Default model"}
    </span>
  );
}

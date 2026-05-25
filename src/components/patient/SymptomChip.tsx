export function SymptomChip({ label, selected, onToggle, color }: { label: string; selected: boolean; onToggle: () => void; color: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-95"
      style={selected
        ? { background: color, color: "#fff", border: "1.5px solid " + color }
        : { background: "#fff", color: "var(--text-medium)", border: "1.5px solid #E5E7EB" }}
    >
      {label}
    </button>
  );
}

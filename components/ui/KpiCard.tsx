export function KpiCard({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <div className="surface kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {delta && <div className="kpi-delta">{delta}</div>}
    </div>
  );
}

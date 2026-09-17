export function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

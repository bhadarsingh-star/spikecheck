import { formatSpike, spikeBand } from "@/lib/meals";

// Pill showing a spike's number and size word, e.g. "+60 mg/dL · large".
export default function SpikeBadge({ value }: { value: number }) {
  const band = spikeBand(value);
  return (
    <span className={`spike-badge ${band}`}>
      {formatSpike(value)} · {band}
    </span>
  );
}

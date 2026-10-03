type FlightState = "idle" | "flying" | "cashout" | "crashed";

export default function FlightSignal({
  state = "idle",
  multiplier = 1,
  compact = false,
}: {
  state?: FlightState;
  multiplier?: number;
  compact?: boolean;
}) {
  const statusLabels: Record<FlightState, string> = {
    idle: "standby",
    flying: "in flight",
    cashout: "cashout locked",
    crashed: "crash",
  };

  const stateTone: Record<FlightState, string> = {
    idle: "bg-slate-500/20 text-slate-200 border-slate-500/30",
    flying: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
    cashout: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
    crashed: "bg-rose-500/15 text-rose-200 border-rose-400/30",
  };

  const packet = [
    "4F 42 4A 45 43 54",
    "7C 10 22 81 4A 00",
    "2F 7A 00 00 83 1B",
    "7E 33 00 45 66 91",
    "00 08 F0 02 1D 71",
  ];

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-[#1c3026] bg-[#09130f]/80 p-2"
          : "rounded-2xl border border-[#1c3026] bg-[#09130f]/90 p-3 shadow-[0_0_30px_rgba(67,229,140,0.08)]"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#43e58c] shadow-[0_0_12px_rgba(67,229,140,0.8)]" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-gray-400">PING_REQUEST</span>
        </div>

        <div className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${stateTone[state]}`}>
          {statusLabels[state]}
        </div>
      </div>

      <div className="mt-3 grid gap-1.5">
        {packet.map((row, index) => (
          <div key={`${row}-${index}`} className="grid grid-cols-6 gap-1 text-[9px] text-[#9fb0a4]">
            {row.split(" ").map((byte, byteIndex) => (
              <span
                key={`${byte}-${byteIndex}`}
                className={
                  byteIndex % 2 === 0
                    ? "rounded bg-[#102019] px-1 py-0.5 text-center"
                    : "rounded bg-[#0f1d18] px-1 py-0.5 text-center text-[#7dd3fc]"
                }
              >
                {byte}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#1c3026] pt-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">multiplier</span>
        <span className="text-base font-bold text-[#43e58c]">{multiplier.toFixed(2)}x</span>
      </div>
    </div>
  );
}

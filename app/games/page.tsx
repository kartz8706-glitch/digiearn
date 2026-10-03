import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import FlightSignal from "@/components/FlightSignal";
import { Plane, Rocket, TrendingUp } from "lucide-react";

export default function GamesPage() {
  const games = [
    {
      name: "Aviator",
      slug: "aviator/live",
      accent: "from-[#43e58c]/20 via-[#0c1813] to-[#07110d]",
      label: "Live flight",
      description: "Track the multiplier live, cash out before the crash, and keep the plane in the air until the round resolves.",
      Icon: Plane,
    },
    {
      name: "Momentum Run",
      slug: "aviator/demo",
      accent: "from-[#7dd3fc]/20 via-[#0c1813] to-[#07110d]",
      label: "Demo mode",
      description: "Practice with a synthetic market run and test the pacing before a live round.",
      Icon: Rocket,
    },
  ];

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="page-enter min-h-screen px-6 pb-12 pt-24 md:ml-64">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.22em] text-[#43e58c]">game arena</p>
            <h1 className="mt-3 text-4xl font-bold">Pick your flight</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-5 md:grid-cols-2">
              {games.map(({ name, slug, accent, label, description, Icon }) => (
                <Link
                  key={name}
                  href={`/games/${slug}`}
                  className={`group relative overflow-hidden rounded-3xl border border-[#1c3026] bg-gradient-to-br ${accent} p-5 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-[#43e58c]/60`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(67,229,140,0.12),transparent_35%)]" />
                  <div className="relative">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1c3026] bg-[#0c1813]/80 text-[#43e58c]">
                        <Icon size={22} />
                      </div>
                      <span className="rounded-full border border-[#1c3026] bg-[#0c1813]/80 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gray-400">
                        {label}
                      </span>
                    </div>

                    <h2 className="text-2xl font-semibold">{name}</h2>
                    <p className="mt-3 text-sm leading-6 text-gray-400">{description}</p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#1c3026] pt-4 text-sm text-[#7dd3fc]">
                      <span>Open table</span>
                      <TrendingUp size={18} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="rounded-3xl border border-[#1c3026] bg-[#09130f]/80 p-5">
              <FlightSignal state="flying" multiplier={2.84} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

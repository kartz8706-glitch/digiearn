import Link from "next/link";

export default function AviatorEntryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110d] px-6 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-[#1c3026] bg-[#09130f] p-8 shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.22em] text-[#43e58c]">Aviator</p>
        <h1 className="mt-4 text-3xl font-bold">Choose a flight mode</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/games/aviator/live"
            className="rounded-2xl border border-[#1c3026] bg-[#102019] p-5 text-center transition hover:border-[#43e58c]/60 hover:-translate-y-1"
          >
            <div className="text-lg font-semibold">Live mode</div>
            <div className="mt-2 text-sm text-gray-400">Play with active balance</div>
          </Link>
          <Link
            href="/games/aviator/demo"
            className="rounded-2xl border border-[#1c3026] bg-[#0c1813] p-5 text-center transition hover:border-[#7dd3fc]/60 hover:-translate-y-1"
          >
            <div className="text-lg font-semibold">Demo mode</div>
            <div className="mt-2 text-sm text-gray-400">Practice without risk</div>
          </Link>
        </div>
      </div>
    </main>
  );
}

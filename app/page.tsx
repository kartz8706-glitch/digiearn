import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  CircleCheck,
  Gauge,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const marketRows = [
  ["UGX 0.00", "Available balance", "Ready"],
  ["x 6.97", "Maturity rule", "30 days"],
  ["UGX 0.00", "Portfolio value", "No risk"],
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07110d] text-white">
      <div className="hero-grid hero-grid-animated pointer-events-none absolute inset-0" />
      <div className="market-scan pointer-events-none absolute inset-x-0 top-0 h-64" />

      <nav className="nav-enter relative z-10 flex items-center justify-between border-b border-[#1c3026]/80 bg-[#07110d]/75 px-6 py-5 backdrop-blur-xl md:px-12">
        <Link href="/" className="text-xl font-bold text-white">
          digi<span className="text-[#43e58c]">.earn</span>
        </Link>

        <div className="hidden gap-8 text-sm text-gray-400 md:flex">
          <Link href="/investments" className="nav-link">
            Investments
          </Link>
          <Link href="/portfolio" className="nav-link">
            Portfolio
          </Link>
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden rounded-xl border border-[#1c3026] px-4 py-3 text-sm font-semibold hover:-translate-y-0.5 hover:border-[#43e58c]/60 hover:bg-[#0c1813] sm:block">
            Sign in
          </Link>
          <Link href="/signup" className="magnetic-button rounded-xl bg-[#43e58c] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_28px_rgba(67,229,140,0.16)] hover:-translate-y-0.5 hover:bg-[#c7f36b]">
            Get started
          </Link>
        </div>
      </nav>

      <div className="relative z-10 border-b border-[#1c3026]/70 bg-[#09130f]/55 py-3">
        <div className="ticker-track flex gap-3 whitespace-nowrap text-xs text-gray-500">
          {[...marketRows, ...marketRows, ...marketRows, ...marketRows].map(
            ([value, label, status], index) => (
              <span
                key={`${label}-${index}`}
                className="inline-flex items-center gap-3 rounded-full border border-[#1c3026] bg-[#0c1813]/80 px-4 py-2"
              >
                <span className="text-[#43e58c]">{value}</span>
                <span>{label}</span>
                <span className="text-[#7dd3fc]">{status}</span>
              </span>
            )
          )}
        </div>
      </div>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-20 md:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:pb-32 lg:text-left">
        <div>
          <div className="rise-in mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#43e58c]/30 bg-[#43e58c]/[0.07] px-4 py-2 text-sm text-[#43e58c] lg:mx-0">
            <Gauge size={16} />
            INVESTMENT SIMULATOR
          </div>

          <h1 className="rise-in rise-in-delay-1 mx-auto max-w-4xl text-5xl font-bold leading-[0.98] md:text-7xl lg:mx-0">
            Build your portfolio.
            <span className="headline-glow block">Learn investing.</span>
          </h1>

          <p className="rise-in rise-in-delay-2 mx-auto mt-7 max-w-2xl text-lg leading-8 text-gray-400 lg:mx-0">
            Explore markets, build simulated portfolios and understand
            investment strategies in a focused practice environment.
          </p>

          <div className="rise-in rise-in-delay-3 mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
            <Link href="/signup" className="magnetic-button rounded-xl bg-[#43e58c] px-7 py-4 text-center font-semibold text-black shadow-[0_0_34px_rgba(67,229,140,0.18)] hover:-translate-y-1 hover:bg-[#c7f36b]">
              Start investing
            </Link>

            <Link
              href="/investments"
              className="rounded-xl border border-[#1c3026] px-7 py-4 text-center font-semibold hover:-translate-y-1 hover:border-[#43e58c]/60 hover:bg-[#0c1813]"
            >
              Explore markets
            </Link>
          </div>

          <div className="rise-in rise-in-delay-3 mt-10 grid gap-3 text-left sm:grid-cols-3">
            {[
              ["Zero", "starting pressure"],
              ["Live", "admin products"],
              ["Clear", "lock periods"],
            ].map(([value, label]) => (
              <div key={label} className="metric-chip rounded-xl border border-[#1c3026] bg-[#0c1813]/70 p-4">
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rise-in rise-in-delay-2 relative mx-auto w-full max-w-md lg:ml-auto">
          <div className="float-slow absolute -right-4 -top-8 h-20 w-20 rounded-2xl border border-[#c7f36b]/30 bg-[#c7f36b]/10 blur-[1px]" />
          <div className="dashboard-preview shimmer relative overflow-hidden rounded-[2rem] border border-[#43e58c]/25 bg-[#0c1813]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex items-center justify-between border-b border-[#1c3026] pb-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Portfolio pulse</p>
                <p className="mt-1 text-lg font-semibold">Demo performance</p>
              </div>
              <span className="rounded-full bg-[#43e58c]/10 px-3 py-1 text-xs text-[#43e58c]">
                Practice mode
              </span>
            </div>

            <div className="relative mt-6 h-48 rounded-xl border border-[#1c3026] bg-[#07110d] p-4">
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between text-xs text-gray-500">
                <span>Allocation</span>
                <span className="text-[#7dd3fc]">Simulated</span>
              </div>
              <div className="chart-stage absolute inset-x-5 bottom-5 top-12 flex items-end gap-3">
                {[40, 72, 54, 86, 62, 94, 76].map((height, index) => (
                  <span
                    key={height}
                    className="chart-bar flex-1 rounded-t-lg bg-[#43e58c]"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${index * 90}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {marketRows.map(([value, label, status]) => (
                <div key={label} className="rounded-xl border border-[#1c3026] bg-[#07110d]/80 p-3">
                  <p className="text-sm font-semibold">{value}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{label}</p>
                  <p className="mt-2 text-[11px] text-[#7dd3fc]">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="surface grid overflow-hidden rounded-2xl md:grid-cols-3">
          {[
            ["01", "Start with a clean slate", "Create an account with no preloaded balance or portfolio."],
            ["02", "Explore the market", "Review investment products, lock periods, and maturity rules."],
            ["03", "Make informed moves", "Use simulated deposits, withdrawals, and investments to learn."],
          ].map(([number, title, description], index) => (
            <div key={title} className={`stagger-item p-6 md:p-8 ${index > 0 ? "border-t border-[#1c3026] md:border-l md:border-t-0" : ""}`}>
              <span className="text-xs font-semibold tracking-[0.2em] text-[#43e58c]">{number}</span>
              <h2 className="mt-5 text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 border-y border-[#1c3026]/80 bg-[#09130f]/80">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-[#43e58c]">BUILT FOR PRACTICE</p>
            <h2 className="mt-4 max-w-md text-4xl font-bold leading-tight">A calmer way to understand your money.</h2>
            <p className="mt-5 max-w-md leading-7 text-gray-500">digi.earn gives you a structured place to test decisions before they become habits. Every balance starts at zero, so every move is yours.</p>
            <div className="mt-8 flex gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#1c3026] bg-[#0c1813] text-[#43e58c]">
                <ShieldCheck size={20} />
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#1c3026] bg-[#0c1813] text-[#7dd3fc]">
                <TrendingUp size={20} />
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [WalletCards, "A personal workspace", "Keep your balance, portfolio, and activity in one focused view."],
              [LockKeyhole, "Clear lock periods", "See when an investment unlocks before you commit simulated funds."],
              [ChartNoAxesCombined, "Useful signals", "Compare products with simple rules instead of noisy dashboards."],
              [CircleCheck, "A safe sandbox", "Practice deposits, withdrawals, and approvals without real-money risk."],
            ].map(([Icon, title, description]) => {
              const FeatureIcon = Icon as typeof WalletCards;
              return (
                <div key={title as string} className="surface lift-on-hover mobile-card rounded-2xl p-6">
                  <FeatureIcon size={22} className="text-[#43e58c]" />
                  <h3 className="mt-5 font-semibold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{description as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="cta-panel shimmer overflow-hidden rounded-[2rem] border border-[#43e58c]/25 bg-[#43e58c]/[0.07] px-6 py-12 text-center sm:px-12">
          <p className="text-sm font-medium tracking-[0.2em] text-[#43e58c]">READY WHEN YOU ARE</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-bold">Turn curiosity into a repeatable investing process.</h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-400">Set up your free simulator workspace and make your first decision with context, not pressure.</p>
          <Link href="/signup" className="magnetic-button mt-8 inline-flex items-center rounded-xl bg-[#43e58c] px-6 py-4 font-semibold text-black shadow-[0_0_34px_rgba(67,229,140,0.18)] hover:-translate-y-1 hover:bg-[#c7f36b]">
            Create your workspace <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#1c3026] px-6 py-8 text-center text-sm text-gray-600">
        <p>digi.earn is a simulated investing environment for learning and practice.</p>
      </footer>
    </main>
  );
}

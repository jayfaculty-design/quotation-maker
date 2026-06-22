"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Check,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { ENTITIES } from "@/data/entities";
import { DOC_TYPES, isDocTypeAvailable } from "@/data/documentTypes";
import { HOSPITALS } from "@/data/hospitals";

/* ---------- shared tokens ---------- */
const GLASS =
  "border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_-14px_rgba(2,6,23,0.22)]";

/* ---------- reveal-on-scroll wrapper ---------- */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [shown, setShown] = useState(false);
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  return (
    <div
      ref={setEl}
      className={`reveal ${shown ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- entity logo with initials fallback ---------- */
function EntityLogo({ entity }: { entity: (typeof ENTITIES)[number] }) {
  const [err, setErr] = useState(false);
  if (entity.logo && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={entity.logo}
        alt={`${entity.name} logo`}
        onError={() => setErr(true)}
        className="h-9 w-auto max-w-[46px] object-contain"
      />
    );
  }
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
      style={{ backgroundColor: entity.accent }}
    >
      {entity.initials}
    </span>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-slate-900">
      {/* ---------- ambient glass backdrop ---------- */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eef3fb] via-[#eef2f9] to-[#e9eef7]" />
        <div className="animate-blob absolute -left-24 top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-teal-300/30 blur-3xl" />
        <div
          className="animate-blob absolute right-[-8rem] top-24 h-[26rem] w-[26rem] rounded-full bg-sky-300/30 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      {/* ---------- navigation ---------- */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "py-2" : "py-3"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav
            className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
              scrolled ? GLASS : "border border-transparent"
            }`}
          >
            <a href="#top" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-[15px] font-bold tracking-tight">
                TenderSuite
              </span>
            </a>
            <a
              href="#companies"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Choose a company
              <ArrowRight className="h-4 w-4" />
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ---------- hero ---------- */}
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-semibold text-teal-700 backdrop-blur-md">
                <span className="flex h-1.5 w-1.5 rounded-full bg-teal-500" />
                Beautiful Creations Group · internal workspace
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Branded{" "}
                <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
                  submission-ready
                </span>{" "}
                documents in minutes.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Prepare quotations, proforma invoices and complete tender
                packages for any of the group&apos;s companies. Pick a company
                below to open its preparation workspace.
              </p>
              <div className="mt-8">
                <a
                  href="#companies"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Choose a company
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>

            {/* hero visual: glass preview with real info */}
            <Reveal delay={120} className="relative">
              <div className={`rounded-3xl p-5 sm:p-6 ${GLASS}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    Bid Package Studio
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { k: "Companies", v: ENTITIES.length, accent: "#0F766E" },
                    {
                      k: "Document systems",
                      v: DOC_TYPES.length,
                      accent: "#1D4ED8",
                    },
                    {
                      k: "Procuring entities",
                      v: `${HOSPITALS.length}+`,
                      accent: "#7C3AED",
                    },
                    { k: "Branded output", v: "100%", accent: "#B45309" },
                  ].map((s) => (
                    <div
                      key={s.k}
                      className="rounded-2xl border border-white/70 bg-white/70 p-3.5"
                    >
                      <div
                        className="text-2xl font-bold tracking-tight"
                        style={{ color: s.accent }}
                      >
                        {s.v}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {s.k}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-white/70 bg-white/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
                    <span>What&apos;s in a package</span>
                    <span className="text-teal-600">Auto-assembled</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      "Cover Page",
                      "Price Schedule",
                      "Bid / Tender Forms",
                      "Company Certificates",
                    ].map((d) => (
                      <div
                        key={d}
                        className="flex items-center gap-2 text-xs text-slate-600"
                      >
                        <Check className="h-3.5 w-3.5 text-teal-600" />
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- companies ---------- */}
        <section id="companies" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
              Choose a company
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Five companies, one workspace
            </h2>
            <p className="mt-3 text-slate-600">
              Each subsidiary keeps its own branded templates, drafts and live
              document systems.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ENTITIES.map((e, i) => {
              const live = DOC_TYPES.filter((d) =>
                isDocTypeAvailable(e.slug, d.slug),
              );
              return (
                <Reveal key={e.slug} delay={i * 70} className="h-full">
                  <Link
                    href={`/${e.slug}`}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1.5 hover:bg-white/80 ${GLASS}`}
                  >
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${e.accent}, transparent)`,
                      }}
                    />
                    <span
                      className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                      style={{
                        boxShadow: `0 0 0 1px ${e.accent}55, 0 24px 60px -28px ${e.accent}66`,
                      }}
                    />
                    <div className="relative flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-sm">
                        <EntityLogo entity={e} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold tracking-tight text-slate-900">
                          {e.short}
                        </h3>
                        <p className="truncate text-xs text-slate-400">
                          {e.name}
                        </p>
                      </div>
                    </div>

                    <p className="relative mt-4 text-sm leading-relaxed text-slate-600">
                      {e.tagline}
                    </p>

                    <div className="relative mt-4 flex flex-wrap gap-1.5">
                      {live.length ? (
                        live.map((d) => (
                          <span
                            key={d.slug}
                            className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                          >
                            {d.name}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                          Coming soon
                        </span>
                      )}
                    </div>

                    <div className="relative mt-auto flex items-center justify-between pt-6">
                      <span className="text-xs text-slate-500">
                        <span
                          className="text-sm font-bold"
                          style={{ color: e.accent }}
                        >
                          {live.length}
                        </span>{" "}
                        live system{live.length === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition group-hover:gap-2.5 group-hover:bg-slate-800">
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="mt-6 border-t border-white/60 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span className="text-[15px] font-bold tracking-tight">
                  TenderSuite
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
                Internal preparation workspace for the Beautiful Creations group
                of healthcare companies.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Document systems
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {DOC_TYPES.map((d) => (
                  <li key={d.slug}>{d.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contact
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-teal-600" />
                  <a
                    href="mailto:beautifulcreationsgh@yahoo.com"
                    className="transition hover:text-teal-700"
                  >
                    beautifulcreationsgh@yahoo.com
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-teal-600" />
                  (233) 0302 667171
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  Accra, Ghana
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-white/60 pt-6 text-xs text-slate-400">
            © {new Date().getFullYear()} Beautiful Creations Group · internal use
            only.
          </div>
        </div>
      </footer>
    </div>
  );
}

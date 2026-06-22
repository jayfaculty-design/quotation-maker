"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Send,
  TrendingUp,
  FileSearch,
  Palette,
  Calculator,
  Package,
  Layers,
  Save,
  BadgeCheck,
  Mail,
  Phone,
  MapPin,
  Menu,
  X,
  Quote,
  Check,
  Globe,
  MessageCircle,
  ArrowUpRight,
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
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
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
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- animated counter ---------- */
function Counter({
  to,
  duration = 1600,
  suffix = "",
}: {
  to: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;
    const run = () => {
      let startTs = 0;
      const step = (now: number) => {
        if (!startTs) startTs = now;
        const p = Math.min(1, (now - startTs) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(to * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          started = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------- entity logo with initials fallback ---------- */
function EntityLogo({
  entity,
  size = "h-9 max-w-[46px]",
}: {
  entity: (typeof ENTITIES)[number];
  size?: string;
}) {
  const [err, setErr] = useState(false);
  if (entity.logo && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={entity.logo}
        alt={`${entity.name} logo`}
        onError={() => setErr(true)}
        className={`${size} w-auto object-contain`}
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

const NAV = [
  { label: "Companies", href: "#companies" },
  { label: "Features", href: "#features" },
  { label: "Trusted by", href: "#trust" },
];

const FEATURES = [
  {
    icon: Palette,
    title: "Fully branded output",
    body: "Every package carries the company's letterhead, logo, signatures and styling — applied automatically.",
  },
  {
    icon: Calculator,
    title: "Smart pricing engine",
    body: "Live subtotals, conditional VAT, discounts and amount-in-words, computed as you type.",
  },
  {
    icon: Package,
    title: "One-click assembly",
    body: "Cover, bid forms, price schedule and certificates — rendered and zipped, ready to submit.",
  },
  {
    icon: Layers,
    title: "Three document systems",
    body: "Quotations, proforma invoices and full tender submissions from a single workspace.",
  },
  {
    icon: Save,
    title: "Never lose a draft",
    body: "Each company keeps its own autosaved draft, scoped per document type.",
  },
  {
    icon: BadgeCheck,
    title: "Compliance, bundled",
    body: "Manufacturer's authorization, references, warranties and tax certificates included by default.",
  },
];

const AGENCIES = [
  "Ghana Health Service",
  "Ministry of Health",
  "Komfo Anokye Teaching Hospital",
  "Korle Bu Teaching Hospital",
  "World Bank",
  "WHO",
  "ECOWAS",
  "AfDB",
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const docCount = DOC_TYPES.length;

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
        <div
          className="animate-blob absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-violet-300/25 blur-3xl"
          style={{ animationDelay: "-12s" }}
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

            <div className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/60 hover:text-slate-900"
                >
                  {n.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <a
                href="#companies"
                className="hidden items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:inline-flex"
              >
                Open a workspace
                <ArrowRight className="h-4 w-4" />
              </a>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl md:hidden ${GLASS}`}
              >
                {menuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </nav>

          {menuOpen && (
            <div className={`mt-2 rounded-2xl p-2 md:hidden ${GLASS}`}>
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white/60"
                >
                  {n.label}
                </a>
              ))}
              <a
                href="#companies"
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open a workspace <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </header>

      <main id="top">
        {/* ---------- hero ---------- */}
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-semibold text-teal-700 backdrop-blur-md">
                <span className="flex h-1.5 w-1.5 rounded-full bg-teal-500" />
                Healthcare procurement, streamlined
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Win more tenders with{" "}
                <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
                  submission-ready
                </span>{" "}
                documents.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Generate fully-branded quotations, proforma invoices and complete
                tender packages for Ghana Health Service, ministries and
                international donors — five companies, one streamlined workspace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#companies"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Open a workspace
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#features"
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white ${GLASS}`}
                >
                  Explore features
                </a>
              </div>
              <div className="mt-8 flex items-center gap-5 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" /> Consultant-grade
                  output
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-teal-600" /> No formatting headaches
                </span>
              </div>
            </Reveal>

            {/* hero visual: glass dashboard + floating cards */}
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
                    { k: "Doc systems", v: docCount, accent: "#1D4ED8" },
                    {
                      k: "Procuring entities",
                      v: `${HOSPITALS.length}+`,
                      accent: "#7C3AED",
                    },
                    { k: "Branded", v: "100%", accent: "#B45309" },
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
                    <span>Package preview</span>
                    <span className="text-teal-600">Ready</span>
                  </div>
                  <div className="space-y-1.5">
                    {["Cover Page", "Price Schedule", "Bid Forms", "Certificates"].map(
                      (d) => (
                        <div
                          key={d}
                          className="flex items-center gap-2 text-xs text-slate-600"
                        >
                          <Check className="h-3.5 w-3.5 text-teal-600" />
                          {d}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`animate-floaty absolute -left-4 -top-4 hidden rounded-2xl px-3.5 py-2.5 sm:block ${GLASS}`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[11px] font-semibold text-slate-900">
                      Minutes, not days
                    </div>
                    <div className="text-[10px] text-slate-400">per package</div>
                  </div>
                </div>
              </div>
              <div
                className={`animate-floaty absolute -bottom-5 -right-3 hidden rounded-2xl px-3.5 py-2.5 sm:block ${GLASS}`}
                style={{ animationDelay: "-3s" }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[11px] font-semibold text-slate-900">
                      Audit-clean
                    </div>
                    <div className="text-[10px] text-slate-400">every render</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- statistics ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Reveal>
            <div
              className={`grid grid-cols-2 gap-3 rounded-3xl p-4 sm:p-6 lg:grid-cols-4 ${GLASS}`}
            >
              {[
                { icon: FileSearch, label: "Active Tenders", to: 240, suffix: "+" },
                {
                  icon: Building2,
                  label: "Registered Companies",
                  to: ENTITIES.length,
                  suffix: "",
                },
                { icon: Send, label: "Submitted Bids", to: 1860, suffix: "+" },
                { icon: TrendingUp, label: "Success Rate", to: 96, suffix: "%" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-3.5 rounded-2xl p-3 sm:p-4 ${
                    i < 3 ? "lg:border-r lg:border-white/60" : ""
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/15 to-sky-500/15 text-teal-700">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      <Counter to={s.to} suffix={s.suffix} />
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---------- companies (tender sources) ---------- */}
        <section id="companies" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
              Choose a company
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Five companies, one workspace
            </h2>
            <p className="mt-3 text-slate-600">
              Pick a subsidiary to open its branded preparation workspace. Each
              keeps its own templates, drafts and document systems.
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

        {/* ---------- features ---------- */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
              Why teams choose it
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything a submission needs
            </h2>
            <p className="mt-3 text-slate-600">
              From the first cover page to the last certificate — branded,
              calculated and assembled for you.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 60} className="h-full">
                <div
                  className={`group flex h-full flex-col rounded-3xl p-6 transition duration-300 hover:-translate-y-1.5 hover:bg-white/80 ${GLASS}`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-md shadow-sky-600/20 transition group-hover:scale-105">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- trust & credibility ---------- */}
        <section id="trust" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <div className={`overflow-hidden rounded-[28px] p-8 sm:p-12 ${GLASS}`}>
              <div className="text-center">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
                  Trusted for submissions to
                </span>
                <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
                  {AGENCIES.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-medium text-slate-600"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <figure className="rounded-3xl border border-white/70 bg-white/60 p-7">
                  <Quote className="h-8 w-8 text-teal-500/40" />
                  <blockquote className="mt-3 text-lg font-medium leading-relaxed text-slate-800">
                    “Assembling a single tender package used to take us two days.
                    Now it&apos;s minutes — fully branded, accurate and consistent
                    every single time.”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-sm font-bold text-white">
                      PL
                    </span>
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900">
                        Procurement Lead
                      </div>
                      <div className="text-slate-500">
                        Beautiful Creations Group
                      </div>
                    </div>
                  </figcaption>
                </figure>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { v: 5, s: "", l: "Subsidiaries" },
                    { v: 3, s: "", l: "Document systems" },
                    { v: HOSPITALS.length, s: "+", l: "Procuring entities" },
                    { v: 100, s: "%", l: "Branded output" },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className="flex flex-col justify-center rounded-3xl border border-white/70 bg-white/60 p-5"
                    >
                      <div className="text-3xl font-bold tracking-tight text-slate-900">
                        <Counter to={m.v} suffix={m.s} />
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {m.l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------- final CTA ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-12 text-center shadow-2xl sm:px-12">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
              <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to assemble your next package?
              </h2>
              <p className="relative mx-auto mt-3 max-w-xl text-slate-300">
                Pick a company and generate a branded, submission-ready document
                set in minutes.
              </p>
              <a
                href="#companies"
                className="relative mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="mt-6 border-t border-white/60 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
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
                Branded tender, quotation and proforma preparation for the
                Beautiful Creations group of healthcare companies.
              </p>
              <div className="mt-5 flex gap-2">
                {[Globe, MessageCircle, Mail].map((Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/60 text-slate-500 transition hover:bg-white hover:text-slate-900"
                    aria-label="social link"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Quick links
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <a href={n.href} className="transition hover:text-teal-700">
                      {n.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#top" className="transition hover:text-teal-700">
                    Back to top
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Document types
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

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/60 pt-6 text-xs text-slate-400 sm:flex-row">
            <span>
              © {new Date().getFullYear()} Beautiful Creations Group. All rights
              reserved.
            </span>
            <span className="flex items-center gap-1.5">
              Consultant-grade output
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Lock, Sparkles } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Palette: deep forest #1f3326, primary green #4a6741 (AA contrast with white),
// warm terracotta accent #c2703d, paper #fbf8f1.
const moods = [
  { label: "Calm", className: "bg-[#dfe9d8] text-[#2f4a2a]" },
  { label: "Hopeful", className: "bg-[#f6e3d3] text-[#7a4222]" },
  { label: "Tired", className: "bg-white/10 text-[#e4ecdf]" },
];

function BrandMark({ tone }: { tone: "light" | "dark" }) {
  const light = tone === "light";
  return (
    <a
      href={basePath || "/"}
      className="group inline-flex items-center gap-3"
      aria-label="ReflectAI home"
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:-rotate-6 ${
          light ? "bg-white/10 ring-1 ring-white/15" : "bg-[#eef3eb] ring-1 ring-[#cfd9ca]"
        }`}
      >
        <img src={`${window.location.origin}${basePath}/favicon.svg`} alt="" className="h-6 w-6" />
      </span>
      <span
        className={`font-display text-2xl font-semibold tracking-[-0.02em] ${
          light ? "text-[#f5f1e8]" : "text-[#1f2a1d]"
        }`}
      >
        ReflectAI
      </span>
    </a>
  );
}

function AuthShowcase() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#1f3326] text-[#e4ecdf] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#4a6741]/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-[#c2703d]/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <div className="relative">
        <BrandMark tone="light" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <h2 className="font-display text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-[#f5f1e8] xl:text-[2.75rem]">
          Write freely.
          <br />
          <span className="italic text-[#e9a77a]">Understand yourself</span>
          <br />
          a little better.
        </h2>
        <p className="mt-4 max-w-sm font-sans text-[0.95rem] leading-relaxed text-[#b9c7b3]">
          Journal in your own words and get gentle reflections on what you&rsquo;re feeling, day by day.
        </p>

        <div className="relative mt-10">
          <figure className="rotate-[-1.5deg] rounded-2xl bg-[#fffdf8] p-6 text-[#2c3a29] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
            <figcaption className="flex items-center justify-between font-sans text-xs font-medium uppercase tracking-[0.14em] text-[#8a9686]">
              <span>Tuesday evening</span>
              <span className="rounded-full bg-[#dfe9d8] px-2.5 py-1 normal-case tracking-normal text-[#2f4a2a]">
                Calm
              </span>
            </figcaption>
            <blockquote className="mt-3 text-[1.05rem] leading-relaxed">
              Long day, but I finally went for that walk by the river. Noticed I wasn&rsquo;t
              replaying the meeting in my head for once&hellip;
            </blockquote>
          </figure>

          <div className="relative -mt-4 ml-8 rotate-[1deg] rounded-2xl border border-white/10 bg-[#2b4432]/95 p-5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#e9a77a]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Reflection
            </div>
            <p className="mt-2 font-sans text-sm leading-relaxed text-[#dfe7da]">
              Time outside seems to quiet your thoughts. This is the third entry this month where a
              walk shifted your mood.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-2 font-sans text-xs">
        <span className="mr-1 text-[#8fa189]">This week:</span>
        {moods.map((m) => (
          <span key={m.label} className={`rounded-full px-3 py-1 font-medium ${m.className}`}>
            {m.label}
          </span>
        ))}
      </div>
    </aside>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] bg-[#fbf8f1] font-sans lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthShowcase />

      <main className="relative flex flex-col px-4 py-8 sm:px-8 lg:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#dfe9d8] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#f6e3d3]/70 blur-3xl" />
        </div>

        <div className="relative lg:hidden">
          <BrandMark tone="dark" />
        </div>

        <div className="relative mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          {children}
        </div>

        <p className="relative flex items-center justify-center gap-1.5 text-center text-xs text-[#7a8776]">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          A private space to pause, reflect, and move forward.
        </p>
      </main>
    </div>
  );
}

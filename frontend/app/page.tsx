import Link from "next/link";
import {
  Database, Upload, LayoutDashboard, Sparkles,
  Zap, BarChart2, Brain, Shield, ArrowRight, ChevronRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Upload,
    title: "Smart CSV Upload",
    desc: "Drag and drop any CSV file. We automatically detect column types and create a queryable database instantly.",
    gradient: "from-violet-500/20 to-violet-600/10 border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: Brain,
    title: "Natural Language to SQL",
    desc: "Ask questions in plain English. Gemini 1.5 Flash translates them into precise, optimized SQL queries.",
    gradient: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: BarChart2,
    title: "Automatic Visualizations",
    desc: "Results are automatically visualized as bar, line, or pie charts — no chart configuration needed.",
    gradient: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Sparkles,
    title: "AI Business Insights",
    desc: "Every query generates 3 actionable business insights, highlighting trends, anomalies, and opportunities.",
    gradient: "from-amber-500/20 to-amber-600/10 border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Shield,
    title: "Secure & Read-Only",
    desc: "All generated SQL is validated to be SELECT-only. Your data is never modified or exposed.",
    gradient: "from-rose-500/20 to-rose-600/10 border-rose-500/20",
    iconColor: "text-rose-400",
  },
  {
    icon: Zap,
    title: "Query History",
    desc: "Every query is saved. Revisit, replay, and compare past analyses at any time.",
    gradient: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/20",
    iconColor: "text-indigo-400",
  },
];

const STEPS = [
  { n: "01", title: "Upload CSV", desc: "Drop any CSV file and we parse + ingest it" },
  { n: "02", title: "Ask a Question", desc: "Type your question in plain English" },
  { n: "03", title: "AI Generates SQL", desc: "Gemini creates a precise SQL query from your question" },
  { n: "04", title: "Get Insights", desc: "See results, charts, and AI insights instantly" },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-20 pb-32 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini 1.5 Flash
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Talk to your data.{" "}
          <br />
          <span className="gradient-text">Get instant answers.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed">
          Upload any CSV file, ask questions in plain English, and receive{" "}
          <span className="text-white">SQL queries</span>,{" "}
          <span className="text-white">beautiful charts</span>, and{" "}
          <span className="text-white">AI-powered insights</span> — in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/upload"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-lg hover:opacity-90 transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02]"
          >
            <Upload className="w-5 h-5" />
            Upload Your CSV
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/workspace"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all"
          >
            <LayoutDashboard className="w-5 h-5" />
            Open Workspace
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {[
            ["Any CSV", "No schema needed"],
            ["< 2s", "Average response time"],
            ["100% Safe", "Read-only SQL only"],
          ].map(([stat, label]) => (
            <div key={stat} className="text-center">
              <p className="text-2xl font-bold gradient-text">{stat}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────────── */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From raw CSV to actionable insights in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent -z-0" />
              )}
              <div className="glass-card p-6 relative z-10 hover:border-violet-500/30 transition-colors">
                <div className="text-4xl font-black gradient-text mb-4">{step.n}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────── */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to analyze data
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            A complete analytics toolkit powered by AI. No SQL knowledge required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, gradient, iconColor }) => (
            <div
              key={title}
              className={`glass-card p-6 bg-gradient-to-br ${gradient} hover:scale-[1.01] transition-transform duration-200 cursor-default`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <section className="px-4 py-24 text-center">
        <div className="max-w-2xl mx-auto glass-card p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 pointer-events-none" />
          <Database className="w-12 h-12 text-violet-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to talk to your data?</h2>
          <p className="text-slate-400 mb-8">
            Upload your first CSV and ask your first question in under 60 seconds.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-violet-500/20"
          >
            Get Started Free
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

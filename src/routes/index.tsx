import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  Flame,
  Image as ImageIcon,
  Menu,
  Repeat,
  Smile,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-dreamscape.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DreamScape — Vision Board & Goal Tracker" },
      {
        name: "description",
        content:
          "Design your dream life with DreamScape: visual vision boards, goal tracking, habit streaks, journaling, mood insights and gamified progress.",
      },
      { property: "og:title", content: "DreamScape — Vision Board & Goal Tracker" },
      {
        property: "og:description",
        content:
          "Vision boards, goals, habits, journaling and mood tracking in one beautiful workspace.",
      },
    ],
  }),
  component: Landing,
});

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  {
    icon: ImageIcon,
    title: "Visual vision board",
    body: "Pin images, quotes and dreams to a beautiful masonry board that keeps your ambition in sight.",
  },
  {
    icon: Target,
    title: "Goal tracking",
    body: "Break big goals into milestones, set deadlines and watch progress bars fill as you move.",
  },
  {
    icon: Repeat,
    title: "Habit streaks",
    body: "Daily, weekly or monthly habits with calendar heatmaps and streaks that keep momentum alive.",
  },
  {
    icon: BookOpen,
    title: "Journaling",
    body: "Capture reflections, gratitude and ideas with mood tagging and instant full-text search.",
  },
  {
    icon: Smile,
    title: "Mood insights",
    body: "Log how you feel each day and see the emotional patterns behind your productivity.",
  },
  {
    icon: Trophy,
    title: "Gamified growth",
    body: "Earn XP, unlock achievements and level up every time you show up for yourself.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "Weekly and monthly charts reveal what's working — and what quietly needs attention.",
  },
  {
    icon: Calendar,
    title: "Planner calendar",
    body: "Deadlines, habits and events together in one month view so nothing slips through.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Picture it",
    body: "Build your vision board with images and quotes that make your future feel real.",
  },
  {
    n: "02",
    title: "Plan it",
    body: "Turn those dreams into goals with milestones, deadlines and daily habits.",
  },
  {
    n: "03",
    title: "Live it",
    body: "Check in daily, log your mood, earn XP and watch the compound effect take over.",
  },
];

const PLANS = [
  {
    name: "Dreamer",
    price: "Free",
    note: "Forever",
    features: ["Vision board", "Up to 5 goals", "3 habits", "Journal & mood log"],
    cta: "Start free",
  },
  {
    name: "Visionary",
    price: "$9",
    note: "per month",
    features: [
      "Unlimited goals & habits",
      "Advanced analytics",
      "Achievements & XP boosts",
      "Calendar planner",
      "Priority support",
    ],
    cta: "Go Visionary",
    featured: true,
  },
  {
    name: "Legend",
    price: "$19",
    note: "per month",
    features: [
      "Everything in Visionary",
      "Custom themes",
      "Data export",
      "Early access features",
    ],
    cta: "Become a Legend",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I've used a dozen goal apps. DreamScape is the first one that made me *feel* something — the board keeps me honest.",
    name: "Maya R.",
    role: "Product designer",
  },
  {
    quote:
      "The streaks plus mood tracking combo showed me why my productivity dips. Genuinely life-changing insight.",
    name: "Daniel K.",
    role: "Founder",
  },
  {
    quote:
      "Levelling up sounds gimmicky until you hit a 60-day streak and realise you actually changed.",
    name: "Priya S.",
    role: "Med student",
  },
];

const FAQS = [
  {
    q: "Is DreamScape really free to start?",
    a: "Yes. The Dreamer plan is free forever and includes the vision board, goals, habits, journaling and mood tracking.",
  },
  {
    q: "Is my data private?",
    a: "Completely. Every board, entry and log is protected by row-level security so only your account can read it.",
  },
  {
    q: "Can I use it on my phone?",
    a: "DreamScape is fully responsive and works beautifully on phones, tablets and desktops.",
  },
  {
    q: "What happens to my streaks if I miss a day?",
    a: "Your current streak resets but your longest streak and all history stay — progress is never deleted.",
  },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  const primaryTo = signedIn ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl gradient-brand shadow-glow">
              <Sparkles className="size-4 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">DreamScape</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link to={primaryTo}>{signedIn ? "Dashboard" : "Sign in"}</Link>
            </Button>
            <Button size="sm" className="hidden sm:inline-flex" asChild>
              <Link to={primaryTo}>Get started</Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="md:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-6">
                <nav className="mt-8 flex flex-col gap-4">
                  {NAV.map((n) => (
                    <a key={n.href} href={n.href} className="text-base font-medium">
                      {n.label}
                    </a>
                  ))}
                  <Button className="mt-4" asChild>
                    <Link to={primaryTo}>Get started</Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-20 sm:py-28">
          <div className="pointer-events-none absolute -left-32 top-10 size-[30rem] rounded-full gradient-brand opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 top-40 size-[26rem] rounded-full bg-brand-pink opacity-20 blur-3xl" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div className="animate-rise">
              <Badge variant="secondary" className="mb-5 rounded-full px-3 py-1">
                <Sparkles className="mr-1.5 size-3.5 text-primary" />
                Design the life you actually want
              </Badge>
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Your dreams deserve a{" "}
                <span className="text-gradient">beautiful system</span>
              </h1>
              <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
                DreamScape turns vague ambition into a visual board, tracked goals, daily
                habits and honest reflection — all in one calm, gamified workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to={primaryTo}>Start free — no card needed</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features">Explore features</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Flame className="size-4 text-brand-pink" /> 12k+ streaks tracked
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="size-4 text-warning" /> 4.9 average rating
                </span>
              </div>
            </div>

            <div className="relative animate-float">
              <div className="overflow-hidden rounded-3xl border border-border/60 shadow-float">
                <img
                  src={heroImage}
                  alt="Floating glass vision board with mountain, travel and lifestyle goal photos"
                  width={1600}
                  height={1104}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to <span className="text-gradient">follow through</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Eight connected modules that turn intention into evidence.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <Card
                  key={f.title}
                  className="glass-card gap-0 border-0 p-6 transition-smooth hover:-translate-y-1 hover:shadow-float"
                >
                  <span className="grid size-11 place-items-center rounded-2xl gradient-soft">
                    <f.icon className="size-5 text-primary" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Three steps to momentum
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <Card key={s.n} className="glass-card relative gap-0 border-0 p-7">
                  <span className="font-display text-5xl font-extrabold text-gradient opacity-80">
                    {s.n}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Loved by people who finish what they start
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <Card key={t.name} className="glass-card gap-0 border-0 p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
                  <div className="mt-5">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, honest pricing
              </h2>
              <p className="mt-3 text-muted-foreground">
                Start free. Upgrade only when DreamScape has earned it.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PLANS.map((p) => (
                <Card
                  key={p.name}
                  className={`glass-card relative gap-0 border-0 p-7 ${
                    p.featured ? "ring-2 ring-primary shadow-glow md:-translate-y-3" : ""
                  }`}
                >
                  {p.featured && (
                    <Badge className="absolute right-6 top-6">Most popular</Badge>
                  )}
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-extrabold">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.note}</span>
                  </div>
                  <ul className="mt-6 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-7 w-full"
                    variant={p.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link to={primaryTo}>{p.cta}</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-4 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Questions, answered
            </h2>
            <Accordion type="single" collapsible className="mt-10">
              {FAQS.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-24">
          <div className="mx-auto max-w-5xl">
            <Card className="glass-card relative overflow-hidden border-0 p-10 text-center sm:p-14">
              <div className="pointer-events-none absolute inset-0 gradient-brand opacity-10" />
              <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Your future self is already waiting
              </h2>
              <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
                Build your first vision board in under two minutes.
              </p>
              <Button size="lg" className="relative mt-8" asChild>
                <Link to={primaryTo}>Create your free account</Link>
              </Button>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg gradient-brand">
              <Sparkles className="size-3.5 text-primary-foreground" />
            </span>
            <span className="font-display font-semibold">DreamScape</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DreamScape. Dream it, plan it, live it.
          </p>
        </div>
      </footer>
    </div>
  );
}

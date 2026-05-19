import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, Bot, CheckCircle2, LogOut, Search, ShieldCheck, Sparkles, Send, PlusCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "./lib/api";
import { useAuthStore } from "./lib/auth-store";
import type { Tip, Urgency } from "./types";
import { Button, Card, Field, GhostButton, Input, Pill, Select, Textarea } from "./components/ui";

function urgencyTone(urgency: Urgency) {
  if (urgency === "CRITICAL") return "red";
  if (urgency === "HIGH") return "amber";
  if (urgency === "MEDIUM") return "teal";
  return "slate";
}

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
}

function useBootstrapUser() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await api.me();
      setUser(result.user);
      return result.user;
    },
    enabled: Boolean(token),
  });
}

function LoginPage() {
  const [email, setEmail] = useState("fresher@sahayyam.edu");
  const [password, setPassword] = useState("password123");
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      setSession(data.token, data.user);
      navigate("/");
    },
  });

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">sāhāyyam</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">College intelligence for first-gen students</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in with a seeded demo account and explore the feed, nudges, verification, and AI Ask.
          </p>
        </div>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            login.mutate({ email, password });
          }}
        >
          <Field label="Email">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          {login.error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{login.error.message}</p> : null}
          <Button disabled={login.isPending}>{login.isPending ? "Signing in..." : "Sign in"}</Button>
        </form>
        <div className="mt-5 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <strong>Demo accounts</strong>
          <span>Fresher: fresher@sahayyam.edu</span>
          <span>Senior: senior@sahayyam.edu</span>
          <span>Admin: admin@sahayyam.edu</span>
          <span>Password: password123</span>
        </div>
      </Card>
    </main>
  );
}

function AppShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const me = useBootstrapUser();

  if (me.isLoading) return <div className="grid min-h-screen place-items-center text-sm font-bold text-slate-600">Loading sāhāyyam...</div>;
  if (!user && me.isError) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">sāhāyyam</p>
            <h1 className="text-lg font-black text-slate-950">Invisible Curriculum Radar</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <p className="font-extrabold text-slate-900">{user?.name}</p>
              <p className="text-slate-500">{user?.role} · {user?.branch?.code}</p>
            </div>
            <GhostButton
              onClick={() => {
                logout();
                queryClient.clear();
              }}
            >
              <LogOut className="h-4 w-4" /> Logout
            </GhostButton>
          </div>
        </div>
      </header>
      <Dashboard />
    </div>
  );
}

function Dashboard() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "submit" | "verify" | "ask">("feed");
  const user = useAuthStore((state) => state.user);

  const feed = useQuery({ queryKey: ["feed", search], queryFn: () => api.feed({ q: search || undefined }) });
  const pending = useQuery({ queryKey: ["pending"], queryFn: () => api.feed({ status: "PENDING" }) });
  const nudges = useQuery({ queryKey: ["nudges"], queryFn: api.nudges });

  const tips = feed.data?.tips ?? [];
  const critical = tips.filter((tip) => tip.urgency === "CRITICAL").length;
  const verified = tips.filter((tip) => tip.status === "VERIFIED").length;
  const navItems: Array<[typeof activeTab, string, LucideIcon]> = [
    ["feed", "Feed", Search],
    ["submit", "Submit", PlusCircle],
    ["verify", "Verify", ShieldCheck],
    ["ask", "AI Ask", Bot],
  ];

  return (
    <main className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="grid gap-4 self-start lg:sticky lg:top-20">
        <Card>
          <p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Profile</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{user?.college?.name}</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <p><strong>Branch:</strong> {user?.branch?.name}</p>
            <p><strong>Semester:</strong> {user?.semester ?? "N/A"}</p>
            <p><strong>Credibility:</strong> {user?.credibilityScore}</p>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Today</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric label="Tips" value={tips.length} />
            <Metric label="Critical" value={critical} />
            <Metric label="Verified" value={verified} />
          </div>
        </Card>
        <nav className="grid gap-2">
          {navItems.map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-extrabold transition ${
                activeTab === key ? "bg-slate-950 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="grid gap-4">
        <Card className="bg-slate-950 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-teal-300"></p>
              <h2 className="mt-1 text-2xl font-black">Verified senior intelligence before the window closes</h2>
            </div>
            <div className="relative min-w-100 md:w-100">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search scholarships, faculty, placements..." className="pl-9" />
            </div>
          </div>
        </Card>

        <NudgeStrip nudges={nudges.data?.nudges ?? []} />

        {activeTab === "feed" ? <FeedPanel tips={tips} isLoading={feed.isLoading} /> : null}
        {activeTab === "submit" ? <SubmitTipPanel /> : null}
        {activeTab === "verify" ? <VerifyPanel tips={pending.data?.tips ?? []} /> : null}
        {activeTab === "ask" ? <AskPanel /> : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2 text-center">
      <p className="text-xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function NudgeStrip({ nudges }: { nudges: Array<{ id: string; title: string; message: string; urgency: Urgency; signalRank: number }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {nudges.slice(0, 3).map((nudge) => (
        <Card key={nudge.id} className="border-l-4 border-l-teal-700">
          <div className="flex items-center justify-between gap-2">
            <Pill tone={urgencyTone(nudge.urgency)}>{nudge.urgency}</Pill>
            <Pill tone="violet">{nudge.signalRank} rank</Pill>
          </div>
          <h3 className="mt-3 font-black text-slate-950">{nudge.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{nudge.message}</p>
        </Card>
      ))}
      {nudges.length === 0 ? (
        <Card className="md:col-span-3">
          <p className="text-sm font-bold text-slate-600">No urgent nudges yet.</p>
        </Card>
      ) : null}
    </div>
  );
}

function FeedPanel({ tips, isLoading }: { tips: Tip[]; isLoading: boolean }) {
  if (isLoading) return <Card>Loading feed...</Card>;
  return (
    <div className="grid gap-3">
      {tips.map((tip) => (
        <TipCard key={tip.id} tip={tip} />
      ))}
    </div>
  );
}

function TipCard({ tip }: { tip: Tip }) {
  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={urgencyTone(tip.urgency)}>{tip.urgency}</Pill>
            <Pill tone={tip.status === "VERIFIED" ? "green" : "amber"}>{tip.status}</Pill>
            <Pill>{tip.category.replaceAll("_", " ")}</Pill>
            <Pill>{tip.branch?.code ?? "ALL"}</Pill>
          </div>
          <h3 className="mt-3 text-lg font-black text-slate-950">{tip.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{tip.summary ?? tip.body}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            <span>{tip.author.name}</span>
            <span>Deadline: {formatDate(tip.deadline)}</span>
            <span>{tip.verifications.length} peer signals</span>
          </div>
        </div>
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-teal-50 text-xl font-black text-teal-800">
          {tip.signalRank}
        </div>
      </div>
    </Card>
  );
}

function SubmitTipPanel() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [urgency, setUrgency] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [actionSteps, setActionSteps] = useState("");

  const enrich = useMutation({
    mutationFn: () => api.enrichTip({ title, rawText: body }),
    onSuccess: (data) => {
      setCategory(data.category);
      setUrgency(data.urgency);
      setActionSteps(data.actionSteps.join("\n"));
      if (data.deadline) setDeadline(data.deadline.slice(0, 10));
    },
  });

  const create = useMutation({
    mutationFn: () =>
      api.createTip({
        title,
        body,
        category,
        urgency,
        deadline: deadline || undefined,
        actionSteps: actionSteps.split("\n").map((step) => step.trim()).filter(Boolean),
        evidenceQuality: "DIRECT_EXPERIENCE",
        sourceConfidence: 75,
        useAiEnrichment: false,
      }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setActionSteps("");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["nudges"] });
    },
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Senior desk</p>
          <h2 className="text-xl font-black text-slate-950">Submit structured intelligence</h2>
        </div>
        <GhostButton disabled={!body || enrich.isPending} onClick={() => enrich.mutate()}>
          <Sparkles className="h-4 w-4" /> AI tag
        </GhostButton>
      </div>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <Field label="Title"><Input value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
        <Field label="Context"><Textarea value={body} onChange={(event) => setBody(event.target.value)} required /></Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Category">
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              {["SCHOLARSHIP", "FACULTY", "PLACEMENT", "CLUB", "DEPARTMENT_NORM", "ACADEMIC", "OTHER"].map((value) => <option key={value}>{value}</option>)}
            </Select>
          </Field>
          <Field label="Urgency">
            <Select value={urgency} onChange={(event) => setUrgency(event.target.value)}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => <option key={value}>{value}</option>)}
            </Select>
          </Field>
          <Field label="Deadline"><Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field>
        </div>
        <Field label="Action steps"><Textarea value={actionSteps} onChange={(event) => setActionSteps(event.target.value)} placeholder="One action per line" /></Field>
        {create.error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{create.error.message}</p> : null}
        <Button disabled={create.isPending}>{create.isPending ? "Submitting..." : "Submit tip"}</Button>
      </form>
    </Card>
  );
}

function VerifyPanel({ tips }: { tips: Tip[] }) {
  const queryClient = useQueryClient();
  const verify = useMutation({
    mutationFn: (id: string) => api.verifyTip(id, "Confirmed from frontend verification queue."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
  const dispute = useMutation({
    mutationFn: (id: string) => api.disputeTip(id, "Needs more context from frontend verification queue."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return (
    <div className="grid gap-3">
      {tips.map((tip) => (
        <Card key={tip.id}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <Pill tone="amber">{tip.status}</Pill>
              <h3 className="mt-3 text-lg font-black text-slate-950">{tip.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tip.body}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => verify.mutate(tip.id)}><CheckCircle2 className="h-4 w-4" /> Verify</Button>
              <GhostButton onClick={() => dispute.mutate(tip.id)}><AlertTriangle className="h-4 w-4" /> Dispute</GhostButton>
            </div>
          </div>
        </Card>
      ))}
      {tips.length === 0 ? <Card><p className="text-sm font-bold text-slate-600">No pending tips for your branch right now.</p></Card> : null}
    </div>
  );
}

function AskPanel() {
  const [question, setQuestion] = useState("What scholarship tasks should I do this week?");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Tip[]>([]);

  const ask = useMutation({
    mutationFn: api.ask,
    onSuccess: (data) => {
      setAnswer(data.answer);
      setSources(data.sources);
    },
  });

  return (
    <Card>
      <div className="mb-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">AI Ask</p>
        <h2 className="text-xl font-black text-slate-950">Ask your college intelligence base</h2>
      </div>
      <form
        className="flex flex-col gap-3 md:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          ask.mutate(question);
        }}
      >
        <Input value={question} onChange={(event) => setQuestion(event.target.value)} />
        <Button disabled={ask.isPending}><Send className="h-4 w-4" /> Ask</Button>
      </form>
      {answer ? (
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{answer}</p>
        </div>
      ) : null}
      {sources.length ? (
        <div className="mt-5 grid gap-2">
          <p className="text-sm font-black text-slate-900">Sources</p>
          {sources.slice(0, 4).map((tip) => (
            <div key={tip.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <Bell className="mr-2 inline h-4 w-4 text-teal-700" />
              <strong>{tip.title}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function App() {
  const token = useAuthStore((state) => state.token);
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={token ? <AppShell /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

import { useState } from "react";
import {
  Sparkles,
  BookOpen,
  FileText,
  ClipboardList,
  Copy,
  RefreshCw,
  ChevronDown,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { runTool, submitQuizScore } from "@/lib/api";
import { getCurrentUserId } from "@/lib/user";
import { useToast } from "@/hooks/use-toast";
import { exportToHTML, ExportType } from "@/lib/export";
import { Download, PlayCircle, Trophy } from "lucide-react";

async function fetchWikiImages(query: string): Promise<{ title: string; thumb: string; page: string }[]> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrlimit", "12");
  url.searchParams.set("prop", "pageimages|info");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "400");
  url.searchParams.set("inprop", "url");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  const res = await fetch(url.toString());
  const data = await res.json();
  const pages = Object.values(data?.query?.pages ?? {}) as any[];
  return pages
    .filter((p: any) => p.thumbnail?.source)
    .map((p: any) => ({
      title: p.title,
      thumb: p.thumbnail.source,
      page: p.fullurl || `https://en.wikipedia.org/?curid=${p.pageid}`,
    }));
}

const tools = [
  {
    id: "quiz",
    label: "Quiz Generator",
    shortLabel: "Quiz",
    icon: ClipboardList,
    description: "Test your knowledge",
    gradient: "from-violet-500 to-purple-600",
    softBg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
    activeShadow: "shadow-violet-200 dark:shadow-violet-900/50",
  },
  {
    id: "notes",
    label: "Notes Generator",
    shortLabel: "Notes",
    icon: FileText,
    description: "Structured study notes",
    gradient: "from-blue-500 to-sky-600",
    softBg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    activeShadow: "shadow-blue-200 dark:shadow-blue-900/50",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    shortLabel: "Cards",
    icon: RefreshCw,
    description: "Quick memory recall",
    gradient: "from-amber-500 to-orange-600",
    softBg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    activeShadow: "shadow-amber-200 dark:shadow-amber-900/50",
  },
  {
    id: "lesson",
    label: "Lesson Planner",
    shortLabel: "Lesson",
    icon: BookOpen,
    description: "Plan teaching sessions",
    gradient: "from-emerald-500 to-green-600",
    softBg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    activeShadow: "shadow-emerald-200 dark:shadow-emerald-900/50",
  },
];

const difficultyConfig = {
  easy: { label: "Easy", color: "text-emerald-600", activeBg: "bg-emerald-500", activeText: "text-white" },
  medium: { label: "Medium", color: "text-amber-600", activeBg: "bg-amber-500", activeText: "text-white" },
  hard: { label: "Hard", color: "text-red-600", activeBg: "bg-red-500", activeText: "text-white" },
};

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState("quiz");
  const [topic, setTopic] = useState("Electricity");
  const [grade, setGrade] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [extraContext, setExtraContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [isTakingTest, setIsTakingTest] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [testScore, setTestScore] = useState<{ correct: number; total: number } | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  const [notesImages, setNotesImages] = useState<{ title: string; thumb: string; page: string }[]>([]);
  const [loadingNotesImages, setLoadingNotesImages] = useState(false);

  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const userId = getCurrentUserId();
  const { toast } = useToast();

  const activeTool_ = tools.find((t) => t.id === activeTool)!;

  const handleGenerate = async () => {
    if (!topic) {
      toast({ title: "Topic required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult(null);
    setNotesImages([]);
    setFlippedCards({});
    try {
      const response = await runTool({
        user_id: userId || "unknown",
        tool_name: activeTool,
        topic,
        grade,
        difficulty,
        extra_context: extraContext,
        num_questions: numQuestions,
      });
      if (response && response.data) {
        setResult(response.data);
        toast({ title: "Content Generated!", description: "AI has successfully generated your content." });
        if (activeTool === "notes") {
          setLoadingNotesImages(true);
          fetchWikiImages(topic)
            .then(setNotesImages)
            .catch(() => setNotesImages([]))
            .finally(() => setLoadingNotesImages(false));
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.response?.data?.detail || error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsTakingTest(false);
      setTestScore(null);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
    }
  };

  const handleExport = () => {
    if (!result) return;
    exportToHTML(activeTool as ExportType, result, topic);
    toast({ title: "Resource Exported", description: `Your ${activeTool} has been downloaded as a styled HTML file.` });
  };

  const handleQuizAnswer = (answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  const handleQuizSubmit = async () => {
    const questions = result.questions || result.quiz_questions || [];
    let correct = 0;
    questions.forEach((q: any, i: number) => {
      if (selectedAnswers[i] === (q.correct_answer || q.answer)) correct++;
    });
    setTestScore({ correct, total: questions.length });
    setIsSubmittingScore(true);
    try {
      await submitQuizScore({
        user_id: userId || "unknown",
        topic,
        total_questions: questions.length,
        correct_answers: correct,
      });
      toast({ title: "Score Synchronized!", description: "Your performance data has been updated." });
    } catch {
      toast({ title: "Cloud Sync Failed", description: "Score recorded locally, but couldn't reach the server.", variant: "destructive" });
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast({ title: "Copied to clipboard" });
  };

  const toggleFlip = (idx: number) => {
    setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const quizQuestions = result?.questions || result?.quiz_questions || [];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">AI Study Tools</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Generate personalized study materials powered by AI — quizzes, notes, flashcards & lesson plans.
          </p>
        </div>

        {/* Tool Selector — full-width card grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 animate-fade-in">
          {tools.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveTool(tool.id); setResult(null); setFlippedCards({}); }}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                  isActive
                    ? `${tool.softBg} ${tool.border} shadow-lg ${tool.activeShadow}`
                    : "bg-card border-border hover:border-muted-foreground/30 hover:bg-muted/40"
                )}
              >
                <div className={cn("p-2 rounded-xl", isActive ? tool.iconBg : "bg-muted")}>
                  <tool.icon className={cn("w-4 h-4", isActive ? tool.iconColor : "text-muted-foreground")} />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>
                    <span className="hidden sm:inline">{tool.label}</span>
                    <span className="sm:hidden">{tool.shortLabel}</span>
                  </p>
                  <p className="text-xs text-muted-foreground/70 hidden md:block">{tool.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="glass-card p-6 animate-fade-in space-y-5" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg", activeTool_.iconBg)}>
                <activeTool_.icon className={cn("w-3.5 h-3.5", activeTool_.iconColor)} />
              </div>
              <h3 className="font-semibold text-foreground">Configuration</h3>
            </div>

            {/* Topic */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-sans placeholder:text-muted-foreground/50"
                placeholder="e.g. Photosynthesis, World War II, Algebra..."
              />
            </div>

            {/* Class + Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Class</label>
                <div className="relative">
                  <select
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value))}
                    className="w-full appearance-none px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>Class {g}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Difficulty</label>
                <div className="flex rounded-xl overflow-hidden border border-border bg-muted/50">
                  {(["easy", "medium", "hard"] as const).map((d) => {
                    const cfg = difficultyConfig[d];
                    const isActive = difficulty === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "flex-1 py-3 text-xs font-semibold transition-all",
                          isActive ? `${cfg.activeBg} ${cfg.activeText}` : `${cfg.color} hover:bg-muted`
                        )}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Question count — quiz only */}
            {activeTool === "quiz" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  No. of Questions
                </label>
                <div className="flex rounded-xl overflow-hidden border border-border bg-muted/50">
                  {[5, 10, 15, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumQuestions(n)}
                      className={cn(
                        "flex-1 py-3 text-xs font-semibold transition-all",
                        numQuestions === n
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extra context */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Additional Context <span className="normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all font-sans placeholder:text-muted-foreground/50"
                placeholder="Specific chapters, focus areas, exam board..."
              />
            </div>

            <Button
              variant="premium"
              size="lg"
              className="w-full h-12 rounded-xl font-semibold"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Generating..." : `Generate ${activeTool_.label}`}
            </Button>
          </div>

          {/* Output Panel */}
          <div
            className="glass-card p-6 animate-fade-in min-h-[480px] flex flex-col"
            style={{ animationDelay: "200ms" }}
          >
            {/* Output header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-foreground">Output</h3>
              {result && (
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="hidden md:flex h-8 px-3 text-xs">
                    <Copy className="w-3 h-3 mr-1.5" /> Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="h-8 px-3 text-xs bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary"
                  >
                    <Download className="w-3 h-3 mr-1.5" /> Export
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleGenerate} className="h-8 w-8 p-0">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* States */}
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                  <div className={cn("absolute inset-2 rounded-full", activeTool_.softBg)} />
                  <activeTool_.icon className={cn("absolute inset-0 m-auto w-5 h-5", activeTool_.iconColor)} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">AI is generating...</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">"Good things take time (and tokens)"</p>
                </div>
              </div>
            ) : !result ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className={cn("p-5 rounded-2xl", activeTool_.softBg)}>
                  <activeTool_.icon className={cn("w-8 h-8", activeTool_.iconColor)} />
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Ready to generate</p>
                  <p className="text-sm text-muted-foreground">Configure your settings and hit Generate.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 animate-fade-in custom-scrollbar">

                {/* ── QUIZ: preview mode ── */}
                {activeTool === "quiz" && !isTakingTest && !testScore && (
                  <div className="space-y-4">
                    <div className={cn("p-5 rounded-2xl border text-center", activeTool_.softBg, activeTool_.border)}>
                      <div className={cn("w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center", activeTool_.iconBg)}>
                        <Trophy className={cn("w-7 h-7", activeTool_.iconColor)} />
                      </div>
                      <h4 className="text-lg font-bold mb-1">{quizQuestions.length} Questions Ready</h4>
                      <p className="text-sm text-muted-foreground mb-4">Topic: <span className="font-medium text-foreground">{topic}</span></p>
                      <Button
                        size="lg"
                        className={cn("w-full h-12 rounded-xl font-bold bg-gradient-to-r", activeTool_.gradient, "text-white border-0 shadow-lg")}
                        onClick={() => setIsTakingTest(true)}
                      >
                        <PlayCircle className="mr-2 w-5 h-5" /> Start Live Test
                      </Button>
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 pt-2">
                      Question Preview
                    </p>

                    {quizQuestions.map((q: any, i: number) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                        <p className="text-sm font-semibold flex gap-2">
                          <span className={cn("font-bold shrink-0", activeTool_.iconColor)}>Q{i + 1}.</span>
                          {q.question || q.q}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt: string, oi: number) => (
                            <div
                              key={oi}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs bg-card border-border/50 text-foreground/70"
                            >
                              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 bg-muted text-muted-foreground">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── QUIZ: test mode ── */}
                {activeTool === "quiz" && isTakingTest && !testScore && (
                  <div className="space-y-5 flex flex-col h-full">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn("font-bold uppercase tracking-widest", activeTool_.iconColor)}>
                          Question {currentQuestionIndex + 1} / {quizQuestions.length}
                        </span>
                        <span className="text-muted-foreground">
                          {Object.keys(selectedAnswers).length} answered
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500 bg-gradient-to-r", activeTool_.gradient)}
                          style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-card rounded-2xl border shadow-sm flex-1 flex flex-col justify-center">
                      <p className="text-base font-bold text-foreground text-center leading-relaxed mb-6">
                        {quizQuestions[currentQuestionIndex]?.question || quizQuestions[currentQuestionIndex]?.q}
                      </p>
                      <div className="space-y-2.5">
                        {(quizQuestions[currentQuestionIndex]?.options || []).map((opt: string, oi: number) => (
                          <button
                            key={oi}
                            onClick={() => handleQuizAnswer(opt)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all text-left",
                              selectedAnswers[currentQuestionIndex] === opt
                                ? `${activeTool_.softBg} ${activeTool_.border} text-foreground`
                                : "border-border hover:border-muted-foreground/40 hover:bg-muted/30 text-foreground/70"
                            )}
                          >
                            <span className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0",
                              selectedAnswers[currentQuestionIndex] === opt
                                ? `bg-gradient-to-br ${activeTool_.gradient} text-white`
                                : "bg-muted text-muted-foreground"
                            )}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Button
                        variant="ghost"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex((i) => i - 1)}
                        className="rounded-xl"
                      >
                        Previous
                      </Button>
                      {currentQuestionIndex < quizQuestions.length - 1 ? (
                        <Button
                          className="rounded-xl px-6"
                          onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                          disabled={!selectedAnswers[currentQuestionIndex]}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          variant="premium"
                          className="rounded-xl px-6"
                          onClick={handleQuizSubmit}
                          disabled={!selectedAnswers[currentQuestionIndex] || isSubmittingScore}
                        >
                          {isSubmittingScore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Finish & Submit
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── QUIZ: score screen ── */}
                {activeTool === "quiz" && testScore && (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 animate-fade-in text-center">
                    <div className="relative mb-6">
                      <div className={cn("w-36 h-36 rounded-full border-8 flex items-center justify-center", activeTool_.softBg, activeTool_.border)}>
                        <div>
                          <p className={cn("text-4xl font-black", activeTool_.iconColor)}>
                            {((testScore.correct / testScore.total) * 100).toFixed(0)}%
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mastery</p>
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 p-2.5 bg-card rounded-2xl shadow-lg border">
                        <Trophy className="w-7 h-7 text-amber-500 fill-amber-100" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-1">
                      {testScore.correct === testScore.total ? "Perfect Score!" : testScore.correct >= testScore.total / 2 ? "Great Work!" : "Keep Practicing!"}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-8">
                      <span className="font-bold text-foreground">{testScore.correct}/{testScore.total}</span> correct on <strong>{topic}</strong>
                    </p>

                    <div className="w-full space-y-3">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl h-11 font-semibold"
                        onClick={() => { setIsTakingTest(false); setTestScore(null); setSelectedAnswers({}); setCurrentQuestionIndex(0); }}
                      >
                        Review Answers
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={handleGenerate}>
                        Generate New Variant
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── NOTES ── */}
                {activeTool === "notes" && (
                  <div className="space-y-5">
                    <div className={cn("p-4 rounded-xl border", activeTool_.softBg, activeTool_.border)}>
                      <h4 className="text-base font-bold text-foreground">{result.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{result.summary}</p>
                    </div>

                    {(loadingNotesImages || notesImages.length > 0) && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Related Images</p>
                        {loadingNotesImages ? (
                          <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="aspect-video rounded-lg bg-muted animate-pulse" />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {notesImages.map((img, i) => (
                              <a
                                key={i}
                                href={img.page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block rounded-lg overflow-hidden border border-border/60 hover:border-primary/40 transition-all hover:shadow-md"
                                title={img.title}
                              >
                                <div className="aspect-video bg-muted overflow-hidden">
                                  <img src={img.thumb} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                <p className="px-2 py-1 text-[10px] text-muted-foreground truncate">{img.title}</p>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {result.sections?.map((section: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-primary/20 pl-4 space-y-1.5">
                        <h5 className={cn("text-sm font-bold", activeTool_.iconColor)}>{section.subtopic}</h5>
                        <p className="text-sm text-foreground/85 leading-relaxed">{section.content}</p>
                        {section.key_points?.length > 0 && (
                          <ul className="space-y-1 pt-1">
                            {section.key_points.map((point: string, pIdx: number) => (
                              <li key={pIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className={cn("w-1 h-1 rounded-full mt-1.5 shrink-0 bg-primary")} />
                                {point}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── LESSON PLANNER ── */}
                {activeTool === "lesson" && (
                  <div className="space-y-5">
                    <div className={cn("p-4 rounded-xl border", activeTool_.softBg, activeTool_.border)}>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", activeTool_.iconColor)}>Objective</p>
                      <p className="text-sm font-medium text-foreground">{result.objective}</p>
                    </div>

                    <div className="space-y-3">
                      {result.phases?.map((phase: any, i: number) => (
                        <div key={i} className="relative pl-6">
                          <div className={cn("absolute left-0 top-1 w-3 h-3 rounded-full border-2 border-card bg-gradient-to-br", activeTool_.gradient)} />
                          {i < result.phases.length - 1 && (
                            <div className="absolute left-[5px] top-4 bottom-0 w-px bg-border" />
                          )}
                          <div className="p-3 bg-card rounded-xl border border-border/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-foreground">{phase.phase_name}</p>
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", activeTool_.iconBg, activeTool_.iconColor)}>
                                {phase.duration_minutes} min
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {phase.activities?.map((act: string, aIdx: number) => (
                                <li key={aIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                  {act}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── FLASHCARDS ── */}
                {activeTool === "flashcards" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center">Click a card to reveal the answer</p>
                    {(result.flashcards || []).map((fc: any, idx: number) => {
                      const isFlipped = flippedCards[idx];
                      return (
                        <div
                          key={idx}
                          className="cursor-pointer select-none"
                          style={{ perspective: "1000px" }}
                          onClick={() => toggleFlip(idx)}
                        >
                          <div
                            className="relative transition-transform duration-500"
                            style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                          >
                            {/* Front */}
                            <div
                              className={cn("p-5 rounded-2xl border-2 text-center space-y-2 min-h-[100px] flex flex-col justify-center", activeTool_.softBg, activeTool_.border)}
                              style={{ backfaceVisibility: "hidden" }}
                            >
                              <p className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1", activeTool_.iconColor)}>
                                <span className="opacity-60">Card {idx + 1}</span>
                                <span className="opacity-30">·</span>
                                <span>Tap to flip</span>
                              </p>
                              <p className="text-sm font-semibold text-foreground">{fc.front}</p>
                            </div>
                            {/* Back */}
                            <div
                              className="absolute inset-0 p-5 rounded-2xl border-2 border-border bg-card text-center space-y-2 flex flex-col justify-center min-h-[100px]"
                              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                            >
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Answer
                              </p>
                              <p className="text-sm text-foreground/85 leading-relaxed">{fc.back}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

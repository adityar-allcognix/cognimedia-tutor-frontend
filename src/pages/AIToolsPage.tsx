import { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  FileText,
  ClipboardList,
  Copy,
  RefreshCw,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { runTool, submitQuizScore } from "@/lib/api";
import { getCurrentUserId } from "@/lib/user";
import { useToast } from "@/hooks/use-toast";
import { exportToHTML, ExportType } from "@/lib/export";
import { Download, PlayCircle, Trophy, BarChart3, AlertCircle } from "lucide-react";

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
  { id: "quiz", label: "Quiz Generator", icon: ClipboardList },
  { id: "notes", label: "Notes Generator", icon: FileText },
  { id: "flashcards", label: "Flashcards", icon: RefreshCw },
  { id: "lesson", label: "Lesson Planner", icon: BookOpen },
];

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState("quiz");
  const [topic, setTopic] = useState("Electricity");
  const [grade, setGrade] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [extraContext, setExtraContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Quiz Session State
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [testScore, setTestScore] = useState<{ correct: number, total: number } | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  const [notesImages, setNotesImages] = useState<{ title: string; thumb: string; page: string }[]>([]);
  const [loadingNotesImages, setLoadingNotesImages] = useState(false);

  const userId = getCurrentUserId();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic) {
      toast({ title: "Topic required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setNotesImages([]);
    try {
      const response = await runTool({
        user_id: userId || 'unknown',
        tool_name: activeTool,
        topic,
        grade,
        difficulty,
        extra_context: extraContext,
        num_questions: 5
      });

      // The backend returns ToolExecutionResponse which has 'data'
      if (response && response.data) {
        setResult(response.data);
        toast({ title: "Content Generated!", description: "AI has successfully generated your content." });
        if (activeTool === "notes") {
          setNotesImages([]);
          setLoadingNotesImages(true);
          fetchWikiImages(topic).then(setNotesImages).catch(() => setNotesImages([])).finally(() => setLoadingNotesImages(false));
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      toast({
        title: "Generation failed",
        description: error.response?.data?.detail || error.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsTakingTest(false);
      setTestScore(null);
      setSelectedAnswers({});
    }
  };

  const handleExport = () => {
    if (!result) return;
    exportToHTML(activeTool as ExportType, result, topic);
    toast({ title: "Resource Exported", description: `Your ${activeTool} has been downloaded as a styled HTML file.` });
  };

  const handleQuizAnswer = (answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  const handleQuizSubmit = async () => {
    const questions = result.questions || result.quiz_questions || [];
    let correct = 0;

    questions.forEach((q: any, i: number) => {
      if (selectedAnswers[i] === (q.correct_answer || q.answer)) {
        correct++;
      }
    });

    setTestScore({ correct, total: questions.length });
    setIsSubmittingScore(true);

    try {
      await submitQuizScore({
        user_id: userId || 'unknown',
        topic,
        total_questions: questions.length,
        correct_answers: correct
      });
      toast({ title: "Score Synchronized!", description: "Your performance data has been updated." });
    } catch (err) {
      toast({ title: "Cloud Sync Failed", description: "Score recorded locally, but couldn't reach the server.", variant: "destructive" });
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast({ title: "Copied to clipboard" });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">AI Tools</h1>
          </div>
          <p className="text-muted-foreground">Generate quizzes, notes, and lesson plans powered by AI.</p>
        </div>

        {/* Tool Selector */}
        <div className="flex gap-2 p-1 bg-muted/60 rounded-xl mb-8 w-fit animate-fade-in text-balance">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResult(null); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTool === tool.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tool.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tool.label}</span>
              <span className="sm:hidden">{tool.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h3 className="font-semibold text-foreground mb-4">Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-sans"
                  placeholder="Enter topic..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Class</label>
                  <div className="relative">
                    <select
                      value={grade}
                      onChange={(e) => setGrade(parseInt(e.target.value))}
                      className="w-full appearance-none px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Class {g}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Difficulty</label>
                  <div className="relative">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Additional Context</label>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all font-sans"
                  placeholder="Any specific focus areas..."
                />
              </div>
              <Button
                variant="premium"
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isLoading ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
          </div>

          {/* Output */}
          <div className="glass-card p-6 animate-fade-in min-h-[400px] flex flex-col" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Output</h3>
              {result && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="hidden md:flex"><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy</Button>
                  <Button variant="outline" size="sm" onClick={handleExport} className="bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleGenerate}><RefreshCw className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="space-y-1">
                  <p className="font-medium">AI is thinking...</p>
                  <p className="text-xs text-muted-foreground italic">"Good things take time (and tokens)"</p>
                </div>
              </div>
            ) : !result ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="w-10 h-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">Configure and generate to see results here.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 animate-fade-in custom-scrollbar">
                {activeTool === "quiz" && !isTakingTest && !testScore && (
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-[2rem] border border-primary/10 text-center mb-6">
                      <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
                      <h4 className="text-xl font-bold mb-2">Challenge Mode Ready</h4>
                      <p className="text-sm text-muted-foreground mb-6">Generated {(result.questions || result.quiz_questions || []).length} expert questions on {topic}.</p>
                      <Button size="lg" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" onClick={() => setIsTakingTest(true)}>
                        <PlayCircle className="mr-3 w-6 h-6" /> Start Live Test
                      </Button>
                    </div>

                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 border-b pb-2 px-1">Answer Preview (Instructor View)</p>

                    {(result.questions || result.quiz_questions || []).map((q: any, i: number) => (
                      <div key={i} className="p-4 bg-muted/40 rounded-xl border border-border/50">
                        <p className="text-sm font-semibold text-foreground mb-3 flex items-start gap-2">
                          <span className="text-primary font-bold shrink-0">Q{i + 1}.</span> {q.question || q.q}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {(q.options || []).map((opt: string, oi: number) => (
                            <div key={oi} className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border/50 text-xs text-foreground/80">
                              <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                          <p className="text-xs text-success font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Correct: {q.correct_answer || q.answer}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTool === "quiz" && isTakingTest && !testScore && (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Question {currentQuestionIndex + 1} of {(result.questions || result.quiz_questions || []).length}</span>
                      <div className="flex h-2 w-32 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / (result.questions || result.quiz_questions || []).length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-8 bg-card rounded-[2.5rem] border shadow-sm flex-1 flex flex-col justify-center">
                      <p className="text-xl font-bold text-slate-800 text-center leading-relaxed mb-10">
                        {(result.questions || result.quiz_questions || [])[currentQuestionIndex].question || (result.questions || result.quiz_questions || [])[currentQuestionIndex].q}
                      </p>

                      <div className="grid grid-cols-1 gap-3">
                        {((result.questions || result.quiz_questions || [])[currentQuestionIndex].options || []).map((opt: string, oi: number) => (
                          <button
                            key={oi}
                            onClick={() => handleQuizAnswer(opt)}
                            className={cn(
                              "flex items-center gap-4 px-6 py-4 rounded-2xl border-2 text-sm font-medium transition-all group relative",
                              selectedAnswers[currentQuestionIndex] === opt
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <span className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0",
                              selectedAnswers[currentQuestionIndex] === opt ? "bg-primary text-white" : "bg-slate-100 group-hover:bg-blue-100"
                            )}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-auto">
                      <Button
                        variant="ghost"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(i => i - 1)}
                        className="rounded-xl"
                      >
                        Previous
                      </Button>

                      {currentQuestionIndex < (result.questions || result.quiz_questions || []).length - 1 ? (
                        <Button
                          className="rounded-xl px-8 h-12 h-bold"
                          onClick={() => setCurrentQuestionIndex(i => i + 1)}
                          disabled={!selectedAnswers[currentQuestionIndex]}
                        >
                          Next Question
                        </Button>
                      ) : (
                        <Button
                          variant="premium"
                          className="rounded-xl px-8 h-12 h-bold"
                          onClick={handleQuizSubmit}
                          disabled={!selectedAnswers[currentQuestionIndex] || isSubmittingScore}
                        >
                          {isSubmittingScore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Finish & Submit"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {activeTool === "quiz" && testScore && (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 animate-fade-in">
                    <div className="relative mb-8">
                      <div className="w-40 h-40 rounded-full border-[10px] border-emerald-50 flex items-center justify-center relative z-10">
                        <div className="text-center">
                          <p className="text-4xl font-black text-emerald-600">{(testScore.correct / testScore.total * 100).toFixed(0)}%</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-emerald-100/30 blur-2xl rounded-full" />
                      <div className="absolute -top-2 -right-2 p-3 bg-white rounded-2xl shadow-xl border border-emerald-50">
                        <Trophy className="w-8 h-8 text-amber-500 fill-amber-100" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Excellent Work!</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-8">
                      You answered <span className="font-bold text-slate-900">{testScore.correct} out of {testScore.total}</span> questions correctly for <strong>{topic}</strong>.
                    </p>

                    <div className="w-full space-y-4">
                      <Button
                        variant="outline"
                        className="w-full rounded-2xl h-14 font-bold border-2"
                        onClick={() => {
                          setIsTakingTest(false);
                          setTestScore(null);
                          setSelectedAnswers({});
                          setCurrentQuestionIndex(0);
                        }}
                      >
                        Review Answers
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={handleGenerate}
                      >
                        Generate New Variant
                      </Button>
                    </div>
                  </div>
                )}

                {activeTool === "notes" && (
                  <div className="space-y-5">
                    <h4 className="text-lg font-bold text-foreground border-b pb-2">{result.title}</h4>
                    <p className="text-sm text-foreground/80 italic">{result.summary}</p>

                    {/* Related images */}
                    {(loadingNotesImages || notesImages.length > 0) && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Related Images</p>
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
                                  <img
                                    src={img.thumb}
                                    alt={img.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <p className="px-2 py-1 text-[10px] text-muted-foreground truncate">{img.title}</p>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {result.sections?.map((section: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <h5 className="text-sm font-bold text-primary">{section.subtopic}</h5>
                        <p className="text-sm text-foreground/90 leading-relaxed">{section.content}</p>
                        <ul className="space-y-1 mt-2">
                          {section.key_points?.map((point: string, pIdx: number) => (
                            <li key={pIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {activeTool === "lesson" && (
                  <div className="space-y-6">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">OBJECTIVE</p>
                      <p className="text-sm font-medium">{result.objective}</p>
                    </div>
                    <div className="space-y-4">
                      {result.phases?.map((phase: any, i: number) => (
                        <div key={i} className="relative pl-6 border-l-2 border-primary/20">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-card" />
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-foreground">{phase.phase_name}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-muted rounded-full">{phase.duration_minutes} min</span>
                          </div>
                          <ul className="space-y-1.5">
                            {phase.activities?.map((act: string, aIdx: number) => (
                              <li key={aIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                {act}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTool === "flashcards" && (
                  <div className="grid grid-cols-1 gap-4">
                    {(result.flashcards || []).map((fc: any, idx: number) => (
                      <div key={idx} className="p-4 bg-muted/40 rounded-xl border border-border/50 text-center space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Card {idx + 1}</p>
                        <div className="p-4 bg-card border rounded-xl shadow-sm">
                          <p className="text-sm font-bold">{fc.front}</p>
                        </div>
                        <div className="p-4 bg-neutral-50 border border-dashed rounded-xl">
                          <p className="text-sm italic text-muted-foreground">{fc.back}</p>
                        </div>
                      </div>
                    ))}
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

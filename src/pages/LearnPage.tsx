import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getSyllabus, learnChapterTopic, getAvailableSubjects as getSubjects } from "@/lib/api";
import { getCurrentUserId, getUser } from "@/lib/user";

import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  ListChecks,
  HelpCircle,
  Loader2,
  Book,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";

// Converts \[...\] → $$...$$ and \(...\) → $...$ so remark-math can process them
function preprocessLatex(text: string): string {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_: string, m: string) => `$$${m}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_: string, m: string) => `$${m}$`);
}

const KATEX_OPTIONS = { throwOnError: false, errorColor: '#cc0000' };
const MD_PLUGINS = { remark: [remarkGfm, remarkMath], rehype: [[rehypeKatex, KATEX_OPTIONS]] as any };

const tabs = [
  { id: "explanation", label: "Explanation", icon: BookOpen },
  { id: "keypoints", label: "Key Points", icon: ListChecks },
  { id: "examples", label: "Examples", icon: Lightbulb },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
];

// Fetch Wikipedia images for a search query
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

export default function LearnPage() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("Science");
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("explanation");

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [fetchingLesson, setFetchingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Related images state
  const [images, setImages] = useState<{ title: string; thumb: string; page: string }[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const user = getUser() as any;
  const userId = getCurrentUserId() || "test-user";
  const grade = user?.grade || 10;

  // 1. Fetch Subjects
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const subData = await getSubjects(grade);
        if (subData && Array.isArray(subData) && subData.length > 0) {
          setSubjects(subData);
          if (!subData.includes(selectedSubject)) setSelectedSubject(subData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
      }
    };
    fetchStats();
  }, [grade]);

  // 2. Fetch Syllabus
  useEffect(() => {
    const fetchSyllabusData = async () => {
      try {
        setLoadingSyllabus(true);
        setError(null);
        setChapters([]);
        setLessonContent(null);

        const data = await getSyllabus(grade, selectedSubject);
        if (data && Array.isArray(data)) {
          setChapters(data);
          setActiveChapterIndex(0);
          setActiveTopicIndex(0);
        } else {
          setError(`No syllabus found for Class ${grade} ${selectedSubject}.`);
        }
      } catch (err) {
        setError("Failed to load curriculum. Please try again later.");
        console.error(err);
      } finally {
        setLoadingSyllabus(false);
      }
    };
    fetchSyllabusData();
  }, [grade, selectedSubject]);

  // 3. Fetch Lesson content
  useEffect(() => {
    const fetchTopicContent = async () => {
      if (chapters.length > 0 && chapters[activeChapterIndex]) {
        const chapter = chapters[activeChapterIndex];
        const topic = chapter.topics[activeTopicIndex];
        if (!topic) return;

        const topicStr = typeof topic === 'string' ? topic : topic.name;

        try {
          setFetchingLesson(true);
          setLessonError(null);
          setSubmitted(false);
          setSelectedAnswers({});
          setImages([]);
          setLoadingImages(true);
          fetchWikiImages(topicStr).then(setImages).catch(() => setImages([])).finally(() => setLoadingImages(false));

          const data = await learnChapterTopic({
            user_id: userId,
            grade,
            subject: selectedSubject,
            chapter_id: chapter.id,
            chapter_name: chapter.name,
            topic: topicStr,
          });

          if (data) {
            setLessonContent(data);
          } else {
            setLessonError("Could not retrieve lesson content.");
          }
        } catch (err) {
          setLessonError("AI generation failed. The topic might be too complex or the service is busy.");
          console.error(err);
        } finally {
          setFetchingLesson(false);
        }
      }
    };
    fetchTopicContent();
  }, [activeChapterIndex, activeTopicIndex, chapters, userId, grade, selectedSubject]);

  const currentChapter = chapters[activeChapterIndex];
  const currentTopic = currentChapter?.topics[activeTopicIndex];
  const topicName = typeof currentTopic === 'string' ? currentTopic : currentTopic?.name;

  return (
    <AppLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Left sidebar - chapters */}
        <div className="hidden lg:flex flex-col w-80 border-r border-border/40 bg-card/30 backdrop-blur-sm overflow-y-auto p-5">
          <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 rounded-2xl border border-primary/10">
            <GraduationCap className="w-5 h-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Curriculum</span>
              <span className="text-sm font-bold text-foreground">Class {grade} · {selectedSubject}</span>
            </div>
          </div>

          {/* Subject selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {subjects.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold transition-all truncate",
                  selectedSubject === sub
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {sub}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {loadingSyllabus ? (
              <div className="flex flex-col items-center py-10 opacity-50">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs font-medium">Crunching syllabus...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-danger-soft text-destructive text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : chapters.map((ch, ci) => (
              <div key={ci} className="mb-2">
                <button
                  onClick={() => { setActiveChapterIndex(ci); setActiveTopicIndex(0); }}
                  className={cn(
                    "w-full text-left text-[13px] font-bold px-3 py-2.5 rounded-xl transition-all duration-200",
                    activeChapterIndex === ci
                      ? "text-primary bg-primary/10"
                      : "text-foreground/70 hover:bg-muted"
                  )}
                >
                  {ch.name}
                </button>
                {activeChapterIndex === ci && (
                  <div className="ml-3 mt-1.5 space-y-0.5 animate-fade-in border-l-2 border-primary/10 pl-2">
                    {ch.topics.map((topic: any, ti: number) => {
                      const name = typeof topic === 'string' ? topic : topic.name;
                      return (
                        <button
                          key={ti}
                          onClick={() => setActiveTopicIndex(ti)}
                          className={cn(
                            "w-full flex items-center gap-2 text-left text-xs px-3 py-2.5 rounded-lg transition-all duration-200",
                            activeTopicIndex === ti
                              ? "text-primary font-bold bg-primary/5"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className={cn("w-1 h-1 rounded-full", activeTopicIndex === ti ? "bg-primary" : "bg-transparent")} />
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          {fetchingLesson ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
                  <BookOpen className="w-8 h-8 text-primary-foreground animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Crafting Lesson Content</h3>
              <p className="text-sm text-muted-foreground">Personalizing explanations for <span className="text-primary font-semibold">{topicName}</span>...</p>
            </div>
          ) : lessonError ? (
            <div className="max-w-xl mx-auto mt-20 p-10 glass-card text-center transition-all animate-scale-in">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Lesson Unavailable</h3>
              <p className="text-sm text-muted-foreground mb-6">{lessonError}</p>
              <Button onClick={() => window.location.reload()} variant="outline">Try Refreshing</Button>
            </div>
          ) : lessonContent ? (
            <div className="max-w-3xl mx-auto px-6 md:px-10 py-8">
              {/* Header */}
              <div className="mb-6 animate-fade-in">
                <div className="flex items-center gap-1.5 text-primary/70 text-xs font-semibold uppercase tracking-widest mb-2">
                  <Book className="w-3 h-3" />
                  {currentChapter?.name}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
                  {topicName}
                </h1>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-border/60 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="animate-fade-in" key={activeTab}>

                {/* ── Explanation ── */}
                {activeTab === "explanation" && (
                  <div className="space-y-6">
                    <div className="prose prose-sm md:prose-base max-w-none text-foreground/80 leading-relaxed prose-headings:text-foreground prose-headings:font-semibold prose-strong:text-foreground">
                      <ReactMarkdown
                        remarkPlugins={MD_PLUGINS.remark}
                        rehypePlugins={MD_PLUGINS.rehype}
                      >
                        {preprocessLatex(lessonContent.explanation.trim().replace(/^\s*\(\s*/, '').replace(/\s*\)\s*$/, ''))}
                      </ReactMarkdown>
                    </div>

                    {/* Related images inline */}
                    {(loadingImages || images.length > 0) && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Related Images</p>
                        {loadingImages ? (
                          <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="aspect-video rounded-lg bg-muted animate-pulse" />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {images.map((img, i) => (
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

                    {lessonContent.formulas && lessonContent.formulas.length > 0 && (
                      <div className="p-5 bg-primary/5 rounded-xl border border-primary/10">
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5" /> Key Formulas
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {lessonContent.formulas.map((f: string, i: number) => {
                            const raw = preprocessLatex(f.trim()).replace(/^\$\$?([\s\S]*?)\$\$?$/, '$1').trim();
                            return (
                              <div key={i} className="p-3 bg-white rounded-lg border border-border/60 text-center overflow-x-auto">
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath]}
                                  rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
                                >
                                  {`$$${raw}$$`}
                                </ReactMarkdown>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Key Points ── */}
                {activeTab === "keypoints" && (
                  <ul className="space-y-2">
                    {lessonContent.key_points.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/80 leading-relaxed">{point}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {/* ── Examples ── */}
                {activeTab === "examples" && (
                  <div className="space-y-5">
                    {lessonContent.examples.map((example: any, i: number) => (
                      <div key={i} className="border border-border/60 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 bg-card">
                          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Example {i + 1}</span>
                          <h3 className="text-base font-semibold text-foreground mt-1">{example.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{example.scenario}</p>
                        </div>
                        <div className="px-5 py-4 bg-muted/30 border-t border-border/40">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Solution</p>
                          <div className="prose prose-sm max-w-none text-foreground/80 prose-headings:font-semibold prose-strong:text-foreground">
                            <ReactMarkdown
                              remarkPlugins={MD_PLUGINS.remark}
                              rehypePlugins={MD_PLUGINS.rehype}
                            >
                              {preprocessLatex(example.solution)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Quiz ── */}
                {activeTab === "quiz" && (
                  <div className="space-y-5">
                    <p className="text-sm text-muted-foreground">Answer all questions, then submit to see explanations.</p>

                    {lessonContent.diagnostic_quiz.map((q: any, qi: number) => (
                      <div key={qi} className="border border-border/60 rounded-xl p-5">
                        <p className="text-sm font-semibold text-foreground mb-3 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">{qi + 1}</span>
                          {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt: string, oi: number) => {
                            const isSelected = selectedAnswers[qi] === oi;
                            const isCorrect = submitted && opt === q.correct_answer;
                            const isWrong = submitted && isSelected && opt !== q.correct_answer;
                            return (
                              <button
                                key={oi}
                                disabled={submitted}
                                onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qi]: oi }))}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 rounded-lg text-sm border transition-all",
                                  isCorrect
                                    ? "bg-success-soft border-success text-success"
                                    : isWrong
                                      ? "bg-danger-soft border-destructive text-destructive"
                                      : isSelected
                                        ? "bg-primary/5 border-primary text-primary"
                                        : "bg-background border-border/60 hover:border-primary/40 hover:bg-muted/30"
                                )}
                              >
                                <span className="text-xs font-bold mr-2 opacity-50">{String.fromCharCode(65 + oi)}.</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {submitted && (
                          <div className="mt-3 pt-3 border-t border-border/40">
                            <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {!submitted ? (
                      <Button
                        className="w-full"
                        onClick={() => setSubmitted(true)}
                        disabled={Object.keys(selectedAnswers).length < lessonContent.diagnostic_quiz.length}
                      >
                        Submit Answers
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/60">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Score: {lessonContent.diagnostic_quiz.filter((q: any, i: number) =>
                              q.options[selectedAnswers[i]] === q.correct_answer
                            ).length} / {lessonContent.diagnostic_quiz.length}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">Explanations shown above</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                          Back to top
                        </Button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
              <Book className="w-16 h-16 text-muted-foreground/30" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select a Chapter to begin</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

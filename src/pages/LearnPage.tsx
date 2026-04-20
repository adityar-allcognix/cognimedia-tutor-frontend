import React, { useEffect, useState } from "react";
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
  ChevronRight,
  Clock,
  Sigma,
  ImageIcon,
  XCircle,
  FileText,
  Eye,
  FlaskConical,
  Globe,
  Zap,
  ChevronDown,
  Youtube,
  PlayCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";

// Unescapes literal \n sequences from the backend, then converts LaTeX delimiters
function preprocessLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\\[([\s\S]*?)\\\]/g, (_: string, m: string) => `\n$$${m}$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_: string, m: string) => `$${m}$`);
}

// Strips outer math delimiters — uses greedy match to avoid cutting formulas short
function stripMathDelimiters(f: string): string {
  const processed = preprocessLatex(f.trim());
  return processed
    .replace(/^\s*\$\$([\s\S]*)\$\$\s*$/, '$1')
    .replace(/^\s*\$([\s\S]*)\$\s*$/, '$1')
    .trim();
}

function parseExplanationSections(raw: string): { title: string; content: string }[] {
  const text = preprocessLatex(raw.trim().replace(/^\s*\(\s*/, '').replace(/\s*\)\s*$/, ''));
  const parts = text.split(/\n(?=## )/);
  const sections: { title: string; content: string }[] = [];
  for (const part of parts) {
    const match = part.match(/^## (.+?)\n([\s\S]*)/);
    if (match) {
      sections.push({ title: match[1].trim(), content: match[2].trim() });
    } else if (part.trim()) {
      sections.push({ title: '', content: part.trim() });
    }
  }
  return sections;
}

const SECTION_STYLES = [
  { icon: BookOpen,      accent: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/20",   border: "border-blue-200 dark:border-blue-800",   iconBg: "bg-blue-100 dark:bg-blue-900/50" },
  { icon: ListChecks,    accent: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/20", border: "border-indigo-200 dark:border-indigo-800", iconBg: "bg-indigo-100 dark:bg-indigo-900/50" },
  { icon: FlaskConical,  accent: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/20",  border: "border-amber-200 dark:border-amber-800",  iconBg: "bg-amber-100 dark:bg-amber-900/50" },
  { icon: Globe,         accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800", iconBg: "bg-emerald-100 dark:bg-emerald-900/50" },
  { icon: AlertCircle,   accent: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-950/20",    border: "border-rose-200 dark:border-rose-800",    iconBg: "bg-rose-100 dark:bg-rose-900/50" },
  { icon: Zap,           accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-200 dark:border-violet-800", iconBg: "bg-violet-100 dark:bg-violet-900/50" },
];

const KATEX_OPTIONS = { throwOnError: false, errorColor: '#cc0000' };
const MD_PLUGINS = {
  remark: [remarkGfm, remarkMath],
  rehype: [[rehypeKatex, KATEX_OPTIONS]] as any,
};
const MD_MATH_ONLY = {
  remark: [remarkMath],
  rehype: [[rehypeKatex, KATEX_OPTIONS]] as any,
};

const tabs = [
  { id: "explanation", label: "Explanation", icon: BookOpen },
  { id: "keypoints",   label: "Key Points",  icon: ListChecks },
  { id: "examples",    label: "Examples",    icon: Lightbulb },
  { id: "boardqs",     label: "Board Qs",    icon: FileText },
  { id: "resources",   label: "Resources",   icon: Youtube },
  { id: "quiz",        label: "Quiz",        icon: HelpCircle },
];

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

function ExplanationSection({
  section,
  style,
  Icon,
  defaultOpen,
}: {
  section: { title: string; content: string };
  style: typeof SECTION_STYLES[0];
  Icon: React.ElementType;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-2xl border overflow-hidden", style.border)}>
      {section.title ? (
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors",
            style.bg
          )}
        >
          <div className={cn("p-1.5 rounded-lg shrink-0", style.iconBg)}>
            <Icon className={cn("w-3.5 h-3.5", style.accent)} />
          </div>
          <span className={cn("flex-1 text-sm font-bold", style.accent)}>{section.title}</span>
          <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform duration-200", style.accent, open && "rotate-180")} />
        </button>
      ) : null}
      {open && (
        <div className="px-5 py-4 bg-card prose prose-sm md:prose-base max-w-none text-foreground/85 leading-relaxed
          prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
          prose-h3:text-sm prose-h3:font-bold
          prose-strong:text-foreground prose-strong:font-semibold
          prose-p:mb-3 prose-p:leading-7
          prose-ul:my-2 prose-li:my-0.5
          prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
          prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
          prose-table:text-sm
        ">
          <ReactMarkdown remarkPlugins={MD_PLUGINS.remark} rehypePlugins={MD_PLUGINS.rehype}>
            {section.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;

async function fetchYouTubeVideos(topic: string, grade: number): Promise<{ videoId: string; title: string; channel: string; thumb: string }[]> {
  if (!YT_API_KEY || YT_API_KEY === "your_youtube_data_api_v3_key_here") return [];
  const query = `CBSE class ${grade} ${topic}`;
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoDuration", "medium"); // 4–20 min, excludes Shorts (<60s)
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("key", YT_API_KEY);
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  const SHORTS_RE = /#shorts?\b/i;
  return (data.items ?? [])
    .filter((item: any) => !SHORTS_RE.test(item.snippet.title))
    .slice(0, 6)
    .map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumb: item.snippet.thumbnails?.medium?.url ?? `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
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
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [fetchingLesson, setFetchingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  const [images, setImages] = useState<{ title: string; thumb: string; page: string }[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [videos, setVideos] = useState<{ videoId: string; title: string; channel: string; thumb: string }[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videosFetched, setVideosFetched] = useState(false);

  const user = getUser() as any;
  const userId = getCurrentUserId() || "test-user";
  const grade = user?.grade || 10;

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
          setRevealedAnswers(new Set());
          setVideos([]);
          setVideosFetched(false);
          setImages([]);
          setLoadingImages(true);
          fetchWikiImages(topicStr)
            .then(setImages)
            .catch(() => setImages([]))
            .finally(() => setLoadingImages(false));
          const data = await learnChapterTopic({
            user_id: userId,
            grade,
            subject: selectedSubject,
            chapter_id: chapter.id,
            chapter_name: chapter.name,
            topic: topicStr,
            num_questions: 10,
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

  // Lazy-load YouTube videos only when Resources tab is opened
  useEffect(() => {
    if (activeTab !== "resources" || videosFetched || !topicName) return;
    setLoadingVideos(true);
    fetchYouTubeVideos(topicName, grade)
      .then(setVideos)
      .catch(() => setVideos([]))
      .finally(() => { setLoadingVideos(false); setVideosFetched(true); });
  }, [activeTab, videosFetched, topicName, grade]);

  const quizQuestions = lessonContent?.diagnostic_quiz ?? [];
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = submitted
    ? quizQuestions.filter((q: any, i: number) => q.options[selectedAnswers[i]] === q.correct_answer).length
    : 0;

  return (
    <AppLayout>
      <div className="flex h-screen overflow-hidden">

        {/* ── Sidebar ── */}
        <div className="hidden lg:flex flex-col w-72 xl:w-80 border-r border-border/40 bg-card/50 overflow-y-auto shrink-0">
          {/* Curriculum badge */}
          <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border/40 px-4 py-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Curriculum</p>
                <p className="text-sm font-bold text-foreground">Class {grade} · {selectedSubject}</p>
              </div>
            </div>
            {/* Subject pills */}
            <div className="flex flex-wrap gap-1.5">
              {subjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                    selectedSubject === sub
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter list */}
          <div className="px-3 py-4 space-y-1 flex-1">
            {loadingSyllabus ? (
              <div className="flex flex-col items-center py-12 gap-2 opacity-50">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-xs font-medium">Loading syllabus...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-destructive/5 text-destructive text-xs rounded-xl flex items-start gap-2 border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            ) : chapters.map((ch, ci) => {
              const isActiveChapter = activeChapterIndex === ci;
              return (
                <div key={ci}>
                  <button
                    onClick={() => { setActiveChapterIndex(ci); setActiveTopicIndex(0); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl transition-all duration-200 group",
                      isActiveChapter
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0",
                      isActiveChapter ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground group-hover:bg-muted-foreground/30"
                    )}>
                      {ci + 1}
                    </span>
                    <span className="text-xs font-semibold leading-snug">{ch.name}</span>
                    <ChevronRight className={cn(
                      "w-3 h-3 ml-auto shrink-0 transition-transform",
                      isActiveChapter ? "rotate-90 text-primary" : "text-muted-foreground/40"
                    )} />
                  </button>

                  {isActiveChapter && (
                    <div className="mt-1 mb-2 ml-4 pl-3 border-l-2 border-primary/20 space-y-0.5 animate-fade-in">
                      {ch.topics.map((topic: any, ti: number) => {
                        const name = typeof topic === 'string' ? topic : topic.name;
                        const isActiveTopic = activeTopicIndex === ti;
                        return (
                          <button
                            key={ti}
                            onClick={() => setActiveTopicIndex(ti)}
                            className={cn(
                              "w-full flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg transition-all duration-200",
                              isActiveTopic
                                ? "text-primary font-semibold bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                          >
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0 transition-all",
                              isActiveTopic ? "bg-primary" : "bg-muted-foreground/30"
                            )} />
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 overflow-y-auto">
          {fetchingLesson ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
                  <BookOpen className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground mb-1">Crafting your lesson...</h3>
                <p className="text-sm text-muted-foreground">
                  Personalizing <span className="text-primary font-semibold">{topicName}</span> for Class {grade}
                </p>
              </div>
            </div>
          ) : lessonError ? (
            <div className="max-w-md mx-auto mt-24 p-8 glass-card text-center animate-scale-in">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Lesson Unavailable</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{lessonError}</p>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">Try Refreshing</Button>
            </div>
          ) : lessonContent ? (
            <div className="max-w-3xl mx-auto px-5 md:px-10 py-8">

              {/* Topic header */}
              <div className="mb-7 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                  <Book className="w-3.5 h-3.5" />
                  <span>{currentChapter?.name}</span>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                  <span className="text-primary">{selectedSubject}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-snug mb-3">
                  {topicName}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> ~{Math.ceil((lessonContent.explanation?.length || 500) / 800)} min read
                  </span>
                  {lessonContent.formulas?.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-violet-600 bg-violet-50 dark:bg-violet-950/30 px-3 py-1 rounded-full">
                      <Sigma className="w-3 h-3" /> {lessonContent.formulas.length} formula{lessonContent.formulas.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {images.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 dark:bg-sky-950/30 px-3 py-1 rounded-full">
                      <ImageIcon className="w-3 h-3" /> {images.length} images
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 border-b border-border/60 mb-7 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.id === "quiz" && quizQuestions.length > 0 && (
                      <span className="ml-1 text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                        {quizQuestions.length}
                      </span>
                    )}
                    {tab.id === "boardqs" && lessonContent?.theoretical_questions?.length > 0 && (
                      <span className="ml-1 text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                        {lessonContent.theoretical_questions.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="animate-fade-in" key={activeTab}>

                {/* ── EXPLANATION ── */}
                {activeTab === "explanation" && (
                  <div className="space-y-8">
                    {/* Sectioned cards */}
                    <div className="space-y-3">
                      {parseExplanationSections(lessonContent.explanation).map((section, si) => {
                        const style = SECTION_STYLES[si % SECTION_STYLES.length];
                        const Icon = style.icon;
                        return (
                          <ExplanationSection key={si} section={section} style={style} Icon={Icon} defaultOpen={si === 0} />
                        );
                      })}
                    </div>

                    {/* Key Formulas */}
                    {lessonContent.formulas?.length > 0 && (
                      <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/50">
                            <Sigma className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <h4 className="text-sm font-bold text-violet-700 dark:text-violet-300">Key Formulas</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {lessonContent.formulas.map((f: string, i: number) => {
                            const raw = stripMathDelimiters(f);
                            return (
                              <div key={i} className="p-4 bg-white dark:bg-card rounded-xl border border-violet-100 dark:border-violet-800/50 text-center overflow-x-auto shadow-sm">
                                <ReactMarkdown
                                  remarkPlugins={MD_MATH_ONLY.remark}
                                  rehypePlugins={MD_MATH_ONLY.rehype}
                                >
                                  {`$$${raw}$$`}
                                </ReactMarkdown>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Related images */}
                    {(loadingImages || images.length > 0) && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Related Images</p>
                        </div>
                        {loadingImages ? (
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="w-48 h-32 rounded-xl bg-muted animate-pulse shrink-0" />
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
                            {images.map((img, i) => (
                              <a
                                key={i}
                                href={img.page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group shrink-0 w-44 rounded-xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all hover:shadow-md block"
                                title={img.title}
                              >
                                <div className="w-full h-28 bg-muted overflow-hidden">
                                  <img
                                    src={img.thumb}
                                    alt={img.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <p className="px-2.5 py-1.5 text-[10px] text-muted-foreground truncate bg-card">{img.title}</p>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── KEY POINTS ── */}
                {activeTab === "keypoints" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-5">
                      {lessonContent.key_points?.length} key points for <span className="font-semibold text-foreground">{topicName}</span>
                    </p>
                    {lessonContent.key_points?.map((point: string, i: number) => (
                      <div
                        key={i}
                        className="flex gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {i + 1}
                        </div>
                        <div className="text-sm text-foreground/85 leading-relaxed flex-1 prose prose-sm max-w-none
                          prose-strong:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-p:my-0">
                          <ReactMarkdown
                            remarkPlugins={MD_PLUGINS.remark}
                            rehypePlugins={MD_PLUGINS.rehype}
                          >
                            {preprocessLatex(point)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── EXAMPLES ── */}
                {activeTab === "examples" && (
                  <div className="space-y-6">
                    {lessonContent.examples?.map((example: any, i: number) => (
                      <div key={i} className="rounded-2xl border border-border/60 overflow-hidden bg-card shadow-sm">
                        {/* Example header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-muted/30">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Example {i + 1}</p>
                            <h3 className="text-sm font-bold text-foreground leading-snug">{example.title}</h3>
                          </div>
                        </div>

                        {/* Scenario */}
                        <div className="px-5 py-4 border-b border-border/30">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Problem</p>
                          <div className="text-sm text-foreground/85 leading-relaxed prose prose-sm max-w-none
                            prose-strong:text-foreground prose-p:my-0">
                            <ReactMarkdown
                              remarkPlugins={MD_PLUGINS.remark}
                              rehypePlugins={MD_PLUGINS.rehype}
                            >
                              {preprocessLatex(example.scenario)}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Solution */}
                        <div className="px-5 py-4 bg-emerald-50/50 dark:bg-emerald-950/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" /> Solution
                          </p>
                          <div className="text-sm text-foreground/85 leading-relaxed prose prose-sm max-w-none
                            prose-headings:text-foreground prose-headings:font-semibold
                            prose-strong:text-foreground
                            prose-code:bg-white/70 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                            prose-p:mb-3">
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

                {/* ── BOARD QUESTIONS ── */}
                {activeTab === "boardqs" && (
                  <div className="space-y-5">
                    {(!lessonContent.theoretical_questions || lessonContent.theoretical_questions.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-50">
                        <FileText className="w-10 h-10 text-muted-foreground" />
                        <p className="text-sm font-semibold text-muted-foreground">Board questions not available for this topic yet.</p>
                        <p className="text-xs text-muted-foreground">Reload the topic to generate them.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-2">
                          Board-style questions for <span className="font-semibold text-foreground">{lessonContent.topic}</span>. Read the question, attempt it yourself, then reveal the model answer.
                        </p>
                        {lessonContent.theoretical_questions.map((q: any, qi: number) => {
                          const isRevealed = revealedAnswers.has(qi);
                          const is5Mark = q.marks === 5;
                          return (
                            <div key={qi} className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
                              {/* Header */}
                              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                                  {qi + 1}
                                </span>
                                <div className="flex-1 text-sm font-semibold text-foreground leading-relaxed">
                                  {q.question}
                                </div>
                                <span className={cn(
                                  "shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                                  is5Mark
                                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                                )}>
                                  {q.marks} Marks
                                </span>
                              </div>

                              {/* Answer area */}
                              <div className="px-5 py-4">
                                {isRevealed ? (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3 h-3" /> Model Answer
                                    </p>
                                    <div className="text-sm text-foreground/85 leading-relaxed prose prose-sm max-w-none
                                      prose-strong:text-foreground prose-p:my-1 prose-ul:my-2 prose-li:my-0.5">
                                      <ReactMarkdown
                                        remarkPlugins={MD_PLUGINS.remark}
                                        rehypePlugins={MD_PLUGINS.rehype}
                                      >
                                        {preprocessLatex(q.answer)}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setRevealedAnswers((prev) => new Set([...prev, qi]))}
                                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Reveal Answer
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}

                {/* ── RESOURCES ── */}
                {activeTab === "resources" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Videos
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Curated for <span className="font-semibold text-foreground">{topicName}</span> · Class {grade} CBSE
                        </p>
                      </div>
                      <a
                        href={`https://www.youtube.com/results?search_query=CBSE+class+${grade}+${encodeURIComponent(topicName ?? '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Search more <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {!YT_API_KEY || YT_API_KEY === "your_youtube_data_api_v3_key_here" ? (
                      <div className="rounded-2xl border border-dashed border-border/60 p-8 flex flex-col items-center gap-3 text-center">
                        <Youtube className="w-10 h-10 text-red-400 opacity-60" />
                        <p className="text-sm font-semibold text-foreground">YouTube API key not configured</p>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          Add <code className="bg-muted px-1 py-0.5 rounded text-[11px]">VITE_YOUTUBE_API_KEY</code> to your <code className="bg-muted px-1 py-0.5 rounded text-[11px]">.env</code> file to enable video recommendations.
                        </p>
                        <a
                          href={`https://www.youtube.com/results?search_query=CBSE+class+${grade}+${encodeURIComponent(topicName ?? '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                        >
                          <Youtube className="w-4 h-4" /> Search on YouTube
                        </a>
                      </div>
                    ) : loadingVideos ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="rounded-2xl border border-border/40 overflow-hidden animate-pulse">
                            <div className="w-full aspect-video bg-muted" />
                            <div className="p-3 space-y-2">
                              <div className="h-3 bg-muted rounded w-3/4" />
                              <div className="h-2.5 bg-muted rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : videos.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/60 p-8 flex flex-col items-center gap-3 text-center">
                        <Youtube className="w-10 h-10 text-muted-foreground opacity-40" />
                        <p className="text-sm font-semibold text-muted-foreground">No videos found</p>
                        <a
                          href={`https://www.youtube.com/results?search_query=CBSE+class+${grade}+${encodeURIComponent(topicName ?? '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                        >
                          Try searching on YouTube <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {videos.map((v) => (
                          <a
                            key={v.videoId}
                            href={`https://www.youtube.com/watch?v=${v.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group rounded-2xl border border-border/60 overflow-hidden hover:border-red-400/60 hover:shadow-md transition-all bg-card"
                          >
                            <div className="relative w-full aspect-video bg-muted overflow-hidden">
                              <img
                                src={v.thumb}
                                alt={v.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                              </div>
                              <div className="absolute top-2 right-2 bg-red-600 rounded-md px-1.5 py-0.5">
                                <Youtube className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <div className="px-3.5 py-3">
                              <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {v.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1 truncate">{v.channel}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── QUIZ ── */}
                {activeTab === "quiz" && (
                  <div className="space-y-6">
                    {/* Progress bar */}
                    {!submitted && (
                      <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl border border-border/40">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-foreground">Progress</span>
                            <span className="text-muted-foreground">{answeredCount} / {quizQuestions.length} answered</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${(answeredCount / quizQuestions.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Score card */}
                    {submitted && (
                      <div className={cn(
                        "p-5 rounded-2xl border-2 text-center",
                        correctCount === quizQuestions.length
                          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                          : correctCount >= quizQuestions.length / 2
                            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      )}>
                        <p className="text-3xl font-black mb-1">
                          {correctCount}<span className="text-lg font-bold text-muted-foreground">/{quizQuestions.length}</span>
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {correctCount === quizQuestions.length ? "Perfect score! 🎉" : correctCount >= quizQuestions.length / 2 ? "Good effort! Keep going." : "Review the material and try again."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Explanations are shown below each question</p>
                      </div>
                    )}

                    {/* Questions */}
                    {quizQuestions.map((q: any, qi: number) => {
                      const isAnswered = selectedAnswers[qi] !== undefined;
                      return (
                        <div key={qi} className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
                          <div className="px-5 py-4 border-b border-border/30">
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                {qi + 1}
                              </span>
                              <div className="text-sm font-semibold text-foreground leading-relaxed flex-1 prose prose-sm max-w-none prose-p:my-0 prose-strong:text-foreground">
                                <ReactMarkdown
                                  remarkPlugins={MD_PLUGINS.remark}
                                  rehypePlugins={MD_PLUGINS.rehype}
                                >
                                  {preprocessLatex(q.question)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>

                          <div className="px-5 py-4 space-y-2">
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
                                    "w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl text-sm border-2 transition-all",
                                    isCorrect
                                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 text-emerald-700 dark:text-emerald-300"
                                      : isWrong
                                        ? "bg-red-50 dark:bg-red-950/20 border-red-400 text-red-700 dark:text-red-300"
                                        : isSelected
                                          ? "bg-primary/5 border-primary text-primary"
                                          : "border-border/60 hover:border-primary/40 hover:bg-muted/40 text-foreground/75 disabled:opacity-60"
                                  )}
                                >
                                  <span className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-colors",
                                    isCorrect ? "bg-emerald-500 text-white" :
                                    isWrong ? "bg-red-400 text-white" :
                                    isSelected ? "bg-primary text-primary-foreground" :
                                    "bg-muted text-muted-foreground"
                                  )}>
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                  {isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />}
                                  {isWrong && <XCircle className="w-4 h-4 shrink-0 text-red-400" />}
                                </button>
                              );
                            })}
                          </div>

                          {submitted && (
                            <div className="px-5 py-3 bg-muted/30 border-t border-border/30">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground">Explanation: </span>
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {!submitted ? (
                      <Button
                        className="w-full h-11 rounded-xl font-semibold"
                        onClick={() => setSubmitted(true)}
                        disabled={answeredCount < quizQuestions.length}
                      >
                        {answeredCount < quizQuestions.length
                          ? `Answer ${quizQuestions.length - answeredCount} more to submit`
                          : "Submit Answers"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl"
                        onClick={() => { setSubmitted(false); setSelectedAnswers({}); }}
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
              <Book className="w-16 h-16 text-muted-foreground" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select a topic to begin</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

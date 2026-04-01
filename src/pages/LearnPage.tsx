import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  ListChecks,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";

const chapters = [
  {
    title: "Light – Reflection & Refraction",
    topics: ["Reflection of Light", "Spherical Mirrors", "Refraction of Light", "Lenses"],
  },
  {
    title: "Electricity",
    topics: ["Electric Current", "Ohm's Law", "Resistance", "Electric Power"],
  },
  {
    title: "Magnetic Effects of Current",
    topics: ["Magnetic Field", "Electromagnets", "Electric Motor", "Electromagnetic Induction"],
  },
];

const tabs = [
  { id: "explanation", label: "Explanation", icon: BookOpen },
  { id: "keypoints", label: "Key Points", icon: ListChecks },
  { id: "examples", label: "Examples", icon: Lightbulb },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
];

const quizQuestions = [
  {
    question: "When a ray of light passes from a denser medium to a rarer medium, it bends:",
    options: ["Towards the normal", "Away from the normal", "Along the normal", "Does not bend"],
    correct: 1,
  },
  {
    question: "The focal length of a concave mirror is 15 cm. What is its radius of curvature?",
    options: ["7.5 cm", "15 cm", "30 cm", "45 cm"],
    correct: 2,
  },
];

export default function LearnPage() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeTopic, setActiveTopic] = useState(0);
  const [activeTab, setActiveTab] = useState("explanation");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-0px)] overflow-hidden">
        {/* Left sidebar - chapters */}
        <div className="hidden lg:flex flex-col w-72 border-r border-border/40 bg-card/30 backdrop-blur-sm overflow-y-auto p-5">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Physics · Class 10
          </h2>
          {chapters.map((ch, ci) => (
            <div key={ci} className="mb-4">
              <button
                onClick={() => { setActiveChapter(ci); setActiveTopic(0); }}
                className={cn(
                  "w-full text-left text-sm font-semibold px-3 py-2 rounded-xl transition-colors duration-200",
                  activeChapter === ci ? "text-primary bg-lavender/50" : "text-foreground hover:bg-muted"
                )}
              >
                {ch.title}
              </button>
              {activeChapter === ci && (
                <div className="ml-3 mt-1 space-y-0.5 animate-fade-in">
                  {ch.topics.map((topic, ti) => (
                    <button
                      key={ti}
                      onClick={() => setActiveTopic(ti)}
                      className={cn(
                        "w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg transition-all duration-200",
                        activeTopic === ti
                          ? "text-primary font-medium bg-primary/5"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {activeTopic === ti && <ChevronRight className="w-3 h-3 text-primary" />}
                      <span>{topic}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                {chapters[activeChapter].title}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {chapters[activeChapter].topics[activeTopic]}
              </h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/60 rounded-xl mb-8 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="animate-fade-in" key={activeTab}>
              {activeTab === "explanation" && (
                <div className="glass-card p-6 md:p-8 space-y-5">
                  <p className="text-base leading-relaxed text-foreground/90">
                    <span className="font-semibold text-primary">Reflection of light</span> is the phenomenon
                    in which a ray of light bounces back into the same medium after striking a smooth surface.
                    The surface that reflects light is called a <span className="font-semibold text-primary">mirror</span>.
                  </p>
                  <p className="text-base leading-relaxed text-foreground/90">
                    When a beam of parallel light rays falls on a smooth, polished surface, the reflected rays
                    are also parallel. This is called <span className="font-semibold text-primary">regular reflection</span>.
                    When the same beam falls on a rough surface, the reflected rays scatter in different directions.
                    This is called <span className="font-semibold text-primary">diffuse reflection</span>.
                  </p>
                  <div className="p-4 bg-lavender/40 rounded-xl border border-lavender-deep/20">
                    <p className="text-sm font-semibold text-foreground mb-1">Laws of Reflection</p>
                    <ul className="text-sm text-foreground/80 space-y-1 list-disc list-inside">
                      <li>The angle of incidence is equal to the angle of reflection.</li>
                      <li>The incident ray, reflected ray, and normal all lie in the same plane.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "keypoints" && (
                <div className="glass-card p-6 md:p-8 space-y-4">
                  {[
                    "A smooth, polished surface that reflects light is called a mirror.",
                    "The angle of incidence equals the angle of reflection.",
                    "Regular reflection occurs on smooth surfaces; diffuse reflection on rough surfaces.",
                    "The image formed by a plane mirror is virtual, erect, and laterally inverted.",
                    "Concave mirrors converge light; convex mirrors diverge light.",
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/90 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "examples" && (
                <div className="space-y-4">
                  <div className="glass-card p-6 md:p-8">
                    <span className="badge-easy mb-3 inline-block">Easy</span>
                    <p className="font-semibold text-foreground mb-3">
                      A ray of light strikes a plane mirror at an angle of 30° to the mirror surface. Find the angle of reflection.
                    </p>
                    <div className="p-4 bg-sky/30 rounded-xl space-y-2">
                      <p className="text-sm font-semibold text-accent-foreground">Step-by-step solution:</p>
                      <p className="text-sm text-foreground/80">1. Angle with mirror surface = 30°</p>
                      <p className="text-sm text-foreground/80">2. Angle of incidence = 90° − 30° = 60°</p>
                      <p className="text-sm text-foreground/80">3. By law of reflection: angle of reflection = 60°</p>
                      <p className="text-sm font-semibold text-primary mt-2">∴ Angle of reflection = 60°</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "quiz" && (
                <div className="space-y-6">
                  {quizQuestions.map((q, qi) => (
                    <div key={qi} className="glass-card p-6">
                      <p className="font-semibold text-foreground mb-4">
                        <span className="text-primary mr-2">Q{qi + 1}.</span>
                        {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oi) => {
                          const isSelected = selectedAnswers[qi] === oi;
                          const isCorrect = submitted && oi === q.correct;
                          const isWrong = submitted && isSelected && oi !== q.correct;
                          return (
                            <button
                              key={oi}
                              disabled={submitted}
                              onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qi]: oi }))}
                              className={cn(
                                "text-left px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200",
                                isCorrect
                                  ? "bg-success-soft border-success/40 text-success"
                                  : isWrong
                                  ? "bg-danger-soft border-destructive/40 text-destructive"
                                  : isSelected
                                  ? "bg-lavender border-primary/30 text-primary"
                                  : "bg-card border-border hover:bg-muted hover:border-primary/20"
                              )}
                            >
                              <span className="text-muted-foreground mr-2">{String.fromCharCode(65 + oi)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="premium"
                    size="lg"
                    onClick={() => setSubmitted(true)}
                    disabled={Object.keys(selectedAnswers).length < quizQuestions.length || submitted}
                  >
                    {submitted ? "Submitted ✓" : "Submit Answers"}
                  </Button>
                  {submitted && (
                    <div className="glass-card p-5 animate-scale-in">
                      <p className="font-semibold text-foreground">
                        Score: {quizQuestions.filter((q, i) => selectedAnswers[i] === q.correct).length}/{quizQuestions.length}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Review the answers above. Correct answers are highlighted in green.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

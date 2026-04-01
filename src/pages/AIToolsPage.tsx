import { useState } from "react";
import {
  Sparkles,
  BookOpen,
  FileText,
  ClipboardList,
  Copy,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";

const tools = [
  { id: "quiz", label: "Quiz Generator", icon: ClipboardList },
  { id: "notes", label: "Notes Generator", icon: FileText },
  { id: "lesson", label: "Lesson Planner", icon: BookOpen },
];

const sampleOutput = {
  quiz: [
    { q: "What is Ohm's Law?", options: ["V = IR", "V = I/R", "V = I + R", "V = R/I"], answer: "A" },
    { q: "SI unit of resistance is:", options: ["Volt", "Ampere", "Ohm", "Watt"], answer: "C" },
    { q: "What does ammeter measure?", options: ["Voltage", "Current", "Resistance", "Power"], answer: "B" },
  ],
  notes: [
    "Ohm's Law states V = IR where V is voltage, I is current, R is resistance.",
    "Resistance depends on length, area, material, and temperature of the conductor.",
    "Resistors in series: R_total = R1 + R2 + R3",
    "Resistors in parallel: 1/R_total = 1/R1 + 1/R2 + 1/R3",
  ],
  lesson: [
    { section: "Introduction", content: "Start with real-life examples of electricity in daily use." },
    { section: "Core Concepts", content: "Explain current, voltage, resistance with analogies (water flow)." },
    { section: "Demonstration", content: "Show circuit diagrams and Ohm's Law verification." },
    { section: "Practice", content: "Solve 5 numerical problems of increasing difficulty." },
  ],
};

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState("quiz");
  const [topic, setTopic] = useState("Electricity");
  const [generated, setGenerated] = useState(true);

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
        <div className="flex gap-2 p-1 bg-muted/60 rounded-xl mb-8 w-fit animate-fade-in">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTool === tool.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tool.icon className="w-4 h-4" />
              {tool.label}
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
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="Enter topic..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Class</label>
                  <div className="relative">
                    <select className="w-full appearance-none px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option>Class 10</option>
                      <option>Class 9</option>
                      <option>Class 8</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Difficulty</label>
                  <div className="relative">
                    <select className="w-full appearance-none px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option>Medium</option>
                      <option>Easy</option>
                      <option>Hard</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Additional Context</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
                  placeholder="Any specific focus areas..."
                />
              </div>
              <Button variant="premium" size="lg" className="w-full" onClick={() => setGenerated(true)}>
                <Sparkles className="w-4 h-4" />
                Generate
              </Button>
            </div>
          </div>

          {/* Output */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Output</h3>
              {generated && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm"><Copy className="w-4 h-4" /> Copy</Button>
                  <Button variant="ghost" size="sm"><RefreshCw className="w-4 h-4" /> Redo</Button>
                </div>
              )}
            </div>

            {!generated ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Configure and generate to see results here.</p>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                {activeTool === "quiz" && sampleOutput.quiz.map((q, i) => (
                  <div key={i} className="p-4 bg-muted/30 rounded-xl">
                    <p className="text-sm font-semibold text-foreground mb-2">
                      <span className="text-primary mr-1">Q{i + 1}.</span> {q.q}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <p key={oi} className="text-xs text-muted-foreground">
                          <span className="font-medium">{String.fromCharCode(65 + oi)}.</span> {opt}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-success font-semibold mt-2">Answer: {q.answer}</p>
                  </div>
                ))}
                {activeTool === "notes" && sampleOutput.notes.map((note, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-lavender/60 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground/90">{note}</p>
                  </div>
                ))}
                {activeTool === "lesson" && sampleOutput.lesson.map((item, i) => (
                  <div key={i} className="p-4 bg-muted/30 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">{item.section}</p>
                    <p className="text-sm text-foreground/90">{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

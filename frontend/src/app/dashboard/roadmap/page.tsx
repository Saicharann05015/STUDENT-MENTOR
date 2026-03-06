"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { roadmapAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Map,
    Loader2,
    Sparkles,
    CheckCircle2,
    Circle,
    BookOpen,
    Code,
    Rocket,
    Bot,
    ExternalLink,
} from "lucide-react";

interface PracticeTask {
    _id: string;
    title: string;
    description: string;
    type: string;
    isCompleted: boolean;
}

interface Project {
    _id: string;
    title: string;
    description: string;
    difficulty: string;
    isCompleted: boolean;
}

interface Resource {
    title: string;
    url: string;
    type: string;
}

interface Milestone {
    _id: string;
    week: number;
    title: string;
    description: string;
    concepts: string[];
    practiceTasks: PracticeTask[];
    projects: Project[];
    resources: Resource[];
    estimatedHours: number;
    isCompleted: boolean;
}

interface Roadmap {
    _id: string;
    title: string;
    description: string;
    milestones: Milestone[];
    progressPercentage: number;
    totalWeeks: number;
}

const levels = ["beginner", "intermediate", "advanced", "expert"];

export default function RoadmapPage() {
    const router = useRouter();
    const [stage, setStage] = useState<"form" | "result">("form");
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

    // Form state
    const [goal, setGoal] = useState("");
    const [category, setCategory] = useState("");
    const [currentLevel, setCurrentLevel] = useState("beginner");
    const [timeline, setTimeline] = useState("");
    const [dailyTime, setDailyTime] = useState("");

    // Fetch existing roadmap on mount
    useEffect(() => {
        const fetchExistingRoadmap = async () => {
            setLoading(true);
            try {
                const res = await roadmapAPI.getRoadmaps();
                const roadmapsList = res.data.data.roadmaps;
                if (roadmapsList && roadmapsList.length > 0) {
                    // Fetch full roadmap details to get the milestones
                    const fullRes = await roadmapAPI.getRoadmap(roadmapsList[0]._id);
                    setRoadmap(fullRes.data.data);
                    setStage("result");
                }
            } catch (err) {
                console.error("Failed to fetch roadmap:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExistingRoadmap();
    }, []);

    const generateRoadmap = async () => {
        if (!goal || !category || !timeline || !dailyTime) return;
        setLoading(true);
        try {
            const res = await roadmapAPI.generate({
                goal,
                currentLevel,
                timeline,
                dailyLearningTime: dailyTime,
                category,
            });
            setRoadmap(res.data.data);
            setStage("result");
        } catch {
            alert("Failed to generate roadmap. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const completeMilestone = async (milestoneId: string) => {
        if (!roadmap) return;
        try {
            const res = await roadmapAPI.completeMilestone(roadmap._id, milestoneId);
            setRoadmap(res.data.data);
        } catch {
            /* ignore */
        }
    };

    const completeTask = async (milestoneId: string, taskId: string) => {
        if (!roadmap) return;
        try {
            const res = await roadmapAPI.completeTask(roadmap._id, milestoneId, taskId);
            setRoadmap(res.data.data);
        } catch {
            /* ignore */
        }
    };

    const completeProject = async (milestoneId: string, projectId: string) => {
        if (!roadmap) return;
        try {
            const res = await roadmapAPI.completeProject(roadmap._id, milestoneId, projectId);
            setRoadmap(res.data.data);
        } catch {
            /* ignore */
        }
    };

    const askAI = (topic: string) => {
        const message = encodeURIComponent(`Can you help me understand or guide me through this topic from my roadmap: ${topic}?`);
        router.push(`/dashboard/chat?context=roadmap&initialMessage=${message}`);
    };

    // FORM SCREEN
    if (stage === "form") {
        return (
            <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 mb-2">
                        <Map className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold">Learning Roadmap</h1>
                    <p className="text-muted-foreground">
                        Generate a personalized week-by-week learning path
                    </p>
                </div>

                <Card className="border-border/50">
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>What do you want to learn?</Label>
                            <Input
                                placeholder="e.g., MERN Stack, Machine Learning"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Your Learning Goal</Label>
                            <Input
                                placeholder="e.g., Become a full-stack developer"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Current Level</Label>
                            <div className="flex gap-2 flex-wrap">
                                {levels.map((lvl) => (
                                    <Badge
                                        key={lvl}
                                        variant={currentLevel === lvl ? "default" : "outline"}
                                        className="cursor-pointer capitalize"
                                        onClick={() => setCurrentLevel(lvl)}
                                    >
                                        {lvl}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Timeline</Label>
                                <Input
                                    placeholder="e.g., 3 months"
                                    value={timeline}
                                    onChange={(e) => setTimeline(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Daily Study Time</Label>
                                <Input
                                    placeholder="e.g., 2 hours"
                                    value={dailyTime}
                                    onChange={(e) => setDailyTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={generateRoadmap}
                            disabled={loading || !goal || !category || !timeline || !dailyTime}
                            className="w-full"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Generate My Roadmap
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // RESULT SCREEN
    if (stage === "result" && roadmap) {
        return (
            <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{roadmap.title}</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {roadmap.description}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setStage("form")}>
                        New Roadmap
                    </Button>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-medium">{roadmap.progressPercentage}%</span>
                    </div>
                    <Progress value={roadmap.progressPercentage} className="h-2" />
                </div>

                <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="space-y-4">
                        {roadmap.milestones.map((milestone) => (
                            <Card
                                key={milestone._id}
                                className={`border-border/50 ${milestone.isCompleted ? "opacity-60" : ""}`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {milestone.isCompleted ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                                            )}
                                            <div>
                                                <CardTitle className="text-base">
                                                    {milestone.title}
                                                </CardTitle>
                                                <CardDescription className="mt-0.5">
                                                    {milestone.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        {!milestone.isCompleted && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => completeMilestone(milestone._id)}
                                            >
                                                Complete
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Concepts */}
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" /> Concepts
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {milestone.concepts.map((c, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="secondary"
                                                    className="px-3 py-1 text-xs flex items-center gap-2 hover:bg-secondary/80 transition-colors cursor-pointer group"
                                                    onClick={() => askAI(c)}
                                                >
                                                    {c}
                                                    <Bot className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Tasks */}
                                    {milestone.practiceTasks.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                                <Code className="h-3 w-3" /> Practice Tasks
                                            </p>
                                            <ul className="space-y-2">
                                                {milestone.practiceTasks.map((t) => (
                                                    <li
                                                        key={t._id}
                                                        className="text-sm flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-accent/30 transition-colors group"
                                                    >
                                                        <button
                                                            onClick={() => completeTask(milestone._id, t._id)}
                                                            disabled={t.isCompleted}
                                                            className="flex items-center gap-2 text-left flex-1"
                                                        >
                                                            {t.isCompleted ? (
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                                            ) : (
                                                                <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                                            )}
                                                            <span className={t.isCompleted ? "line-through text-muted-foreground" : "font-medium"}>
                                                                {t.title}
                                                            </span>
                                                        </button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                            onClick={() => askAI(`Task: ${t.title}`)}
                                                        >
                                                            <Bot className="h-3 w-3 mr-1" /> AI Assist
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* Projects */}
                                    {milestone.projects.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                                <Rocket className="h-3 w-3" /> Projects
                                            </p>
                                            <ul className="space-y-2">
                                                {milestone.projects.map((p) => (
                                                    <li
                                                        key={p._id}
                                                        className="text-sm flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-accent/30 transition-colors group"
                                                    >
                                                        <button
                                                            onClick={() => completeProject(milestone._id, p._id)}
                                                            disabled={p.isCompleted}
                                                            className="flex items-center gap-2 text-left flex-1"
                                                        >
                                                            {p.isCompleted ? (
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                                            ) : (
                                                                <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                                            )}
                                                            <span className={p.isCompleted ? "line-through text-muted-foreground" : "font-medium"}>
                                                                {p.title}
                                                            </span>
                                                        </button>
                                                        <Badge
                                                            variant={p.difficulty === "Beginner" ? "secondary" : p.difficulty === "Intermediate" ? "default" : "destructive"}
                                                            className="text-[10px] shrink-0"
                                                        >
                                                            {p.difficulty}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                            onClick={() => askAI(`Project: ${p.title} - ${p.description}`)}
                                                        >
                                                            <Bot className="h-3 w-3 mr-1" /> AI Assist
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* Resources */}
                                    {milestone.resources && milestone.resources.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                                <ExternalLink className="h-3 w-3" /> Required Documentation
                                            </p>
                                            <ul className="space-y-2">
                                                {milestone.resources.map((r, i) => (
                                                    <li
                                                        key={i}
                                                        className="text-sm flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-accent/30 transition-colors group"
                                                    >
                                                        <a
                                                            href={r.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-left flex-1"
                                                        >
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                                {r.type === 'video' ? <BookOpen className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                                                            </div>
                                                            <span className="font-medium hover:underline">
                                                                {r.title}
                                                            </span>
                                                        </a>
                                                        <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                                                            {r.type}
                                                        </Badge>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        );
    }

    return null;
}

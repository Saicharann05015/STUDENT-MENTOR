"use client";

import { useEffect, useState } from "react";
import api, { roadmapAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Map, BookOpen, Target, Zap, HelpCircle, Bot } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

export function ContextWelcomeScreen({ context, onSendMessage }: { context: string, onSendMessage: (msg: string, ctx?: string) => void }) {
    if (context === "general") {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                    <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                    Hi! I&apos;m your AI Mentor
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Ask me anything about programming, concepts, or career guidance.
                    I&apos;ll adapt to your level and teach with stories & examples!
                </p>
            </div>
        );
    }

    if (context === "roadmap") {
        return <RoadmapWelcome onSendMessage={onSendMessage} />;
    }

    if (context === "skill-diagnosis") {
        return <SkillCheckWelcome onSendMessage={onSendMessage} />;
    }

    if (context === "doubt-solving") {
        return <DoubtSolvingWelcome onSendMessage={onSendMessage} />;
    }

    return null;
}

function RoadmapWelcome({ onSendMessage }: { onSendMessage: (msg: string, ctx?: string) => void }) {
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                const res = await roadmapAPI.getRoadmaps();
                const roadmapsList = res.data.data.roadmaps;
                if (roadmapsList && roadmapsList.length > 0) {
                    setRoadmap(roadmapsList[0]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRoadmap();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div>;
    }

    if (!roadmap) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="p-4 rounded-2xl bg-muted mb-4">
                    <Target className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Active Roadmap</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">You haven&apos;t generated a personalized learning roadmap yet. Head over to the Roadmap section to get started!</p>
                <Button onClick={() => window.location.href = '/dashboard/roadmap'}>Create a Roadmap</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 w-full h-full flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Map className="h-6 w-6 text-primary" /> Active Learning Path
            </h2>
            <Card className="overflow-hidden border-primary/20 bg-primary/5">
                <CardHeader className="pb-4 border-b border-primary/10 bg-primary/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{roadmap.goal}</CardTitle>
                            <CardDescription className="mt-1">
                                Level: {roadmap.currentLevel} • Timeline: {roadmap.timeline}
                            </CardDescription>
                        </div>
                        <div className="inline-flex flex-col items-end">
                            <span className="text-primary font-bold text-3xl">{roadmap.progressPercentage || 0}%</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Completed</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-foreground">Overall Progress</span>
                        </div>
                        <Progress value={roadmap.progressPercentage || 0} className="h-2" />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <Button
                            className="flex-1 font-medium"
                            onClick={() => onSendMessage(`I'm currently working on my roadmap to "${roadmap.goal}". I am at ${roadmap.progressPercentage || 0}% completion. Can you give me some encouragement and advice on how to tackle my next topics?`, "roadmap")}
                        >
                            Ask About Next Steps
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 font-medium bg-background"
                            onClick={() => window.location.href = '/dashboard/roadmap'}
                        >
                            View Full Roadmap
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function SkillCheckWelcome({ onSendMessage }: { onSendMessage: (msg: string, ctx?: string) => void }) {
    const [diagnosis, setDiagnosis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDiagnosis = async () => {
            try {
                // Fetch diagnoses (getDiagnoses is currently pointing to /api/v1/skills but we don't have a direct helper in api.ts, let's use standard api)
                const res = await api.get("/api/v1/skills");
                const diagnoses = res.data.data;
                if (diagnoses && diagnoses.length > 0) {
                    setDiagnosis(diagnoses[0]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDiagnosis();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div>;
    }

    if (!diagnosis) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="p-4 rounded-2xl bg-muted mb-4">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Skill Data</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">Complete a skill diagnosis to see your strengths and weaknesses visualized here.</p>
                <Button onClick={() => window.location.href = '/dashboard/diagnosis'}>Start Diagnosis</Button>
            </div>
        );
    }

    if (!diagnosis.isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="p-4 rounded-2xl bg-amber-500/10 mb-4">
                    <Zap className="h-10 w-10 text-amber-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Resume Diagnosis: {diagnosis.category}</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">You have an ongoing skill check. Continue where you left off to get your personalized AI skill profile.</p>
                <Button onClick={() => window.location.href = '/dashboard/diagnosis'} className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                    Resume Test
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 w-full h-full flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" /> Skill Profile: {diagnosis.category}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-blue-500/10 border-blue-500/20 shadow-none">
                    <CardContent className="p-4 text-center flex flex-col justify-center h-full">
                        <div className="text-sm font-medium text-blue-500 mb-1 leading-tight">Programming</div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{diagnosis.scores.programming}</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20 shadow-none">
                    <CardContent className="p-4 text-center flex flex-col justify-center h-full">
                        <div className="text-sm font-medium text-green-500 mb-1 leading-tight">Logic</div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{diagnosis.scores.logic}</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-500/10 border-purple-500/20 shadow-none">
                    <CardContent className="p-4 text-center flex flex-col justify-center h-full">
                        <div className="text-sm font-medium text-purple-500 mb-1 leading-tight">Problem Solving</div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{diagnosis.scores.problemSolving}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Improve Your Skills</CardTitle>
                    <CardDescription>Ask your mentor for tailored practice based on your unique scores.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                        variant="secondary"
                        className="w-full justify-start text-left h-auto whitespace-normal py-3"
                        onClick={() => onSendMessage(`Based on my recent ${diagnosis.category} skill diagnosis (Programming: ${diagnosis.scores.programming}, Logic: ${diagnosis.scores.logic}, Problem Solving: ${diagnosis.scores.problemSolving}), what are the top 3 concepts I should review to improve my weakest area?`, "skill-diagnosis")}
                    >
                        <Bot className="h-5 w-5 mr-3 text-primary shrink-0" />
                        <span>What should I focus on improving given my scores?</span>
                    </Button>
                    <Button
                        variant="secondary"
                        className="w-full justify-start text-left h-auto whitespace-normal py-3"
                        onClick={() => onSendMessage(`My logic score is ${diagnosis.scores.logic}/100 and programming is ${diagnosis.scores.programming}/100 in ${diagnosis.category}. Can you give me a practical coding challenge perfectly suited to my precise current level?`, "skill-diagnosis")}
                    >
                        <Bot className="h-5 w-5 mr-3 text-primary shrink-0" />
                        <span>Give me a practice problem tailored to my level</span>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function DoubtSolvingWelcome({ onSendMessage }: { onSendMessage: (msg: string, ctx?: string) => void }) {
    const [goal, setGoal] = useState("");
    const [error, setError] = useState("");

    const handleAsk = () => {
        if (!goal.trim() && !error.trim()) return;
        const prompt = `I need help solving a doubt.

**What I'm trying to do:**
${goal}

**The problem/error I'm facing:**
${error}

Please guide me through solving this step-by-step.`;
        onSendMessage(prompt, "doubt-solving");
    }

    return (
        <div className="max-w-2xl mx-auto py-10 w-full flex flex-col justify-center h-full">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-orange-500/10 text-orange-500 mb-4">
                    <HelpCircle className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold">Doubt Solver</h2>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Stuck on a bug or concept? Describe what you're trying to do and where you're stuck, and I'll help you peel back the layers to solve it.</p>
            </div>

            <Card className="p-6 space-y-5 border-t-4 border-t-orange-500 shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">1. What are you trying to achieve?</label>
                    <Textarea
                        placeholder="e.g., I'm trying to vertically center a div inside a flex container..."
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="resize-none h-20 bg-muted/50 border-muted focus-visible:ring-orange-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">2. What is the error or confusion?</label>
                    <Textarea
                        placeholder="e.g., The item sticks to the top-left corner and align-items isn't working."
                        value={error}
                        onChange={(e) => setError(e.target.value)}
                        className="resize-none h-24 bg-muted/50 border-muted focus-visible:ring-orange-500"
                    />
                </div>
                <div className="pt-2">
                    <Button
                        onClick={handleAsk}
                        className="w-full py-6 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={!goal.trim() || !error.trim()}
                    >
                        Solve My Doubt <Sparkles className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { chatAPI } from "@/lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    BookOpen,
    CheckCircle2,
    Zap,
    RotateCcw,
    ExternalLink,
    Loader2
} from "lucide-react";
import Link from "next/link";

interface RecommendationData {
    nextConcept: {
        title: string;
        description: string;
        link?: string;
    };
    codingExercises: Array<{
        title: string;
        description: string;
        difficulty: string;
    }>;
    revisionTopics: Array<{
        topic: string;
        reason: string;
    }>;
    miniProject: {
        title: string;
        description: string;
    };
    message?: string;
}

export function Recommendations() {
    const [data, setData] = useState<RecommendationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const res = await chatAPI.getRecommendations();
                setData(res.data.data);
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-card/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Consulting with AI Mentor...</p>
            </div>
        );
    }

    if (!data || data.message) {
        return (
            <Card className="border-border/50 overflow-hidden">
                <CardHeader className="bg-primary/5 pb-6">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                        <CardTitle>AI Smart Recommendations</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-12 flex flex-col items-center text-center">
                    <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="font-semibold text-xl">Not enough data yet</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        Keep learning and complete some milestones to unlock personalized AI recommendations!
                    </p>
                    <Link href="/dashboard/roadmap" className="mt-6">
                        <Button>Get Started</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Personalized For You</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Next Concept - Hero Card */}
                <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary">
                                <BookOpen className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Next Step</span>
                            </div>
                            {data.nextConcept.link && (
                                <Link
                                    href={data.nextConcept.link}
                                    target="_blank"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            )}
                        </div>
                        <CardTitle className="text-2xl mt-4">{data.nextConcept.title}</CardTitle>
                        <CardDescription className="text-base text-card-foreground/80 leading-relaxed max-w-2xl">
                            {data.nextConcept.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/chat">
                            <Button className="w-full sm:w-auto">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Explain this to me
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Ultimate Challenge */}
                <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-amber-500 font-semibold uppercase tracking-wider text-sm">
                            <Zap className="h-4 w-4" />
                            Ultimate Project
                        </div>
                        <CardTitle className="text-xl mt-2">{data.miniProject.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                            "{data.miniProject.description}"
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coding Exercises */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            Targeted Exercises
                        </CardTitle>
                        <CardDescription>Practice to strengthen your weak topics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.codingExercises.map((ex, i) => (
                            <div key={i} className="p-4 rounded-lg bg-card border group hover:border-emerald-500/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <h4 className="font-semibold text-sm">{ex.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${ex.difficulty === 'beginner' ? 'bg-emerald-500/10 text-emerald-500' :
                                            ex.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-500' :
                                                'bg-rose-500/10 text-rose-500'
                                        }`}>
                                        {ex.difficulty}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {ex.description}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Revision Topics */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-blue-500" />
                            Revisit for Mastery
                        </CardTitle>
                        <CardDescription>Topics that need a bit more polish</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.revisionTopics.map((topic, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-lg bg-card border group hover:border-blue-500/30 transition-colors">
                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-blue-500 uppercase">{topic.topic.slice(0, 2)}</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">{topic.topic}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {topic.reason}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

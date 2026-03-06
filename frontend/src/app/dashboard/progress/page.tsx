"use client";

import { useState, useEffect } from "react";
import { progressAPI } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BarChart3,
    Flame,
    Clock,
    MessageSquare,
    Brain,
    Map,
    TrendingUp,
    Loader2,
    Trophy,
} from "lucide-react";
import Link from "next/link";

interface ProgressData {
    streak: { current: number; longest: number };
    totalStudyTime: number;
    learningHours: number;
    stats: {
        totalChats: number;
        totalDiagnoses: number;
        totalRoadmaps: number;
        totalLessons: number;
        totalTasks: number;
        skillsImproved: number;
    };
    currentRoadmap: {
        id: string;
        title: string;
        progressPercentage: number;
    } | null;
    activities: Array<{
        type: string;
        description: string;
        date: string;
    }>;
}

export default function ProgressPage() {
    const [data, setData] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await progressAPI.getProgress();
                setData(res.data.data);
            } catch {
                /* ignore */
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
        progressAPI.updateStreak().catch(() => { });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const stats = data?.stats || {
        totalChats: 0,
        totalDiagnoses: 0,
        totalRoadmaps: 0,
        totalLessons: 0,
        totalTasks: 0,
        skillsImproved: 0,
    };
    const streak = data?.streak || { current: 0, longest: 0 };
    const totalMinutes = data?.totalStudyTime || 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const statCards = [
        {
            label: "Current Streak",
            value: `${streak.current} days`,
            icon: Flame,
            color: "text-orange-400",
            bg: "bg-orange-400/10",
        },
        {
            label: "Longest Streak",
            value: `${streak.longest} days`,
            icon: Trophy,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
        },
        {
            label: "Study Time",
            value: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
            icon: Clock,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
        },
        {
            label: "Skills Improved",
            value: stats.skillsImproved.toString(),
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
        },
    ];

    const activityCards = [
        {
            label: "Lessons Completed",
            value: stats.totalLessons,
            icon: Brain,
            color: "text-purple-400",
        },
        {
            label: "Solved Tasks",
            value: stats.totalTasks,
            icon: TrendingUp,
            color: "text-emerald-400",
        },
        {
            label: "AI Interactions",
            value: stats.totalChats,
            icon: MessageSquare,
            color: "text-blue-400",
        },
    ];

    const activities = data?.activities?.slice(0, 10) || [];

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    Progress Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">
                    Track your learning journey
                </p>
            </div>

            {/* Streak & Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="border-border/50">
                        <CardContent className="pt-5 pb-4">
                            <div className={`p-2 rounded-lg ${stat.bg} w-fit mb-2`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Activity Counters */}
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg">Activity Summary</CardTitle>
                    <CardDescription>What you&apos;ve been up to</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        {activityCards.map((item) => (
                            <div
                                key={item.label}
                                className="text-center p-4 rounded-lg bg-muted/50"
                            >
                                <item.icon
                                    className={`h-5 w-5 mx-auto mb-2 ${item.color}`}
                                />
                                <p className="text-2xl font-bold">{item.value}</p>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Current Roadmap Progress */}
            {data?.currentRoadmap && (
                <Card className="border-border/50 bg-card/30">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Active Roadmap</CardTitle>
                                <CardDescription>{data.currentRoadmap.title}</CardDescription>
                            </div>
                            <span className="text-2xl font-bold text-primary">{data.currentRoadmap.progressPercentage}%</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={data.currentRoadmap.progressPercentage} className="h-2" />
                        <div className="flex justify-between mt-2">
                            <p className="text-xs text-muted-foreground italic">Keep going! You&apos;re doing great.</p>
                            <Link href={`/dashboard/roadmap/${data.currentRoadmap.id}`} className="text-xs text-primary hover:underline font-medium">
                                View Details →
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* XP Progress Bar (gamification) */}
            <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Learning XP</span>
                        <Badge variant="secondary">
                            Level{" "}
                            {Math.floor(
                                (stats.totalChats +
                                    stats.totalLessons * 2 +
                                    stats.totalTasks * 3 +
                                    stats.totalDiagnoses * 5) /
                                20
                            ) + 1}
                        </Badge>
                    </div>
                    <Progress
                        value={
                            ((stats.totalChats +
                                stats.totalLessons * 2 +
                                stats.totalTasks * 3 +
                                stats.totalDiagnoses * 5) %
                                100)
                        }
                        className="h-3"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Keep learning to level up and unlock new badges!
                    </p>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            {activities.length > 0 && (
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {activities.map((act, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 text-sm"
                                >
                                    <Badge variant="outline" className="capitalize text-xs">
                                        {act.type}
                                    </Badge>
                                    <span className="text-muted-foreground flex-1">
                                        {act.description || `${act.type} activity`}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(act.date).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

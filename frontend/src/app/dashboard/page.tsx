"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Brain,
    Map,
    BarChart3,
    Sparkles,
    ArrowRight,
} from "lucide-react";
import { Recommendations } from "@/components/dashboard/Recommendations";

const features = [
    {
        href: "/dashboard/chat",
        icon: MessageSquare,
        title: "AI Mentor Chat",
        description: "Get personalized help from your AI tutor",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
    },
    {
        href: "/dashboard/diagnosis",
        icon: Brain,
        title: "Skill Diagnosis",
        description: "Assess your skills with AI-powered tests",
        color: "text-purple-400",
        bg: "bg-purple-400/10",
    },
    {
        href: "/dashboard/roadmap",
        icon: Map,
        title: "Learning Roadmap",
        description: "Generate a personalized learning path",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
    },
    {
        href: "/dashboard/progress",
        icon: BarChart3,
        title: "Progress Tracker",
        description: "Track your streaks, stats, and growth",
        color: "text-amber-400",
        bg: "bg-amber-400/10",
    },
];

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Welcome back</p>
                </div>
                <h1 className="text-3xl font-bold">
                    Hey, {user?.name?.split(" ")[0]}! 👋
                </h1>
                <p className="text-muted-foreground">
                    What would you like to learn today?
                </p>
            </div>

            <Recommendations />

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                    <Link key={feature.href} href={feature.href}>
                        <Card className="group border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-start gap-4">
                                <div className={`p-3 rounded-xl ${feature.bg}`}>
                                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {feature.title}
                                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {feature.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Start */}
            <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="flex items-center justify-between p-6">
                    <div>
                        <h3 className="font-semibold text-lg">Ready to start learning?</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            Chat with your AI mentor or take a skill assessment
                        </p>
                    </div>
                    <Link href="/dashboard/chat">
                        <Button>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Start Chat
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

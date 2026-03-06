"use client";

import { useState, useEffect } from "react";
import { skillAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
    Brain,
    Loader2,
    ArrowRight,
    CheckCircle2,
    Code,
    Lightbulb,
    Puzzle,
    AlertCircle,
    ThumbsUp,
} from "lucide-react";

interface Question {
    number: number;
    total: number;
    type: string;
    difficulty: string;
    question: string;
    evaluation?: {
        isCorrect: boolean;
        score: number;
        feedback: string;
        mistakes?: string[];
        improvementSuggestions?: string[];
        correctSolution?: string;
    };
}

interface Scores {
    programming_score: number;
    logic_score: number;
    problem_solving_score: number;
}

const typeIcons: Record<string, React.ElementType> = {
    conceptual: Lightbulb,
    coding: Code,
    "problem-solving": Puzzle,
};

const difficultyColors: Record<string, string> = {
    easy: "bg-emerald-500/10 text-emerald-500",
    medium: "bg-amber-500/10 text-amber-500",
    hard: "bg-red-500/10 text-red-500",
};

export default function DiagnosisPage() {
    const [stage, setStage] = useState<"start" | "question" | "result">("start");
    const [category, setCategory] = useState("");
    const [diagnosisId, setDiagnosisId] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [answer, setAnswer] = useState("");
    const [feedback, setFeedback] = useState("");
    const [scores, setScores] = useState<Scores | null>(null);
    const [overallLevel, setOverallLevel] = useState("");
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Check for active diagnosis on mount
    useEffect(() => {
        const fetchActiveDiagnosis = async () => {
            try {
                const res = await skillAPI.getDiagnoses();
                const diagnoses = res.data.data.diagnoses;
                if (diagnoses && diagnoses.length > 0) {
                    const latest = diagnoses[0];
                    if (!latest.isCompleted) {
                        setDiagnosisId(latest._id);
                        setCategory(latest.category);
                        // Fetch the current question for this active diagnosis
                        const qRes = await skillAPI.getCurrentQuestion(latest._id);
                        setCurrentQuestion(qRes.data.data.currentQuestion);
                        setStage("question");
                    }
                }
            } catch (err) {
                console.error("Failed to fetch active diagnosis:", err);
            } finally {
                setPageLoading(false);
            }
        };
        fetchActiveDiagnosis();
    }, []);

    const startDiagnosis = async () => {
        if (!category.trim()) return;
        setLoading(true);
        try {
            const res = await skillAPI.startDiagnosis(category);
            setDiagnosisId(res.data.data.diagnosisId);
            setCurrentQuestion(res.data.data.currentQuestion);
            setStage("question");
        } catch {
            setFeedback("Failed to start diagnosis. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim()) return;
        setLoading(true);
        setFeedback("");
        try {
            const res = await skillAPI.submitAnswer(diagnosisId, answer);
            const data = res.data.data;

            setFeedback(data.evaluation?.feedback || "");

            // Attach evaluation to the current question so we can style it
            if (currentQuestion) {
                setCurrentQuestion({
                    ...currentQuestion,
                    evaluation: data.evaluation
                });
            }

            setAnswer("");

            if (data.completed) {
                setScores(data.scores);
                setOverallLevel(data.overallLevel);
                setRecommendations(data.recommendations || []);
                setSummary(data.summary || "");
                setStage("result");
            } else {
                setCurrentQuestion(data.nextQuestion);
            }
        } catch {
            setFeedback("Error submitting answer. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const restart = () => {
        setStage("start");
        setCategory("");
        setAnswer("");
        setFeedback("");
        setScores(null);
        setDiagnosisId("");
        setCurrentQuestion(null);
        setCurrentQuestion(null);
    };

    if (pageLoading) {
        return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div>;
    }

    // START SCREEN
    if (stage === "start") {
        return (
            <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 mb-2">
                        <Brain className="h-10 w-10 text-purple-400" />
                    </div>
                    <h1 className="text-3xl font-bold">Skill Diagnosis</h1>
                    <p className="text-muted-foreground">
                        Test your skills with 9 AI-powered questions across coding, concepts,
                        and problem-solving
                    </p>
                </div>

                <Card className="border-border/50">
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>What skill do you want to assess?</Label>
                            <Input
                                placeholder="e.g., JavaScript, Python, Data Structures"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && startDiagnosis()}
                            />
                        </div>
                        <Button
                            onClick={startDiagnosis}
                            disabled={loading || !category.trim()}
                            className="w-full"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <ArrowRight className="h-4 w-4 mr-2" />
                            )}
                            Start Diagnosis
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // QUESTION SCREEN
    if (stage === "question" && currentQuestion) {
        const progress = (currentQuestion.number / currentQuestion.total) * 100;
        const TypeIcon = typeIcons[currentQuestion.type] || Brain;

        return (
            <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Question {currentQuestion.number} of {currentQuestion.total}
                        </span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <Card className="border-border/50">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="gap-1">
                                <TypeIcon className="h-3 w-3" />
                                {currentQuestion.type}
                            </Badge>
                            <Badge
                                className={difficultyColors[currentQuestion.difficulty]}
                                variant="secondary"
                            >
                                {currentQuestion.difficulty}
                            </Badge>
                        </div>
                        <CardTitle className="text-lg leading-relaxed">
                            {currentQuestion.question}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentQuestion.evaluation && feedback && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Overall Feedback */}
                                <div className={`p-4 rounded-xl border-l-4 ${currentQuestion.evaluation.score >= 80 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400' : currentQuestion.evaluation.score >= 50 ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400' : 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-400'} shadow-sm`}>
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 mt-0.5">
                                            {currentQuestion.evaluation.score >= 80 ? (
                                                <ThumbsUp className="h-5 w-5" />
                                            ) : currentQuestion.evaluation.score >= 50 ? (
                                                <Lightbulb className="h-5 w-5" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm tracking-tight uppercase">AI Feedback</p>
                                                <span className="font-bold text-sm">Score: {currentQuestion.evaluation.score}/100</span>
                                            </div>
                                            <p className="text-sm leading-relaxed text-foreground opacity-90">{feedback}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mistakes Detected */}
                                {currentQuestion.evaluation.mistakes && currentQuestion.evaluation.mistakes.length > 0 && (
                                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
                                            <AlertCircle className="h-4 w-4" /> Mistakes Detected
                                        </h4>
                                        <ul className="space-y-2">
                                            {currentQuestion.evaluation.mistakes.map((mistake, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                                    <span className="text-red-500 shrink-0 mt-0.5">•</span>
                                                    <span>{mistake}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Improvement Suggestions */}
                                {currentQuestion.evaluation.improvementSuggestions && currentQuestion.evaluation.improvementSuggestions.length > 0 && (
                                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">
                                            <Lightbulb className="h-4 w-4" /> Suggestions for Improvement
                                        </h4>
                                        <ul className="space-y-2">
                                            {currentQuestion.evaluation.improvementSuggestions.map((suggestion, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                                    <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                                                    <span>{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Correct Solution */}
                                {currentQuestion.evaluation.correctSolution && (
                                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                                            <CheckCircle2 className="h-4 w-4" /> Recommended Solution
                                        </h4>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-[13px]">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    pre: ({ children }) => <pre className="bg-background !bg-card border border-border/50 p-4 rounded-lg overflow-x-auto shadow-sm my-2">{children}</pre>,
                                                    code: ({ children, className }) => {
                                                        const isInline = !className?.includes('language-');
                                                        return isInline
                                                            ? <code className="bg-background font-semibold px-1 py-0.5 rounded text-primary">{children}</code>
                                                            : <code className={className}>{children}</code>;
                                                    }
                                                }}
                                            >
                                                {String(currentQuestion.evaluation.correctSolution.includes('\n') && !currentQuestion.evaluation.correctSolution.startsWith('```')
                                                    ? `\`\`\`\n${currentQuestion.evaluation.correctSolution}\n\`\`\``
                                                    : currentQuestion.evaluation.correctSolution)}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <Textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            className="min-h-[120px]"
                        />
                        <Button
                            onClick={submitAnswer}
                            disabled={loading || !answer.trim()}
                            className="w-full"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <ArrowRight className="h-4 w-4 mr-2" />
                            )}
                            {currentQuestion.number === currentQuestion.total
                                ? "Submit & See Results"
                                : "Submit Answer"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // RESULT SCREEN
    if (stage === "result" && scores) {
        const scoreItems = [
            { label: "Programming", score: scores.programming_score, icon: Code, color: "text-blue-400" },
            { label: "Logic & Concepts", score: scores.logic_score, icon: Lightbulb, color: "text-amber-400" },
            { label: "Problem Solving", score: scores.problem_solving_score, icon: Puzzle, color: "text-emerald-400" },
        ];

        return (
            <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                    <h1 className="text-3xl font-bold">Diagnosis Complete!</h1>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                        Level: {overallLevel.toUpperCase()}
                    </Badge>
                </div>

                {summary && (
                    <Card className="border-border/50 bg-primary/5">
                        <CardContent className="pt-6 text-sm">{summary}</CardContent>
                    </Card>
                )}

                <div className="grid gap-4">
                    {scoreItems.map((item) => (
                        <Card key={item.label} className="border-border/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <item.icon className={`h-4 w-4 ${item.color}`} />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    <span className="font-bold">{item.score}/100</span>
                                </div>
                                <Progress value={item.score} className="h-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {recommendations.length > 0 && (
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Recommendations</CardTitle>
                            <CardDescription>Here&apos;s what to focus on next</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <span className="text-primary mt-0.5">•</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <Button onClick={restart} variant="outline" className="w-full">
                    Take Another Assessment
                </Button>
            </div>
        );
    }

    return null;
}

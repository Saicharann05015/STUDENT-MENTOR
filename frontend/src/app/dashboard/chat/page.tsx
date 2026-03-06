"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chatAPI } from "@/lib/api";
import { ContextWelcomeScreen } from "@/components/chat/ContextWelcomeScreen";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Send,
    Loader2,
    Bot,
    User,
    Plus,
    Sparkles,
    BookOpen,
    HelpCircle,
    Map,
} from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const contexts = [
    { value: "general", label: "General", icon: Sparkles },
    { value: "doubt-solving", label: "Doubt Solving", icon: HelpCircle },
    { value: "skill-diagnosis", label: "Skill Check", icon: BookOpen },
    { value: "roadmap", label: "Roadmap", icon: Map },
];

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ChatContent />
        </Suspense>
    );
}

function ChatContent() {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const [context, setContext] = useState("general");
    const scrollRef = useRef<HTMLDivElement>(null);
    const initialSend = useRef(false);

    useEffect(() => {
        if (!initialSend.current) {
            initialSend.current = true;
            const initCtx = searchParams.get("context");
            const initMsg = searchParams.get("initialMessage");
            if (initCtx) setContext(initCtx);
            // We use timeout to let state flush, then send the message immediately
            if (initMsg) {
                setTimeout(() => sendMessage(initMsg, initCtx || "general"), 100);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (overrideMsg?: string, overrideCtx?: string) => {
        const textToSend = overrideMsg || input.trim();
        if (!textToSend || loading) return;

        if (!overrideMsg) setInput("");
        setMessages((prev) => [...prev, { role: "user", content: textToSend }]);
        setLoading(true);

        const activeCtx = overrideCtx || context;

        try {
            let res;
            if (chatId) {
                res = await chatAPI.sendMessage({
                    message: textToSend,
                    chatId,
                    context: activeCtx,
                });
            } else {
                res = await chatAPI.newChat({
                    message: textToSend,
                    context: activeCtx,
                });
                setChatId(res.data.data.chatId);
            }
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: res.data.data.message },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const newChat = () => {
        setMessages([]);
        setChatId(null);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-border/50 p-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        AI Mentor
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your personal learning assistant
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={newChat}>
                    <Plus className="h-4 w-4 mr-1" /> New Chat
                </Button>
            </div>

            {/* Context Selector */}
            <div className="border-b border-border/50 px-4 py-3 flex gap-2 overflow-x-auto bg-background z-10">
                {contexts.map((ctx) => (
                    <Badge
                        key={ctx.value}
                        variant={context === ctx.value ? "default" : "outline"}
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => setContext(ctx.value)}
                    >
                        <ctx.icon className="h-3 w-3 mr-1" />
                        {ctx.label}
                    </Badge>
                ))}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 pt-10 pb-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <ContextWelcomeScreen context={context} onSendMessage={sendMessage} />
                ) : (
                    <div className="space-y-8 max-w-3xl mx-auto pb-6">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="p-2 rounded-lg bg-primary/10 h-fit">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <Card
                                    className={`max-w-[85%] p-5 shadow-sm border ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground border-primary/20"
                                        : "bg-card border-border/50"
                                        }`}
                                >
                                    <div className="text-sm prose-sm max-w-none break-words">
                                        {msg.role === "assistant" ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    pre: ({ children }) => <pre className="bg-muted p-3 rounded-xl overflow-x-auto my-3 border border-border/50 text-xs font-mono shadow-sm">{children}</pre>,
                                                    code: ({ children, className }) => {
                                                        const isInline = !className?.includes('language-');
                                                        return isInline ? (
                                                            <code className="bg-muted/80 px-1.5 py-0.5 rounded-md text-[13px] font-mono font-medium text-foreground">{children}</code>
                                                        ) : (
                                                            <code className={className}>{children}</code>
                                                        );
                                                    },
                                                    ul: ({ children }) => <ul className="list-disc pl-5 my-3 space-y-1.5 text-foreground/90">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal pl-5 my-3 space-y-1.5 text-foreground/90">{children}</ol>,
                                                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                                    p: ({ children }) => <p className="leading-relaxed mb-3 last:mb-0 text-foreground/90">{children}</p>,
                                                    h1: ({ children }) => <h1 className="text-xl font-bold mt-5 mb-3 text-foreground tracking-tight">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2 text-foreground tracking-tight">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-base font-medium mt-4 mb-2 text-foreground">{children}</h3>,
                                                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                                    a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">{children}</a>,
                                                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-3 bg-primary/5 rounded-r-lg italic text-muted-foreground">{children}</blockquote>
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        )}
                                    </div>
                                </Card>
                                {msg.role === "user" && (
                                    <div className="p-2 rounded-lg bg-muted h-fit">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <Card className="p-4 bg-card">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border/50 p-4">
                <div className="max-w-3xl mx-auto flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask your mentor anything..."
                        className="min-h-[44px] max-h-32 resize-none"
                        rows={1}
                    />
                    <Button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        size="icon"
                        className="shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

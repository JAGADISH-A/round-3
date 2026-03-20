"use client";

import React, { useState, useEffect, useRef } from "react";
import { History, Bot, Paperclip, MessageSquare, ChevronLeft, Trash2, Plus, FileText, Video, Map } from "lucide-react";
import { 
  ChatInput, 
  ChatInputTextArea, 
  ChatInputSubmit 
} from "./ChatInput";
import PromptBar from "./PromptBar";
import { cn } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/api-config";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getLatestMetrics } from "@/lib/vision-store";
import Image from "next/image";
import { motion } from "framer-motion";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: { text: string; relevance: number }[];
  model?: string;
  persona?: string;
  tone?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

const STORAGE_KEY = "careerspark_history";

function loadHistory(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 50)));
}

export default function ChatArea() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    const stored = loadHistory();
    setConversations(stored);
    
    // Check for auto-selection if no active id
    if (stored.length > 0) {
      const latest = stored[0];
      setActiveId(latest.id);
      setMessages(latest.messages);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const newConversation = () => {
    const id = Date.now().toString();
    const conv: Conversation = {
      id,
      title: "New Session",
      messages: [],
      createdAt: new Date().toLocaleString()
    };
    const updated = [conv, ...conversations];
    setConversations(updated);
    saveHistory(updated);
    setActiveId(id);
    setMessages([]);
    setShowHistory(false);
  };

  const switchConversation = (conv: Conversation) => {
    setActiveId(conv.id);
    setMessages(conv.messages);
    setShowHistory(false);
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    saveHistory(updated);
    if (activeId === id) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        setActiveId(null);
        setMessages([]);
      }
    }
  };

  const persistMessages = (updatedMessages: Message[], id: string | null) => {
    if (!id) return;
    const title = updatedMessages[0]?.content.slice(0, 40) ?? "New Session";
    const updated = conversations.map(c =>
      c.id === id ? { ...c, messages: updatedMessages, title } : c
    );
    // If new convo not yet in list, add it
    const exists = updated.some(c => c.id === id);
    const final = exists ? updated : [{ id, title, messages: updatedMessages, createdAt: new Date().toLocaleString() }, ...updated];
    setConversations(final);
    saveHistory(final);
  };

  const handleSend = async (
    selectedModel: string, 
    selectedPersona: string, 
    selectedTone: string,
    overrideValue?: string,
    analysisContext?: any
  ) => {
    const messageContent = overrideValue || inputValue;
    if (!messageContent.trim() || isThinking) return;

    // Create new conversation on first message
    let currentId = activeId;
    if (!currentId) {
      currentId = Date.now().toString();
      setActiveId(currentId);
    }

    let userContent = messageContent;
    
    // Inject Vision Metrics if in Face Reviewer mode
    if (selectedPersona === "face_reviewer") {
      const visionMetrics = getLatestMetrics();
      if (visionMetrics && visionMetrics.face_detected) {
        userContent = `You are an AI interview coach.

Analyze the candidate's facial behavior and message.

Facial Metrics:
Eye Contact: ${visionMetrics.eye_contact}%
Engagement: ${visionMetrics.engagement}%
Head Pose: ${visionMetrics.head_pose}
Confidence Score: ${visionMetrics.confidence_score}

User Message:
${messageContent}

Provide helpful interview coaching feedback.`;
      }
    }

    const userMessage: Message = {
      role: "user",
      content: userContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!overrideValue) setInputValue("");
    setIsThinking(true);

    try {
      const history = updatedMessages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(ENDPOINTS.MCP_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: history,
          model: selectedModel,
          persona: selectedPersona,
          tone: selectedTone,
          session_id: currentId,
          analysis_context: analysisContext
        }),
      });

      if (!res.ok) {
        let errorMsg = `Server error: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.detail || errorData.error || errorMsg;
        } catch (e) { /* fallback to status text */ }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const aiMessage: Message = {
        role: "ai",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources,
        model: data.model,
        persona: data.persona,
        tone: data.tone
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      persistMessages(finalMessages, currentId);
    } catch (err: any) {
      console.error("Chat error:", err);
      
      const isNetworkError = err instanceof TypeError || err.message?.includes("Failed to fetch");
      const errorMessage = isNetworkError 
        ? "AI Backend Unavailable. Ensure the Python service is running on http://localhost:8001"
        : `Error: ${err.message ?? "Connection to the AI brain failed"}`;

      const errMsg: Message = {
        role: "ai",
        content: errorMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const finalMessages = [...updatedMessages, errMsg];
      setMessages(finalMessages);
      persistMessages(finalMessages, currentId);
    } finally {
      setIsThinking(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-black text-[#FFD600] font-mono text-xs uppercase tracking-widest">Initializing AI...</div>}>
      <ChatContentWrapper 
        conversations={conversations}
        activeId={activeId}
        messages={messages}
        inputValue={inputValue}
        setInputValue={setInputValue}
        isThinking={isThinking}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        newConversation={newConversation}
        switchConversation={switchConversation}
        deleteConversation={deleteConversation}
        handleSend={handleSend}
        messagesEndRef={messagesEndRef}
      />
    </Suspense>
  );
}

function ChatContentWrapper(props: any) {
  const searchParams = useSearchParams();
  const initialPersona = searchParams.get("persona");
  
  return (
    <ChatContent 
      {...props}
      initialPersona={initialPersona ?? undefined}
    />
  );
}

function ChatContent({ 
  conversations, 
  activeId, 
  messages, 
  inputValue, 
  setInputValue, 
  isThinking, 
  showHistory, 
  setShowHistory, 
  newConversation, 
  switchConversation, 
  deleteConversation, 
  handleSend, 
  messagesEndRef,
  initialPersona
}: any) {
  // Handle Analysis Context Handoff
  useEffect(() => {
    if (typeof window === "undefined") return;
    const contextStr = sessionStorage.getItem("careerspark_analysis_context");
    // Only auto-start if we are in a fresh session (no messages)
    if (contextStr && messages.length === 0 && !isThinking) {
      try {
        const context = JSON.parse(contextStr);
        sessionStorage.removeItem("careerspark_analysis_context");
        
        // Auto-trigger first message
        setTimeout(() => {
          handleSend(
            "llama33", 
            initialPersona || "career_coach", 
            localStorage.getItem("careerspark_tone") || "friendly",
            "I'm ready to discuss my analysis results.",
            context
          );
        }, 500);
      } catch (e) {
        console.error("Failed to handle analysis context", e);
      }
    }
  }, [initialPersona, messages.length, isThinking, handleSend]);

  return (
    <div className="flex h-full bg-[#050505] text-white relative overflow-hidden">

      {/* ── History Panel ───────────────────────────────── */}
      <div className={cn(
        "absolute top-[64px] right-6 w-[320px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 z-30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-top-right",
        showHistory ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
      )}>
        <div className="h-[400px] flex flex-col">
        <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">History</span>
          <button onClick={() => setShowHistory(false)} className="text-zinc-600 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={newConversation}
          className="m-4 flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-white hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <Plus className="w-3.5 h-3.5" /> New Session
        </button>

        <div className="flex-1 px-3 space-y-1 pb-4 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-zinc-600 text-[10px] font-medium text-center py-8">No sessions yet.</p>
          )}
          {conversations.map((conv: any) => (
            <button
              key={conv.id}
              onClick={() => switchConversation(conv)}
              className={cn(
                "w-full text-left px-3 py-3 rounded-xl transition-all group flex items-start justify-between gap-2",
                conv.id === activeId
                  ? "bg-[#FFD600]/10 border border-[#FFD600]/20"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-[11px] font-bold truncate leading-tight",
                  conv.id === activeId ? "text-[#FFD600]" : "text-zinc-300"
                )}>
                  {conv.title}
                </p>
                <p className="text-[9px] text-zinc-600 mt-0.5 font-mono">{conv.messages.length} msgs · {conv.createdAt}</p>
              </div>
              <button
                onClick={(e) => deleteConversation(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      </div>
    </div>

      {/* ── Main Chat ────────────────────────────────────── */}
      <div className="flex flex-col h-full flex-1">

        {/* Header */}
        <header className="h-[64px] border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md shrink-0 py-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(255,214,0,0.1)]">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hive Intelligence Active</span>
            </div>
          </div>
        </div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={newConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <Plus className="w-3 h-3" /> New
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                showHistory
                  ? "bg-[#FFD600]/10 border-[#FFD600]/30 text-[#FFD600]"
                  : "bg-white/5 border-white/8 text-zinc-500 hover:text-white hover:bg-white/10"
              )}
            >
              <History className="w-3 h-3" />
              History {conversations.length > 0 && `(${conversations.length})`}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar">
          {messages.length === 0 && !isThinking && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-24 h-24 mb-10 relative group"
              >
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Image 
                  src="/logo.png" 
                  alt="BumbleBee" 
                  width={96} 
                  height={96} 
                  className="relative z-10 transition-transform duration-500 group-hover:scale-110" 
                />
              </motion.div>
              
              <h3 className="text-5xl font-bebas tracking-widest mb-4 text-white uppercase italic">
                How can the <span className="text-primary">Hive</span> help you today?
              </h3>
              <p className="text-zinc-500 text-sm max-w-md mb-12 font-medium tracking-wide">
                Ask anything about careers, interviews, resumes, or learning paths.
              </p>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                {[
                  "Improve my resume",
                  "Mock interview tips",
                  "Career roadmap",
                ].map((label, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(
                      localStorage.getItem("careerspark_model") || "llama33",
                      "career_coach",
                      localStorage.getItem("careerspark_tone") || "friendly",
                      label
                    )}
                    className="flex items-center px-6 py-2.5 rounded-full bg-[#111111] border border-white/5 text-zinc-400 hover:text-white hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 text-xs font-bold tracking-wide hover:scale-105"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg: any, i: number) => (
            <div key={i}
                className={cn(
                  "flex flex-col gap-2 max-w-[85%] md:max-w-[75%]",
                  msg.role === "user" ? "items-end ml-auto" : "items-start mr-auto"
                )}
              >
                <div
                  className={cn(
                    "px-5 py-3 rounded-[24px] text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-black font-medium rounded-tr-none shadow-[0_4px_15px_rgba(255,214,0,0.1)]"
                      : "bg-zinc-900 text-zinc-200 border border-white/5 rounded-tl-none"
                  )}
                >
                  {/* Metadata for AI messages */}
                  {msg.role !== "user" && (
                    <div className="text-[9px] font-black uppercase tracking-widest mb-1.5 text-zinc-400 flex items-center gap-2">
                      <span>{msg.persona || "AI Career Coach"}</span>
                      {msg.tone && (
                        <>
                          <span className="opacity-20">•</span>
                          <span className="opacity-60 capitalize">{msg.tone}</span>
                        </>
                      )}
                      {msg.model && (
                        <>
                          <span className="opacity-10">|</span>
                          <span className="opacity-30 text-[7px]">{msg.model}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap font-sans text-[14px] leading-7">{msg.content}</div>
                  <div className="mt-2 text-[9px] font-mono opacity-25">{msg.timestamp}</div>
                </div>
              </div>
          ))}

          {isThinking && (
            <div className="flex items-start">
              <div className="px-5 py-4 bg-[#0a0a0a] border border-[#FFD600]/10 rounded-2xl rounded-bl-sm flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#FFD600] rounded-full animate-bounce [animation-duration:0.7s]" />
                  <div className="w-1.5 h-1.5 bg-[#FFD600] rounded-full animate-bounce [animation-duration:0.7s] [animation-delay:0.15s]" />
                  <div className="w-1.5 h-1.5 bg-[#FFD600] rounded-full animate-bounce [animation-duration:0.7s] [animation-delay:0.3s]" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#FFD600]/60">Hive is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-6 pb-6 pt-0">
          <PromptBar
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSend}
            loading={isThinking}
            initialPersona={initialPersona}
          />
        </div>
      </div>
    </div>
  );
}

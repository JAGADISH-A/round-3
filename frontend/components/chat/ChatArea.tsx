"use client";

import React, { useState, useEffect, useRef } from "react";
import { History, Paperclip, MessageSquare, ChevronLeft, Trash2, Plus } from "lucide-react";
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
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-black text-[#00E6A8] font-mono text-xs uppercase tracking-widest">Initializing AI Coach...</div>}>
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
                  ? "bg-[#00E6A8]/10 border border-[#00E6A8]/20"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-[11px] font-bold truncate leading-tight",
                  conv.id === activeId ? "text-[#00E6A8]" : "text-zinc-300"
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
        <header className="h-[64px] border-b border-white/5 flex items-center justify-between px-6 bg-black/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00E6A8]/10 border border-[#00E6A8]/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#00E6A8]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">AI Career Coach</h2>
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
                  ? "bg-[#00E6A8]/10 border-[#00E6A8]/30 text-[#00E6A8]"
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
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#00E6A8]/5 border-2 border-[#00E6A8]/20 flex items-center justify-center mb-5">
                <MessageSquare className="w-8 h-8 text-[#00E6A8]/60" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Coaching Mode Active</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-mono">
                Ask about interview prep, roadmaps, technical concepts, or soft skills. Specialized personas are ready to mentor you.
              </p>
            </div>
          )}

          {messages.map((msg: any, i: number) => (
            <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[78%] px-5 py-4 text-sm leading-relaxed border-2",
                msg.role === "user"
                  ? "bg-zinc-950 border-white/8 text-white rounded-2xl rounded-br-sm"
                  : "bg-[#050505] border-[#00E6A8]/15 text-zinc-200 rounded-2xl rounded-bl-sm"
              )}>
                {/* Neo-brutalist label */}
                <div className={cn(
                  "text-[8px] font-black uppercase tracking-widest mb-2",
                  msg.role === "user" ? "text-zinc-700" : "text-[#00E6A8]/50"
                )}>
                  {msg.role === "user" ? "You" : (
                    <span className="flex items-center gap-2">
                      {msg.persona || "CareerCoach AI"}
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
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-wrap font-mono text-[13px] leading-6">{msg.content}</div>
                <div className="mt-2 text-[9px] font-mono opacity-25">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-start">
              <div className="px-5 py-4 bg-[#050505] border-2 border-[#00E6A8]/15 rounded-2xl rounded-bl-sm flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[#00E6A8] rounded-full animate-bounce [animation-duration:0.7s]" />
                  <div className="w-1.5 h-1.5 bg-[#00E6A8] rounded-full animate-bounce [animation-duration:0.7s] [animation-delay:0.15s]" />
                  <div className="w-1.5 h-1.5 bg-[#00E6A8] rounded-full animate-bounce [animation-duration:0.7s] [animation-delay:0.3s]" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#00E6A8]/60">AI is thinking...</span>
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

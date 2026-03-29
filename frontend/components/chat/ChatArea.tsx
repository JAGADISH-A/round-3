"use client";

import React, { useState, useEffect, useRef } from "react";
import { History, Bot, Paperclip, MessageSquare, ChevronLeft, Trash2, Plus, FileText, Video, Map } from "lucide-react";
import { 
  ChatInput, 
  ChatInputTextArea, 
  ChatInputSubmit 
} from "./ChatInput";
import PromptBar from "./PromptBar";
import { cn, detectLanguage } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/api-config";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getLatestMetrics } from "@/lib/vision-store";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useSpeech } from "@/hooks/useSpeech";
import { useTTS } from "@/hooks/useTTS";
import { translations } from "@/lib/translations";
import { useMemo } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: { text: string; relevance: number }[];
  model?: string;
  persona?: string;
  tone?: string;
  suggestions?: { label: string; level: string; description: string }[];
  options?: { id: string; title: string; desc: string }[];
  roadmapQuery?: string;
  type?: string;
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
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);

  const { lang } = useLanguage();
  const t = useMemo(() => translations[lang], [lang]);
  const { isListening, transcript, interimTranscript, detectedLang: speechDetectedLang, startListening, stopListening, setTranscript } = useSpeech(lang, (confidence) => {
    // Interrupt AI speech only when real speech detected (confidence-gated, debounced)
    interruptIfSpeaking(confidence);
  });
  const { speak, stop, interruptIfSpeaking, isSpeaking } = useTTS();
  const [activeLang, setActiveLang] = useState<"en" | "ta">("en");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("careerspark_voice_enabled") === "true";
    }
    return false;
  });

  // Persist voice preference
  useEffect(() => {
    localStorage.setItem("careerspark_voice_enabled", isVoiceEnabled.toString());
  }, [isVoiceEnabled]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingInterruptRef = useRef<boolean>(false);
  // Ref-based request lock — prevents overlapping API calls even across stale state
  const isProcessingRef = useRef(false);
  // True only while the user is actively speaking into the mic — guards input auto-fill
  const isUserSpeakingRef = useRef(false);
  // If user sends while a request is in progress, store params here and auto-fire after
  const pendingMessageRef = useRef<null | { model: string; persona: string; tone: string; value: string }>(null);
  // Drives UI disable state (input, send button, mic during processing)
  const [isProcessing, setIsProcessing] = useState(false);

  // Update activeLang based on UI language or speech detection
  useEffect(() => {
    setActiveLang(lang);
  }, [lang]);

  useEffect(() => {
    if (speechDetectedLang) {
      setActiveLang(speechDetectedLang);
    }
  }, [speechDetectedLang]);

  // Synchronize transcript to inputValue — ONLY when user is actively speaking.
  // This prevents TTS echo or stale recognition from polluting the input box.
  useEffect(() => {
    if (transcript && isUserSpeakingRef.current) {
      setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
      setTranscript(""); // Clear after injecting
    } else if (transcript && !isUserSpeakingRef.current) {
      // Discard echo — user is not speaking, this is TTS bleed
      setTranscript("");
    }
  }, [transcript, setTranscript]);

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

  const detectIntent = (text: string) => {
    const lowText = text.toLowerCase();
    if (lowText.includes("devops") && lowText.includes("roadmap")) return "devops_roadmap";
    if (lowText.includes("frontend") && lowText.includes("roadmap")) return "frontend_roadmap";
    if (lowText.includes("backend") && lowText.includes("roadmap")) return "backend_roadmap";
    if (lowText.includes("roadmap")) return "general_roadmap";
    return "general_chat";
  };

  const persistMessages = (updatedMsgs: Message[], id: string | null) => {
    if (!id) return;
    const title = updatedMsgs[0]?.content.slice(0, 40) ?? "New Session";
    // Use functional updater to always work with latest conversations state
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, messages: updatedMsgs, title } : c
      );
      const exists = updated.some(c => c.id === id);
      const final = exists ? updated : [{ id, title, messages: updatedMsgs, createdAt: new Date().toLocaleString() }, ...updated];
      saveHistory(final);
      return final;
    });
  };

    const handleFileUpload = async (file: File) => {
      setIsProcessing(true);
      setIsThinking(true);
      
      const id = Date.now().toString();
      const conv: Conversation = {
        id,
        title: "RES_SCAN: " + file.name.split('.')[0].toUpperCase(),
        messages: [],
        createdAt: new Date().toLocaleString()
      };
      setConversations(prev => [conv, ...prev]);
      setActiveId(id);
      setMessages([]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await fetch(ENDPOINTS.RESUME_UPLOAD, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Neural Link Failed.");
        const data = await res.json();
        
        // Update store
        useResumeStore.getState().setAnalysis(data);
        
        const welcomeMsg: Message = {
          role: "ai",
          content: `>>> NEURAL_ANALYSIS_COMPLETE\n\nI have finished scanning **${file.name}**. \nTarget Role: **${data.confirmed_role || data.inferred_role}** \nSignal Alignment: **${data.ats_score}%**\n\nHow shall we proceed with the optimization?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          persona: "resume_reviewer",
          type: "resume_analysis_result"
        };
        
        setMessages([welcomeMsg]);
        persistMessages([welcomeMsg], id);
      } catch (err: any) {
        setMessages([{
          role: "ai", 
          content: "PROTOCOL_ERROR: Resume data injection failed.",
          timestamp: new Date().toLocaleTimeString()
        }]);
      } finally {
        setIsThinking(false);
        setIsProcessing(false);
      }
    };

    const handleSend = async (
    selectedModel: string, 
    selectedPersona: string, 
    selectedTone: string,
    overrideValue?: string,
    analysisContext?: any
  ) => {
    const messageContent = overrideValue || inputValue;
    if (!messageContent.trim()) return;
    
    // Create new conversation on first message
    let currentId = activeId;
    if (!currentId) {
      currentId = Date.now().toString();
      setActiveId(currentId);
    }

    if (isProcessingRef.current) {
      pendingMessageRef.current = { model: selectedModel, persona: selectedPersona, tone: selectedTone, value: messageContent };
      return;
    }
    isProcessingRef.current = true;
    setIsProcessing(true);
    isUserSpeakingRef.current = false;

    const inputLang = detectLanguage(messageContent);
    setActiveLang(inputLang);
    stop();

    const detectedIntent = detectIntent(messageContent);
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
    
    // Interrupt any existing typing
    typingInterruptRef.current = true;

    try {
      // Intent-based context reset: If a roadmap is requested, 
      // reduce history to avoid interference from previous context.
      const historyLimit = detectedIntent !== "general_chat" ? 2 : 10;
      const history = updatedMessages.slice(-(historyLimit + 1)).map(m => ({ role: m.role, content: m.content }));

      // Fetch User Profile from localStorage
      let userProfile = null;
      try {
        const savedAnalysis = localStorage.getItem("careerspark_resume_analysis");
        if (savedAnalysis) {
          const analysis = JSON.parse(savedAnalysis);
          userProfile = {
            goal: analysis.career_goal || "Career Development",
            skills: analysis.skills || []
          };
        }
      } catch (e) { console.error("Failed to parse user profile", e); }

      let dynamicAnalysisContext = analysisContext;
      if (selectedPersona === "resume_reviewer") {
        const storeState = useResumeStore.getState();
        dynamicAnalysisContext = {
          type: "resume",
          role: storeState.analysis?.confirmed_role || "Software Engineer",
          summary: "Resume analyzed for " + (storeState.analysis?.confirmed_role || "Software Engineer"),
          strengths: storeState.analysis?.skills?.slice(0, 5) || [],
          weaknesses: storeState.analysis?.skill_gap || [],
          suggestions: storeState.analysis?.improvement_checklist?.map((i: any) => i.task) || [],
          resume_text: storeState.resumeText || storeState.analysis?.full_text || "",
        };
      }

      const res = await fetch(ENDPOINTS.MCP_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: history,
          model: selectedModel,
          persona: selectedPersona,
          tone: selectedTone,
          session_id: currentId,
          analysis_context: dynamicAnalysisContext,
          lang: inputLang,    // always use locally-captured lang NOT stale activeLang state
          intent: detectedIntent,
          user_profile: userProfile
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
      setIsThinking(false);

      const aiResponse = data.response || "No response received.";
      const aiMessage: Message = {
        role: "ai",
        content: "", // Start empty for typing effect
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources,
        model: data.model,
        persona: data.persona,
        tone: data.tone,
        type: data.type,
        options: data.options,
        roadmapQuery: data.query
      };

      const messagesWithEmptyAi = [...updatedMessages, aiMessage];
      const aiMsgIndex = messagesWithEmptyAi.length - 1;
      setMessages(messagesWithEmptyAi);
      setTypingMessageId(aiMsgIndex);
      typingInterruptRef.current = false;

        // Trigger TTS immediately BEFORE typing animation
        // This ensures audio starts as soon as the response is available.
        if (isVoiceEnabled) {
          // Use backend-sanitized tts_text if available, otherwise fallback to response
          const speechText = data.tts_text || aiResponse;
          // Use backend-returned lang for max reliability, fallback to local detection
          speak(speechText, (data.lang as "en" | "ta") || inputLang);
        }

        // --- Optimized Typing Animation (runs AFTER TTS is queued) ---
      let currentContent = "";
      const totalChars = aiResponse.length;
      
      // Dynamic speed: faster for long texts, slower for short
      const baseDelay = totalChars > 500 ? 5 : (totalChars > 200 ? 10 : 15);
      
      for (let i = 0; i < totalChars; i++) {
        // Check for interruption
        if (typingInterruptRef.current) break;

        currentContent += aiResponse[i];
        
        // Batch updates every 3 chars OR if it's the end
        if (i % 3 === 0 || i === totalChars - 1) {
          setMessages(prev => {
            const temp = [...prev];
            if (temp[aiMsgIndex]) {
              temp[aiMsgIndex] = { ...temp[aiMsgIndex], content: currentContent };
            }
            return temp;
          });
          
          // Small variance in speed
          const jitter = Math.random() * 5;
          await new Promise(r => setTimeout(r, baseDelay + jitter));
        }
      }

      setTypingMessageId(null);
      persistMessages([...updatedMessages, { ...aiMessage, content: aiResponse }], currentId);

    } catch (err: any) {
      console.error("Chat error:", err);
      setIsThinking(false);
      isProcessingRef.current = false;
      
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
      isProcessingRef.current = false;
      setIsProcessing(false);
      const pending = pendingMessageRef.current;
      if (pending) {
        pendingMessageRef.current = null;
        setTimeout(() => handleSend(pending.model, pending.persona, pending.tone, pending.value), 50);
      }
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
        handleFileUpload={handleFileUpload}
        messagesEndRef={messagesEndRef}
        typingMessageId={typingMessageId}
        isListening={isListening}
        interimTranscript={interimTranscript}
        onMicToggle={isListening
          ? () => { isUserSpeakingRef.current = false; stopListening(); }
          : () => { isUserSpeakingRef.current = true; startListening(); }
        }
        isSpeaking={isSpeaking}
        isVoiceEnabled={isVoiceEnabled}
        onVoiceToggle={setIsVoiceEnabled}
        t={t}
        speak={speak}
        activeLang={activeLang}
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
  typingMessageId,
  isListening,
  interimTranscript,
  onMicToggle,
  isSpeaking,
  isVoiceEnabled,
  onVoiceToggle,
  t,
  initialPersona,
  speak,
  activeLang,
  handleFileUpload
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
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">{t.sidebar.history}</span>
          <button onClick={() => setShowHistory(false)} className="text-zinc-600 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={newConversation}
          className="m-4 flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-white hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <Plus className="w-3.5 h-3.5" /> {t.sidebar.new_session}
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
                "w-full text-left px-3 py-3 rounded-xl transition-all group flex items-start justify-between gap-2 border-l-2",
                conv.id === activeId
                  ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                  : "hover:bg-white/5 border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-[11px] font-bold truncate leading-tight tracking-wide font-nav",
                  conv.id === activeId ? "text-cyan-400" : "text-zinc-300"
                )}>
                  {conv.title.toUpperCase()}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-zinc-600 font-mono tracking-tighter">[{conv.messages.length} BITS]</span>
                  <span className="text-[9px] text-zinc-600 font-mono italic">SYNC: {conv.createdAt}</span>
                </div>
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
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.chat.intel_active}</span>
            </div>
          </div>
        </div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={newConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <Plus className="w-3 h-3" /> {t.chat.new}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                showHistory
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-white/5 border-white/8 text-zinc-500 hover:text-white hover:bg-white/10"
              )}
            >
              <History className="w-3 h-3" />
              {t.chat.history_label} {conversations.length > 0 && `(${conversations.length})`}
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
                {t.chat.empty_title_prefix}<span className="text-primary">{t.chat.hive}</span>{t.chat.empty_title_suffix}
              </h3>
              <p className="text-zinc-500 text-sm max-w-md mb-12 font-medium tracking-wide">
                {t.chat.empty_subtitle}
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
                    "px-5 py-3 rounded-[24px] text-sm leading-relaxed break-words overflow-hidden",
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
                   <div className="whitespace-pre-wrap break-words font-sans text-[14px] leading-7 min-w-0">
                    {msg.content}
                    {msg.role === "ai" && typingMessageId === i && (
                      <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-pulse align-middle">▌</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between opacity-50">
                    <span className="text-[9px] font-mono opacity-50">{msg.timestamp}</span>
                    {msg.role === "ai" && (
                      <button
                        onClick={() => speak(msg.content, (msg.lang as "en" | "ta") || activeLang)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-[9px] uppercase tracking-widest font-bold text-zinc-300"
                        title="Read message aloud"
                      >
                         <Volume2 className="w-3 h-3" /> Play
                      </button>
                    )}
                  </div>
                </div>

                {/* Interactive Roadmap Options (JSON-Based) */}
                {msg.role === "ai" && msg.type === "roadmap_options" && msg.options && (
                  <div className="flex flex-col gap-3 mt-4 w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <div className="flex flex-wrap gap-2">
                    {msg.options.map((option: any) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          const isRoadmapLevel = ["beginner", "advanced", "specialized"].includes(option.id);
                          handleSend(
                            localStorage.getItem("careerspark_model") || "llama33",
                            msg.persona || "career_coach",
                            msg.tone || "friendly",
                            isRoadmapLevel ? JSON.stringify({
                              type: "roadmap_selection",
                              selected: option.id,
                              query: msg.roadmapQuery || "Software Engineer"
                            }) : option.title
                          );
                        }}
                        className="group relative flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-white/5 hover:border-primary/40 hover:from-primary/10 hover:to-primary/5 transition-all duration-500 min-w-[200px] flex-1 text-left"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-primary group-hover:text-white uppercase tracking-wider transition-colors">
                            {option.title}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-300 transition-colors">
                            {option.desc}
                          </span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 rotate-180 transition-all duration-300 translate-x-2 group-hover:translate-x-0" />
                      </button>
                    ))}
                    </div>
                  </div>
                )}

                {/* Interactive Roadmap Options (JSON-Based) */}
                {msg.role === "ai" && msg.type === "roadmap_options" && msg.options && (
                  <div className="flex flex-col gap-3 mt-4 w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <div className="flex flex-wrap gap-2">
                    {msg.options.map((option: any) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          const isRoadmapLevel = ["beginner", "advanced", "specialized"].includes(option.id);
                          handleSend(
                            localStorage.getItem("careerspark_model") || "llama33",
                            msg.persona || "career_coach",
                            msg.tone || "friendly",
                            isRoadmapLevel ? JSON.stringify({
                              type: "roadmap_selection",
                              selected: option.id,
                              query: msg.roadmapQuery || "Software Engineer"
                            }) : option.title
                          );
                        }}
                        className="group relative flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-white/5 hover:border-cyan-500/40 hover:from-cyan-500/10 hover:to-cyan-500/5 transition-all duration-500 min-w-[200px] flex-1 text-left"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-cyan-400 group-hover:text-white uppercase tracking-wider transition-colors">
                            {option.title}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-300 transition-colors">
                            {option.desc}
                          </span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 rotate-180 transition-all duration-300 translate-x-2 group-hover:translate-x-0" />
                      </button>
                    ))}
                    </div>
                  </div>
                )}

                {/* Specialized Resume Analysis Result rendering */}
                {msg.role === "ai" && msg.persona === "resume_reviewer" && (
                  <div className="mt-4 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 animate-in fade-in slide-in-from-bottom-2 duration-700 w-full max-w-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl font-bold text-cyan-400">
                         {useResumeStore.getState().analysis?.ats_score || "--"}%
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">ATS Readiness</span>
                        <span className="text-xs font-bold text-zinc-300">Neural alignment score</span>
                      </div>
                    </div>
                    {/* Progress Bar HUD */}
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4 border border-white/5">
                      <div 
                        className="h-full bg-cyan-400 transition-all duration-1000 origin-left" 
                        style={{ width: `${useResumeStore.getState().analysis?.ats_score || 0}%` }} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                          <span className="text-[8px] uppercase text-zinc-600 block">Candidate Role</span>
                          <span className="text-[10px] font-bold text-cyan-500 truncate block">
                            {useResumeStore.getState().analysis?.confirmed_role || "Scanning..."}
                          </span>
                       </div>
                       <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                          <span className="text-[8px] uppercase text-zinc-600 block">Career Goal</span>
                          <span className="text-[10px] font-bold text-cyan-500 truncate block">
                            {useResumeStore.getState().analysis?.career_goal || "General"}
                          </span>
                       </div>
                    </div>
                  </div>
                )}
              </div>
          ))}

          {(isThinking || isSpeaking) && (
            <div className="flex items-start">
              <div className="px-5 py-4 bg-[#0a0a0a] border border-[#FFD600]/10 rounded-2xl rounded-bl-sm flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 bg-[#FFD600] rounded-full animate-bounce [animation-duration:0.7s]",
                    isSpeaking && "animate-pulse origin-center scale-110"
                  )} />
                  <div className={cn(
                    "w-1.5 h-1.5 bg-[#FFD600] rounded-full animate-bounce [animation-duration:0.7s] [animation-delay:0.15s]",
                    isSpeaking && "animate-pulse origin-center scale-110"
                  )} />
                   <div className={cn(
                    "w-1.5 h-1.5 bg-[#FFD600] rounded-full animate-bounce [animation-duration:0.7s] [animation-delay:0.3s]",
                    isSpeaking && "animate-pulse origin-center scale-110"
                  )} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#FFD600]/60 flex items-center gap-2">
                  {isSpeaking ? (
                    <>
                      <Volume2 className="w-3 h-3 animate-pulse" />
                      {t.chat.speaking ?? "Speaking..."}
                    </>
                  ) : (
                    isListening ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse">●</span>
                        {interimTranscript || t.chat.listening}
                      </div>
                    ) : t.chat.thinking
                  )}
                </span>
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
            isListening={isListening}
            onMicToggle={onMicToggle}
            initialPersona={initialPersona}
            isVoiceEnabled={isVoiceEnabled}
            onVoiceToggle={onVoiceToggle}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * useVoiceState.ts
 *
 * Live WebRTC voice connection via @vapi-ai/web SDK v2.5.2.
 * Supports Interview Coaching and Arena Battle scenarios
 * with 5-node redundancy failover cluster.
 *
 * SDK start() signature (from vapi.d.ts L123):
 *   start(assistant?: CreateAssistantDTO | string, assistantOverrides?: AssistantOverrides, ...)
 *
 * AssistantOverrides accepted fields (from api.d.ts L9493-9769):
 *   firstMessage, variableValues, model, voice, transcriber,
 *   maxDurationSeconds, backgroundSound, metadata, etc.
 *
 * ⚠️  "instructions" is NOT a valid AssistantOverrides field.
 *     System prompts must go through model.messages[] or variableValues.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import type { AssistantOverrides } from "@vapi-ai/web/dist/api";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "connecting";

interface VoiceHookConfig {
  role?: string;
  difficulty?: string;
  focusArea?: string;
  lang?: string;
  systemPrompt?: string;
  firstMessage?: string;
  onTranscript?: (text: string) => void;
  onTurnEnd?: (userText: string) => void;
}

// ── Credential resolver (compile-time env constants, hoisted) ────────────
const getCredentials = (nodeIndex: number) => {
  const envMap: Record<number, { key: string; id: string }> = {
    1: {
      key: process.env.NEXT_PUBLIC_VAPI_API_KEY ?? "",
      id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "",
    },
    2: {
      key: process.env.NEXT_PUBLIC_VAPI_API_KEY_2 ?? "",
      id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_2 ?? "",
    },
    3: {
      key: process.env.NEXT_PUBLIC_VAPI_API_KEY_3 ?? "",
      id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_3 ?? "",
    },
    4: {
      key: process.env.NEXT_PUBLIC_VAPI_API_KEY_4 ?? "",
      id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_4 ?? "",
    },
    5: {
      key: process.env.NEXT_PUBLIC_VAPI_API_KEY_5 ?? "",
      id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_5 ?? "",
    },
  };
  const node = envMap[nodeIndex];
  return node ? { apiKey: node.key, assistantId: node.id } : { apiKey: "", assistantId: "" };
};

// ── Validate credentials before use ──────────────────────────────────────
const validateCredentials = (apiKey: string, assistantId: string, nodeIndex: number) => {
  if (!apiKey || apiKey.trim().length === 0) {
    console.warn(`VAPI_CLUSTER: Node ${nodeIndex} missing API key`);
    return false;
  }
  if (!assistantId || assistantId.trim().length === 0) {
    console.warn(`VAPI_CLUSTER: Node ${nodeIndex} missing Assistant ID`);
    return false;
  }
  return true;
};

export function useVoiceState({
  role,
  difficulty,
  focusArea,
  lang = "en",
  systemPrompt,
  firstMessage,
  onTranscript,
  onTurnEnd,
}: VoiceHookConfig) {
  const [state, setState] = useState<VoiceState>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isExhausted, setIsExhausted] = useState(false);
  const [activeNode, setActiveNode] = useState(1);

  const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);
  const isRunningRef = useRef(false);
  const failoverInProgressRef = useRef(false);

  // Stable callback refs — callers don't need to memoize
  const onTranscriptRef = useRef(onTranscript);
  const onTurnEndRef = useRef(onTurnEnd);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onTurnEndRef.current = onTurnEnd; }, [onTurnEnd]);

  // ── Build SDK-valid AssistantOverrides ─────────────────────────────────
  const buildOverrides = useCallback((): AssistantOverrides => {
    const isTamil = lang === "ta";
    const currentRole = role || "Expert AI Coach";
    const currentArea = focusArea || "Dynamic Career Interaction";

    const overrides: AssistantOverrides = {};

    // firstMessage: valid top-level AssistantOverrides field (api.d.ts L9506)
    overrides.firstMessage = firstMessage || (isTamil
      ? `வணக்கம்! ${currentRole} நேர்காணலைத் தொடங்க தயாரா?`
      : `Hello! Ready to start your ${currentRole} session?`);

    // System prompt injection via variableValues (api.d.ts L9683)
    // Template variables in the VAPI dashboard prompt: {{ role }}, {{ focus_area }}, {{ language }}
    overrides.variableValues = {
      role: currentRole,
      focus_area: currentArea,
      language: isTamil ? "Tamil" : "English",
      difficulty: difficulty || "medium",
    };

    // If a full system prompt override is provided, pass it via model.messages
    // This is the ONLY correct way to override instructions at runtime
    if (systemPrompt) {
      overrides.model = {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }],
      } as any;
    }

    return overrides;
  }, [role, difficulty, focusArea, lang, systemPrompt, firstMessage]);

  // ── Start call with failover ──────────────────────────────────────────
  const start = useCallback(async (retryIndex = 1, withOverrides = true) => {
    if (isRunningRef.current && retryIndex === 1) return;

    // Cluster exhausted
    if (retryIndex > 5) {
      console.error("VAPI_CLUSTER_CRITICAL: All 5 redundancy nodes exhausted.");
      failoverInProgressRef.current = false;
      isRunningRef.current = false;
      setIsRunning(false);
      setIsExhausted(true);
      setState("idle");
      return;
    }

    const { apiKey, assistantId } = getCredentials(retryIndex);

    // Skip misconfigured nodes
    if (!validateCredentials(apiKey, assistantId, retryIndex)) {
      return start(retryIndex + 1, withOverrides);
    }

    try {
      setState("connecting");
      setActiveNode(retryIndex);
      setIsExhausted(false);

      const vapiClient = new Vapi(apiKey);
      vapiRef.current = vapiClient;

      // ── Event handlers ──────────────────────────────────────────
      vapiClient.on("call-start", () => {
        failoverInProgressRef.current = false;
        isRunningRef.current = true;
        setIsRunning(true);
        setState("listening");
        if (process.env.NODE_ENV === "development") {
          console.log(`VAPI: Link established on Node ${retryIndex}`);
        }
      });

      vapiClient.on("speech-start", () => setState("speaking"));
      vapiClient.on("speech-end", () => setState("listening"));

      vapiClient.on("message", (msg: any) => {
        if (msg.type === "transcript" && msg.role === "user") {
          setTranscript(msg.transcript);
          onTranscriptRef.current?.(msg.transcript);

          if (msg.transcriptType === "final") {
            setState("thinking");
            onTurnEndRef.current?.(msg.transcript);
          }
        }
      });

      vapiClient.on("call-end", () => {
        if (!failoverInProgressRef.current) {
          isRunningRef.current = false;
          setIsRunning(false);
          setState("idle");
        }
      });

      vapiClient.on("error", (error: any) => {
        console.error(`VAPI: Node ${retryIndex} failure:`, error);

        // Prevent parallel failover chains
        if (failoverInProgressRef.current) return;
        failoverInProgressRef.current = true;

        // Silent teardown — keeps CallOverlay mounted during transition
        try { vapiClient.stop(); } catch (_) {}
        vapiRef.current = null;

        // If overrides caused the 400, retry same node WITHOUT overrides
        if (withOverrides) {
          console.warn(`VAPI: Retrying Node ${retryIndex} without overrides (bare assistantId)...`);
          failoverInProgressRef.current = false;
          start(retryIndex, false);
          return;
        }

        // Otherwise, failover to next node
        setState("connecting");
        start(retryIndex + 1, true);
      });

      // ── Build payload ─────────────────────────────────────────
      const overrides = withOverrides ? buildOverrides() : undefined;

      if (process.env.NODE_ENV === "development") {
        console.log("VAPI START PAYLOAD:", {
          node: retryIndex,
          assistantId: `${assistantId.substring(0, 8)}...`,
          apiKey: `${apiKey.substring(0, 8)}...`,
          withOverrides,
          overrides,
        });
      }

      // SDK signature: start(assistantId: string, overrides?: AssistantOverrides)
      await vapiClient.start(assistantId, overrides);

    } catch (err) {
      console.error(`VAPI: Failed to initialize Node ${retryIndex}. Attempting failover...`, err);

      // If overrides caused the throw, retry same node bare
      if (withOverrides) {
        console.warn(`VAPI: Retrying Node ${retryIndex} bare after throw...`);
        start(retryIndex, false);
        return;
      }

      start(retryIndex + 1, true);
    }
  }, [buildOverrides]);

  // ── Stop call ─────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    failoverInProgressRef.current = false;
    if (vapiRef.current) {
      vapiRef.current.stop();
      vapiRef.current = null;
    }
    isRunningRef.current = false;
    setIsRunning(false);
    setState("idle");
  }, []);

  // ── Force-reset entire cluster ────────────────────────────────────────
  const resetCluster = useCallback(() => {
    failoverInProgressRef.current = false;
    if (vapiRef.current) {
      try { vapiRef.current.stop(); } catch (_) {}
      vapiRef.current = null;
    }
    isRunningRef.current = false;
    setIsRunning(false);
    setIsExhausted(false);
    start(1, true);
  }, [start]);

  return { state, transcript, isRunning, isExhausted, activeNode, start, stop, resetCluster };
}

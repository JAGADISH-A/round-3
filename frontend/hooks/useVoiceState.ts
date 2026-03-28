/**
 * useVoiceState.ts
 * 
 * Replaces the mock simulation with a live WebRTC `@vapi-ai/web` connection.
 * Instantiates the client dynamically using the active API key from the UI 
 * so the user can hot-swap accounts seamlessly.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import Vapi from "@vapi-ai/web";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "connecting";

interface UseVoiceStateProps {
  apiKey: string;
  assistantId: string;
  role?: string;
  difficulty?: string;
  focusArea?: string;
}

export function useVoiceState({ apiKey, assistantId, role, difficulty, focusArea }: UseVoiceStateProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const vapiRef = useRef<any>(null);

  const start = useCallback(async () => {
    if (isRunning) return;
    
    if (!apiKey || !assistantId) {
      console.error("VAPI cannot start: Missing apiKey or assistantId in environment variables.");
      alert("Error: VAPI API Key or Assistant ID is missing. Please check your .env.local file.");
      return;
    }
    
    try {
      setState("connecting");
      
      const vapiClient = new Vapi(apiKey);
      vapiRef.current = vapiClient;

      vapiClient.on("call-start", () => {
        if (process.env.NODE_ENV === "development") console.log("VAPI: Call Started");
        setIsRunning(true);
        setState("listening");
      });

      vapiClient.on("speech-start", () => {
        if (process.env.NODE_ENV === "development") console.log("VAPI: AI Speaking...");
        setState("speaking");
      });

      vapiClient.on("speech-end", () => {
        if (process.env.NODE_ENV === "development") console.log("VAPI: AI Stopped Speaking");
        setState("listening");
      });

      // Volume level fires continuously while audio is playing — 
      // this reinforces speaking state even if speech-start was missed
      vapiClient.on("volume-level", (volume: number) => {
        if (volume > 0.005) {
          setState((prev) => {
            if (prev === "listening" || prev === "thinking" || prev === "connecting") {
              if (process.env.NODE_ENV === "development") console.debug("VAPI: Volume boost detected -> speaking");
              return "speaking";
            }
            return prev;
          });
        }
      });

      vapiClient.on("message", (msg: any) => {
        if (msg.type === "transcript" && msg.role === "user" && msg.transcriptType === "final") {
          setState("thinking");
        }
      });

      vapiClient.on("call-end", () => {
        if (process.env.NODE_ENV === "development") console.log("VAPI: Call Ended");
        setIsRunning(false);
        setState("idle");
      });

      vapiClient.on("error", (error: any) => {
        console.error("VAPI: Connection Error:", error);
        setIsRunning(false);
        setState("idle");
      });

      // Construct dynamic overrides to shape the AI's behavior based on the Gamified UI selections
      const dynamicFirstMessage = `Hello! I am your AI Coach. Are you ready to begin your ${difficulty?.toLowerCase() || 'practice'} interview for the ${role || 'user'} position, focusing on ${focusArea?.toLowerCase() || 'your skills'}?`;

      const assistantOverrides = {
        firstMessage: dynamicFirstMessage,
        // Depending on your VAPI assistant config, you can also inject variableValues here:
        variableValues: {
          role: role || "",
          difficulty: difficulty || "",
          focusArea: focusArea || ""
        }
      };

      if (process.env.NODE_ENV === "development") {
        console.log("Connecting to VAPI with overrides:", assistantOverrides);
      }
      await vapiClient.start(assistantId, assistantOverrides);

    } catch (err) {
      console.error("VAPI: Failed to start VAPI Stream:", err);
      setState("idle");
      setIsRunning(false);
    }
  }, [apiKey, assistantId, role, difficulty, focusArea]);

  const stop = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      vapiRef.current = null;
    }
    setIsRunning(false);
    setState("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  return { state, start, stop, isRunning };
}

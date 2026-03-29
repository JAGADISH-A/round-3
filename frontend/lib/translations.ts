export const translations: Record<string, any> = {
  en: {
    sidebar: {
      dashboard: "Dashboard",
      chat: "Chat",
      voice: "Voice Lab",
      roadmap: "Roadmap",
      prep: "Interview Prep",
      resume_analyzer: "Resume Analyzer",
      interview: "Mock Interview",
      study_hub: "Study Hub",
      history: "History",
      new_session: "New Session",
      settings: "Settings",
      logout: "Logout",
    },
    chat: {
      placeholder: "How can the Hive help you today?",
      empty_title_prefix: "How can the ",
      empty_title_suffix: " help today?",
      hive: "Hive",
      empty_subtitle: "Ask anything about careers, interviews, or learning paths.",
      thinking: "Thinking...",
      listening: "Listening...",
      stop_listening: "Stop",
      new: "New",
      history_label: "History",
      intel_active: "Intelligence Active",
    },
    personas: {
      career_coach: "Career Coach",
      programming_tutor: "Programming Tutor",
      technical_interviewer: "Technical Interviewer",
      soft_skill_tutor: "Soft Skill Tutor",
      resume_reviewer: "Resume Reviewer",
      voice_reviewer: "Voice Reviewer",
      face_reviewer: "Interview Presentation Coach",
    },
    tones: {
      friendly: "Friendly",
      strict: "Strict",
      tutor: "Tutor",
      motivational: "Motivational",
      funny: "Funny",
      mentor: "Mentor",
    },
    common: {
      soon: "Soon",
      error: "Error",
      retry: "Retry",
      uplink: "Uplink",
      stable: "STABLE",
      terminal: "Terminal"
    },
    interview: {
      module: "Neural Roleplay Module v4.0",
      title: "VOICE_ARENA",
      subtitle: "Level up your soft skills with real-time AI roleplay. Error margin: 0.02%.",
      coaches: {
        mascot: "Mascot",
        buster: "Buster",
        alex: "Alex",
        zorbo: "Zorbo"
      },
      status: {
        idle: "IDLE_READY",
        listening: "SIGNAL_RECEIVE",
        thinking: "NEURAL_PROCESS",
        speaking: "TRANSMIT_VOICE",
        connecting: "BUFFER_SYNC"
      }
    },
    setup: {
      title: "SESSION_SETUP",
      subtitle: "Neural Path Initialization",
      target: "TARGET_NODE",
      difficulty: "DIFFICULTY_LEVEL",
      focus: "CORE_FOCUS",
      start: "INITIALIZE_INTERVIEW",
      stop: "TERMINATE_PRACTICE",
      roles: {
        frontend: "Frontend Developer",
        backend: "Backend Developer",
        product: "Product Manager",
        hr: "HR Interview",
        communication: "Communication Practice"
      },
      difficulties: {
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced"
      },
      focus_areas: {
        behavioral: "Behavioral Questions",
        communication: "Communication",
        confidence: "Confidence Building",
        technical: "Technical Clarity"
      }
    },
    resume: {
      title: "RESUME_INTELLIGENCE",
      subtitle: "Neural Content Analysis",
      initializing: "INITIALIZING_ANALYSIS",
      awaiting_stream: "Awaiting Data Input Stream...",
      hydrating: "Hydrating Neural Session...",
      reset: "RESET",
      dashboard_view: "DASHBOARD_VIEW",
      edit_stream: "LIVE_EDIT_STREAM",
      consult_ai: "CONSULT_AI",
      target_node: "Target Node",
      unknown_role: "Unknown Role",
      skill_context: "Worked with {skill} in a project context",
      analyzing_label: "ANALYZING",
      radar: {
        title: "SKILL_PERFORMANCE",
        accent: "RADAR",
        subtitle: "Neural Capability Cross-Reference",
        subjects: {
          skills: "Skills",
          ats: "ATS Score",
          impact: "Impact",
          readiness: "Readiness",
          projects: "Projects"
        }
      },
      readiness: {
        title: "READINESS_INDEX",
        beginner: "BEGINNER",
        improving: "IMPROVING",
        ready: "INTERVIEW READY",
        strong: "STRONG CANDIDATE"
      },
      gap_detected: "GAP_DETECTED",
      growth_nodes: "GROWTH_NODES",
      no_gaps: "No gaps detected",
      jd_match: {
        title: "JD_MATCH",
        accent: "SCORE",
        subtitle: "Job Description Alignment Logic",
        analyzing: "ANALYZING",
        signal_lock: "SIGNAL_LOCK",
        nodes_matched: "NODES_MATCHED",
        matched_kws: "MATCHED_KWS",
        gap_injection: "GAP_INJECTION",
        no_data: "NO_JOB_DATA_LOADED",
        protocol: "ALIGNMENT_PROTOCOL_v4",
        semantic: "SEMANTIC_MAP",
        density: "KEYWORD_DENSITY",
        sync_matched: "Neural_Sync_Matched",
        no_signals: "NO_SIGNALS_DETECTED",
        gap_detected: "Critical_Gap_Detected",
        perfect: "PERFECT_ALIGNMENT",
        hardware: "ATS_HARDWARE_DECONSTRUCTION"
      },
      insights: {
        title: "ACTION_INSIGHTS",
        subtitle: "Neural Optimization Suggestions",
        critical: "Critical Gap"
      },
      bullets: {
        title: "SUGGESTED_BULLETS",
        subtitle: "AI-Synthesized Achievement Clusters",
        use_node: "USE_NODE"
      },
      protocol: {
        title: "OPTIMIZATION_PROTOCOL",
        subtitle: "Critical Task Queue"
      },
      upload: {
        jd_override: "INITIALIZE_TARGET_JD_OVERRIDE",
        protocol_active: "TARGET_PROTOCOL_ACTIVE",
        engine_ready: "MATCH_ENGINE_READY",
        optional: "OPTIONAL_MODIFIER",
        placeholder: ">>> PASTE_TARGET_JD_DATA_STREAM_HERE...",
        buffer: "BUFFER",
        signals: "SIGNALS: COMPARISON + EXTRACTION",
        inject: "INJECT_RESUME_BLOB",
        limit: "HARDWARE_LIMIT: 5MB // PROTOCOL: NEUTRAL_PDF",
        mapping: "MAPPING_NEURAL_STRUCTURES...",
        tuning: "MODULE_TUNING",
        role_protocol: "TARGET_ROLE_PROTOCOL",
        auto_inference: "AUTO_INFERENCE",
        integrity: "RE_ENTRY_FOR_SPECIFIC_ROADMAPS_OPTIMIZES_INTEGRITY_READOUTS",
        core_skills: "PRIMARY_CORE_SKILLS",
        no_signals: "NO_NEURAL_SIGNALS_DETECTED",
        impact_history: "EXPERIENCE_IMPACT_HISTORY",
        empty_history: "EMPTY_HISTORY_PROTOCOL",
        module_sync: "Neural_Module_Sync",
        active_chunks: "ACTIVE_CHUNKS"
      },
      history: {
        title: "IMPROVEMENT_LOG",
        accent: "LOG",
        subtitle: "Session Progress",
        total: "Total"
      },
      rewriter: {
        title: "Bullet",
        accent: "Rewriter",
        subtitle: "AI-Powered Impact Statement Generator",
        weak_label: "Weak Bullet",
        placeholder: "e.g., \"Developed APIs for the backend\"",
        rewrite_btn: "Rewrite with AI",
        rewriting: "Rewriting...",
        impact_label: "Impact Statement",
        apply: "Apply to Resume",
        applied: "Applied!",
        copy: "Copy to Editor",
        copied: "Copied!",
        loading: "AI is crafting your impact statement...",
        empty: "Your enhanced bullet will appear here",
        improved: "What was improved",
        optimized: "Optimized for: {role} · ATS-ready · Action-verb led",
        before: "Before",
        after: "After",
        comparison: "Before → After"
      }
    }
  },
  ta: {
    sidebar: {
      dashboard: "டாஷ்போர்டு",
      chat: "அரட்டை",
      resume_analyzer: "சுயவிவரம் பகுப்பாய்வு",
      voice: "குரல் கூடம்",
      interview: "நேர்முகத் தேர்வு",
      study_hub: "படிப்பு மையம்",
      roadmap: "பாதை வரைபடம்",
      prep: "நேர்காணல் தயார்",
      history: "வரலாறு",
      new_session: "புதிய அமர்வு",
      settings: "அமைப்புகள்",
      logout: "வெளியேறு",
    },
    chat: {
      placeholder: "ஹைவ் இன்று உங்களுக்கு எப்படி உதவும்?",
      empty_title_prefix: "",
      empty_title_suffix: " இன்று உங்களுக்கு எப்படி உதவும்?",
      hive: "ஹைவ்",
      empty_subtitle: "தொழில், நேர்காணல்கள் அல்லது கற்றல் வழிகள் பற்றி எதையும் கேளுங்கள்.",
      thinking: "சிந்திக்கிறது...",
      listening: "கேட்கப்படுகிறது...",
      stop_listening: "நிறுத்து",
      new: "புதிய",
      history_label: "வரலாறு",
      intel_active: "நுண்ணறிவு செயலில் உள்ளது",
    },
    personas: {
      career_coach: "தொழில் பயிற்சியாளர்",
      programming_tutor: "நிரலாக்க ஆசிரியர்",
      technical_interviewer: "தொழில்நுட்ப நேர்முகத்தேர்வாளர்",
      soft_skill_tutor: "மென் திறன் ஆசிரியர்",
      resume_reviewer: "சுயவிவர ஆய்வு",
      voice_reviewer: "குரல் ஆய்வு",
      face_reviewer: "தோற்றப் பயிற்சி",
    },
    tones: {
      friendly: "நட்பான",
      strict: "கண்டிப்பான",
      tutor: "ஆசிரியர்",
      motivational: "ஊக்கமளிக்கும்",
      funny: "வேடிக்கையான",
      mentor: "வழிகாட்டி",
    },
    common: {
      soon: "விரைவில்",
      error: "பிழை",
      retry: "மீண்டும் முயற்சி",
      uplink: "இணைப்பு",
      stable: "சீராக_உள்ளது",
      terminal: "முனையம்"
    },
    interview: {
      module: "நியூரல் ரோல்பிளே தொகுதி v4.0",
      title: "குரல் அரங்கம்",
      subtitle: "நிகழ்நேர AI ரோல்பிளே மூலம் உங்கள் மென் திறன்களை மேம்படுத்தவும். பிழை விளிம்பு: 0.02%.",
      coaches: {
        mascot: "மாஸ்கோட்",
        buster: "பஸ்டர்",
        alex: "அலெக்ஸ்",
        zorbo: "சோர்வோ"
      },
      status: {
        idle: "தயார்_நிலை",
        listening: "சமிக்ஞை_பெறுதல்",
        thinking: "நரம்பியல்_செயல்முறை",
        speaking: "குரல்_ஒளிபரப்பு",
        connecting: "இணைப்பு_ஒத்திசைவு"
      }
    },
    setup: {
      title: "அமர்வு அமைப்பு",
      subtitle: "நியூரல் பாதை தொடக்கம்",
      target: "இலக்கு முனை",
      difficulty: "சிரம நிலை",
      focus: "முக்கிய கவனம்",
      start: "நேர்காணலைத் தொடங்கு",
      stop: "நேர்காணலை முடி",
      roles: {
        frontend: "முன்-இறுதி உருவாக்குநர்",
        backend: "பின்-இறுதி உருவாக்குநர்",
        product: "தயாரிப்பு மேலாளர்",
        hr: "HR நேர்காணல்",
        communication: "தொடர்பு பயிற்சி"
      },
      difficulties: {
        beginner: "தொடக்கக்காரர்",
        intermediate: "இடையிணை",
        advanced: "மேம்பட்ட"
      },
      focus_areas: {
        behavioral: "நடத்தை கேள்விகள்",
        communication: "தொடர்பு",
        confidence: "நம்பிக்கை வளர்ப்பு",
        technical: "தொழில்நுட்ப தெளிவு"
      }
    },
    resume: {
      title: "சுயவிவரம்_அறிவு",
      subtitle: "நரம்பியல் உள்ளடக்க பகுப்பாய்வு",
      initializing: "பகுப்பாய்வைத்_தொடங்குகிறது",
      awaiting_stream: "தரவு உள்ளீட்டுக்காக காத்திருக்கிறது...",
      hydrating: "அமர்வை ஏற்றுகிறது...",
      reset: "மீட்டமை",
      dashboard_view: "டாஷ்போர்டு_பார்வை",
      edit_stream: "நேரடி_திருத்தம்",
      consult_ai: "AI_ஆலோசனை",
      target_node: "இலக்கு முனை",
      unknown_role: "அறியப்படாத பணி",
      skill_context: "ஒரு திட்டத்தில் {skill} உடன் பணியாற்றினேன்",
      analyzing_label: "பகுப்பாய்வு_செய்கிறது",
      radar: {
        title: "திறன்_செயல்திறன்",
        accent: "ரேடார்",
        subtitle: "நரம்பியல் திறன் குறுக்கு குறிப்பு",
        subjects: {
          skills: "திறன்கள்",
          ats: "ATS மதிப்பெண்",
          impact: "தாக்கம்",
          readiness: "தயார்நிலை",
          projects: "திட்டங்கள்"
        }
      },
      readiness: {
        title: "தயார்நிலை_குறியீடு",
        beginner: "தொடக்க_நிலை",
        improving: "முன்னேறுகிறது",
        ready: "நேர்காணலுக்கு_தயார்",
        strong: "சிறந்த_வேட்பாளர்"
      },
      gap_detected: "இடைவெளி_கண்டறியப்பட்டது",
      growth_nodes: "வளர்ச்சி_முனைகள்",
      no_gaps: "இடைவெளிகள் கண்டறியப்படவில்லை",
      jd_match: {
        title: "JD_பொருத்தம்",
        accent: "மதிப்பெண்",
        subtitle: "வேலை விவரம் சீரமைப்பு தர்க்கம்",
        analyzing: "பகுப்பாய்வு செய்கிறது",
        signal_lock: "சிக்னல்_லாக்",
        nodes_matched: "முனைகள்_பொருந்தியது",
        matched_kws: "பொருந்திய_சொற்கள்",
        gap_injection: "இடைவெளி_இன்ஜெக்ஷன்",
        no_data: "வேலை_தரவு_ஏற்றப்படவில்லை",
        protocol: "சீரமைப்பு_நெறிமுறை_v4",
        semantic: "பொருள்_வரைபடம்",
        density: "முக்கிய_சொல்_அடர்த்தி",
        sync_matched: "நியூரல்_ஒத்திசைவு_பொருந்தியது",
        no_signals: "சிக்னல்கள்_கண்டறியப்படவில்லை",
        gap_detected: "முக்கிய_இடைவெளி_கண்டறியப்பட்டது",
        perfect: "சரியான_சீரமைப்பு",
        hardware: "ATS_வன்பொருள்_பகுப்பாய்வு"
      },
      insights: {
        title: "செயல்_நுண்ணறிவு",
        subtitle: "நரம்பியல் மேம்படுத்தல் பரிந்துரைகள்",
        critical: "முக்கிய இடைவெளி"
      },
      bullets: {
        title: "பரிந்துரைக்கப்பட்ட_வரிகள்",
        subtitle: "AI-ஆல் உருவாக்கப்பட்ட சாதனைகள்",
        use_node: "முனையைப் பயன்படுத்து"
      },
      protocol: {
        title: "மேம்படுத்தல்_நெறிமுறை",
        subtitle: "முக்கிய பணி வரிசை"
      },
      upload: {
        jd_override: "வேலை_விவர_மேலீடு_தொடங்கு",
        protocol_active: "இலக்கு_நெறிமுறை_செயல்பாட்டில்",
        engine_ready: "பொருத்தம்_இயந்திரம்_தயார்",
        optional: "விருப்ப_மாற்றி",
        placeholder: ">>> வேலை_விவரத்_தரவை_இங்கே_ஒட்டவும்...",
        buffer: "தாங்கல்",
        signals: "சிக்னல்கள்: ஒப்பீடு + பிரித்தெடுத்தல்",
        inject: "சுயவிவரத்தைச்_சேர்க்கவும்",
        limit: "அளவு_வரம்பு: 5MB // நெறிமுறை: NEUTRAL_PDF",
        mapping: "நரம்பியல்_கட்டமைப்புகளை_வரைபடமாக்குகிறது...",
        tuning: "தொகுதி_சரிசெய்தல்",
        role_protocol: "இலக்கு_பணி_நெறிமுறை",
        auto_inference: "தானியங்கி_யூகம்",
        integrity: "குறிப்பிட்ட_பாதைக்கான_மீள்_நுழைவு_மேம்படுத்துகிறது.",
        core_skills: "முதன்மை_திறன்கள்",
        no_signals: "திறன்கள்_கண்டறியப்படவில்லை",
        impact_history: "தாக்க_வரலாறு",
        empty_history: "காலி_வரலாற்று_நெறிமுறை",
        module_sync: "நரம்பியல்_தொகுதி_ஒத்திசைவு",
        active_chunks: "செயலில்_உள்ள_பகுதிகள்"
      },
      history: {
        title: "மேம்படுத்தல்_பதிவு",
        accent: "பதிவு",
        subtitle: "அமர்வு முன்னேற்றம்",
        total: "மொத்தம்"
      },
      rewriter: {
        title: "வரி",
        accent: "மீண்டும் எழுதுபவர்",
        subtitle: "AI-இயங்கும் சாதன கூற்று உருவாக்கம்",
        weak_label: "பலவீனமான வரி",
        placeholder: "உதாரணம்: \"பின்-இறுதிக்காக APIகளை உருவாக்கினேன்\"",
        rewrite_btn: "AI மூலம் மீண்டும் எழுது",
        rewriting: "மீண்டும் எழுதுகிறது...",
        impact_label: "தாக்கக் கூற்று",
        apply: "சுயவிவரத்தில் பயன்படுத்து",
        applied: "பயன்படுத்தப்பட்டது!",
        copy: "எடிட்டருக்கு நகலெடு",
        copied: "நகலெடுக்கப்பட்டது!",
        loading: "AI உங்கள் தாக்கக் கூற்றை உருவாக்குகிறது...",
        empty: "உங்கள் மேம்படுத்தப்பட்ட வரி இங்கே தோன்றும்",
        improved: "மேம்படுத்தப்பட்டவை",
        optimized: "மேம்படுத்தப்பட்டது: {role} · ATS-தயார்",
        before: "முன்பு",
        after: "பின்பு",
        comparison: "முன்பு → பின்பு"
      }
    }
  }
};

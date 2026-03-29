"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Chrome, Phone, ArrowLeft, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      router.push("/chat");
    } catch (err) {
      setError("User not found. Try again or Register");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020406] flex items-center justify-center p-6 relative overflow-hidden font-nav">
      {/* Background Decorative Elements */}
      <div className="scanline" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff05_1px,transparent_1px),linear-gradient(to_bottom,#00ffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <div className="hud-panel w-full max-w-lg p-10 relative overflow-hidden animate-hud">
        {/* Subtle Scan Beam Overlay */}
        <div className="scan-beam" />
        
        <div className="relative">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative w-16 h-16 mb-2 border border-cyan-500/30 p-1">
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-500" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-cyan-500" />
              <Image src="/logo.png" alt="BumbleBee Logo" fill className="object-contain opacity-80" />
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-orbitron text-cyan-500/50 uppercase tracking-[0.4em]">System Access</p>
              <h2 className="text-4xl font-orbitron tracking-tighter text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
                {isLogin ? "VERIFY_USER" : "INITIALIZE_ID"}
              </h2>
            </div>
            
            <p className="text-cyan-500/60 font-medium text-sm max-w-xs">
              {isLogin ? "Authenticate credentials to HIVE core" : "Registering new hardware ID in Hive database"}
            </p>
          </div>

          <div className="mt-10 space-y-6">
            {!isPhoneMode ? (
              <>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="tactical-button w-full h-14"
                >
                  <span className="flex items-center justify-center gap-4">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
                    CONTINUE_WITH_GOOGLE
                  </span>
                </button>
                
                <button
                  onClick={() => setIsPhoneMode(true)}
                  className="w-full h-14 border border-cyan-500/20 bg-cyan-500/5 text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all font-orbitron text-[11px] tracking-[0.3em] font-bold"
                  style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
                >
                  <span className="flex items-center justify-center gap-4">
                    <Phone className="w-4 h-4" />
                    PHONE_PROTOCOL
                  </span>
                </button>
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <button 
                  onClick={() => setIsPhoneMode(false)}
                  className="flex items-center gap-2 text-cyan-500/50 hover:text-cyan-400 transition-colors mb-4 font-tech text-[10px] uppercase tracking-widest"
                >
                  <ArrowLeft className="w-3 h-3" /> [ back_to_root ]
                </button>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-cyan-500/40 uppercase tracking-[0.3em] ml-1 font-orbitron">Phone_Address</label>
                  <div className="relative group">
                    <input
                      type="tel"
                      placeholder="+91 XXXX XXXX"
                      className="w-full bg-cyan-500/5 border-cyan-500/20 border px-6 h-14 text-cyan-50 font-tech focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                      style={{ clipPath: 'polygon(0 0, 97% 0, 100% 20%, 100% 100%, 3% 100%, 0 80%)' }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/40" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/40" />
                  </div>
                </div>

                <button className="tactical-button w-full h-14">
                  SEND_SIGNAL_OTP
                </button>
              </div>
            )}

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyan-500/10"></div>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.5em]">
                <span className="bg-[#0c0c0e] border border-cyan-500/20 px-6 py-1.5 text-cyan-500/40">OR_GATE</span>
              </div>
            </div>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-cyan-500/40 hover:text-cyan-400 transition-colors text-[11px] font-orbitron font-bold tracking-widest"
            >
              {isLogin ? ">> REQUEST_NEW_HARDWARE_ID" : ">> RETURN_TO_VERIFICATION"}
            </button>
          </div>
        </div>
      </div>

      {/* Error Interface */}
      {error && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="hud-panel p-10 max-w-sm w-full text-center space-y-6 animate-hud border-red-500/30">
            <div className="w-20 h-20 bg-red-500/5 border border-red-500/20 flex items-center justify-center mx-auto">
              <div className="w-10 h-10 border-2 border-red-500 border-t-transparent animate-spin" />
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-orbitron text-red-500/50 uppercase tracking-[0.3em]">Access_Denied</p>
               <h3 className="text-xl font-bold text-red-500 tracking-tight font-tech">ERROR: {error}</h3>
            </div>
            <button 
              onClick={() => setError(null)}
              className="w-full px-6 py-3 border border-red-500/40 bg-red-500/10 text-red-500 font-orbitron text-[11px] tracking-widest hover:bg-red-500/20 transition-all"
            >
              [ CLEAR_EXCEPTION ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

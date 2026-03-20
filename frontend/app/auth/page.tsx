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
    <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-black to-black">
      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative w-20 h-20 mb-2">
              <Image src="/logo.png" alt="BumbleBee Logo" fill className="object-contain" />
            </div>
            <h2 className="text-4xl font-bebas tracking-wider text-primary">
              {isLogin ? "Welcome Back" : "Join the Hive"}
            </h2>
            <p className="text-zinc-400 font-medium">
              {isLogin ? "Login to your career dashboard" : "Create your BumbleBee account"}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {!isPhoneMode ? (
              <>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black h-14 rounded-2xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
                  Continue with Google
                </button>
                
                <button
                  onClick={() => setIsPhoneMode(true)}
                  className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-white h-14 rounded-2xl font-bold hover:bg-zinc-700 transition-all border border-white/5"
                >
                  <Phone className="w-5 h-5" />
                  Sign in with Phone
                </button>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <button 
                  onClick={() => setIsPhoneMode(false)}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to options
                </button>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 99999 99999"
                    className="w-full bg-zinc-800 border-white/5 border rounded-2xl h-14 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <button className="w-full bg-primary text-black h-14 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,214,0,0.3)]">
                  Send OTP
                </button>
              </div>
            )}

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                <span className="bg-zinc-900 border border-white/5 px-4 py-1 rounded-full text-zinc-500">OR</span>
              </div>
            </div>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-zinc-400 hover:text-primary transition-colors text-sm font-bold"
            >
              {isLogin ? "Need an account? Register here" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-zinc-900 border border-red-500/20 p-8 rounded-3xl max-w-sm w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">{error}</h3>
            <button 
              onClick={() => setError(null)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl h-12 font-bold transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

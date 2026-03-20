"use client";

import React from "react";
import { LogOut, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            {/* Decoration */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
            
            <div className="relative text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bebas tracking-wider text-white">Leaving the Hive?</h3>
                <p className="text-zinc-400 text-sm font-medium">Are you sure you want to sign out of BumbleBee AI?</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onConfirm}
                  className="w-full bg-red-500 hover:bg-red-600 text-white h-12 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
                >
                  Yes, Sign Out
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-12 rounded-xl font-bold transition-all"
                >
                  Stay in Hive
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

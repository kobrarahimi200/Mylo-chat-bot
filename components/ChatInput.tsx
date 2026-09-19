"use client";

import { forwardRef } from "react";
import type { Language } from "@/lib/types";

type ChatInputProps = { value: string; loading: boolean; language: Language; onChange: (value: string) => void; onSend: () => void };

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput({ value, loading, language, onChange, onSend }, ref) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft focus-within:border-accent dark:border-slate-700 dark:bg-slate-900">
        <textarea ref={ref} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }} placeholder={language === "fa" ? "پیامی برای مایلو بنویسید..." : "Message Mylo..."} dir={language === "fa" ? "rtl" : "ltr"} rows={1} disabled={loading} className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-slate-100" />
        <button onClick={onSend} disabled={loading || !value.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-white transition hover:bg-[#5148e8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400" aria-label="Send message">
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 14-7-3 14-4-5-7-2Z" /><path d="m12 14 4-9" /></svg>}
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">{language === "fa" ? "Enter برای ارسال · Shift + Enter برای خط جدید" : "Enter to send · Shift + Enter for a new line"}</p>
    </div>
  );
});

export default ChatInput;

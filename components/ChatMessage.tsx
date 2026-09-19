import type { Message } from "@/lib/types";

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ink text-xs font-bold text-white">M</span>}
      <div className={`max-w-[min(720px,85%)] rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm ${isUser ? "rounded-br-md bg-ink text-white dark:bg-accent" : "rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Language } from "@/lib/types";

type EmptyStateProps = { language: Language; onPrompt: (prompt: string) => void };

export default function EmptyState({ language, onPrompt }: EmptyStateProps) {
  const prompts = language === "fa"
    ? ["چیزی را برایم توضیح بده", "برای نوشتن کد کمکم کن", "درباره یک موضوع تحقیق کن", "برای یک پروژه برنامه‌ریزی کن"]
    : ["Explain something to me", "Help me write code", "Research a topic", "Help me plan a project"];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-ink text-xl font-bold text-white shadow-soft">M</div>
      <p className="text-sm font-medium text-accent">Mylo AI</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink dark:text-slate-100 sm:text-4xl">{language === "fa" ? "سلام، من مایلو هستم." : "Hello, I’m Mylo."}</h1>
      <p className="mt-4 max-w-lg text-base leading-8 text-slate-500 dark:text-slate-400">{language === "fa" ? <>من برای مدت زیادی فقط یک ربات تدارکات بودم.<br />حالا در پروژه‌ای به نام PROJECT_MILO دارم چیزهای جدیدی می‌سازم.<br /><br />خب...<br />ببینیم امروز چه چیزی می‌توانیم با هم بسازیم.</> : <>I used to be a logistics robot.<br />Now I’m building something new in PROJECT_MILO.<br /><br />So...<br />let’s see what we can build together.</>}</p>
      <Link
        href="/admin"
        className="mt-6 inline-flex items-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#5148e8]"
      >
        {language === "fa" ? "رفتن به پنل مدیریت" : "Open Admin Panel"}
      </Link>
      <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {prompts.map((prompt) => <button key={prompt} onClick={() => onPrompt(prompt)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white">{prompt}</button>)}
      </div>
    </div>
  );
}

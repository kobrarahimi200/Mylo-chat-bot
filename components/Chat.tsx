"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import DocumentSkillSelector from "@/components/DocumentSkillSelector";
import EmptyState from "@/components/EmptyState";
import Sidebar from "@/components/Sidebar";
import { loadActiveConversation, loadConversations, loadExpandedFolders, loadFolders, loadLanguage, loadSidebarOpen, loadTheme, saveActiveConversation, saveConversations, saveExpandedFolders, saveFolders, saveLanguage, saveSidebarOpen, saveTheme } from "@/lib/storage";
import type { Conversation, Folder, Language, Message, Theme } from "@/lib/types";

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const titleFromMessage = (content: string) => content.length > 40 ? `${content.slice(0, 40).trimEnd()}...` : content;

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("light");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadConversations().sort((a, b) => b.updatedAt - a.updatedAt);
    const savedActive = loadActiveConversation();
    queueMicrotask(() => {
      setConversations(saved);
      setFolders(loadFolders());
      setSidebarOpen(loadSidebarOpen());
      setExpandedFolders(loadExpandedFolders());
      setLanguage(loadLanguage());
      setTheme(loadTheme());
      if (savedActive && saved.some((conversation) => conversation.id === savedActive)) setCurrentId(savedActive);
      else if (saved[0]) setCurrentId(saved[0].id);
      setHydrated(true);
    });
  }, []);

  useEffect(() => { if (hydrated) saveConversations(conversations); }, [conversations, hydrated]);
  useEffect(() => { if (hydrated) saveActiveConversation(currentId); }, [currentId, hydrated]);
  useEffect(() => { if (hydrated) saveFolders(folders); }, [folders, hydrated]);
  useEffect(() => { if (hydrated) saveSidebarOpen(sidebarOpen); }, [sidebarOpen, hydrated]);
  useEffect(() => { if (hydrated) saveExpandedFolders(expandedFolders); }, [expandedFolders, hydrated]);
  useEffect(() => { if (hydrated) saveLanguage(language); }, [language, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    saveTheme(theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, hydrated]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [currentId, conversations, loading]);

  const current = useMemo(() => conversations.find((conversation) => conversation.id === currentId) ?? null, [conversations, currentId]);

  const updateConversation = (id: string, messages: Message[]) => {
    setConversations((items) => items.map((item) => item.id === id ? { ...item, messages, updatedAt: Date.now() } : item).sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const newChat = () => {
    if (current && current.messages.length === 0) {
      setInput("");
    } else {
      setCurrentId(null);
      setInput("");
    }
    setError(null);
    setMobileOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const selectConversation = (id: string) => {
    setCurrentId(id);
    setError(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const createFolder = (name: string) => setFolders((items) => [...items, { id: makeId(), name, createdAt: Date.now() }]);
  const renameFolder = (id: string, name: string) => setFolders((items) => items.map((folder) => folder.id === id ? { ...folder, name } : folder));
  const deleteFolder = (id: string) => {
    setFolders((items) => items.filter((folder) => folder.id !== id));
    setConversations((items) => items.map((conversation) => conversation.folderId === id ? { ...conversation, folderId: null } : conversation));
  };
  const toggleFolder = (id: string) => setExpandedFolders((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    setError(null);
    const userMessage: Message = { id: makeId(), role: "user", content, createdAt: Date.now() };
    const baseMessages = current?.messages ?? [];
    const nextMessages = [...baseMessages, userMessage];
    let conversationId = currentId;
    if (!conversationId) {
      conversationId = makeId();
      const now = Date.now();
      const fresh: Conversation = { id: conversationId, title: titleFromMessage(content), messages: nextMessages, folderId: null, createdAt: now, updatedAt: now, isRenamedManually: false };
      setConversations((items) => [fresh, ...items]);
      setCurrentId(conversationId);
    } else {
      updateConversation(conversationId, nextMessages);
    }
    setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: nextMessages, language, selectedDocumentId }) });
      const data: unknown = await response.json();
      if (!response.ok || !data || typeof data !== "object" || !("message" in data)) throw new Error(data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "Unable to get a response.");
      const assistant = { ...(data as { message: Message }).message, id: makeId(), createdAt: Date.now() };
      updateConversation(conversationId, [...nextMessages, assistant]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = (id: string) => {
    const remaining = conversations.filter((item) => item.id !== id);
    setConversations(remaining);
    if (currentId === id) setCurrentId(remaining[0]?.id ?? null);
  };

  const renameConversation = (id: string, title: string) => setConversations((items) => items.map((item) => item.id === id ? { ...item, title, isRenamedManually: true, updatedAt: Date.now() } : item));
  const moveConversation = (id: string, folderId: string | null) => setConversations((items) => items.map((item) => item.id === id ? { ...item, folderId, updatedAt: Date.now() } : item));

  return (
    <main dir={language === "fa" ? "rtl" : "ltr"} className="flex h-screen overflow-hidden bg-canvas text-ink transition-colors dark:bg-slate-900 dark:text-slate-100">
      {(!sidebarOpen || mobileOpen) && <button onClick={() => { setSidebarOpen(true); setMobileOpen(true); }} className="fixed left-3 top-4 z-20 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 md:hidden" aria-label="Open chat history">☰</button>}
      <div className={`fixed inset-0 z-20 bg-ink/30 transition-opacity dark:bg-black/60 md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMobileOpen(false)} />
      <div className={`relative z-30 shrink-0 transition-all duration-300 ${sidebarOpen ? "md:w-[280px]" : "md:w-0"} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
      <Sidebar conversations={conversations} currentId={currentId} search={search} mobileOpen={mobileOpen} onSearchChange={setSearch} onNewChat={newChat} onSelect={selectConversation} onDelete={deleteConversation} onClose={() => setMobileOpen(false)} folders={folders} expandedFolders={expandedFolders} onToggleFolder={toggleFolder} onRename={renameConversation} onMove={moveConversation} onCreateFolder={createFolder} onRenameFolder={renameFolder} onDeleteFolder={deleteFolder} language={language} onLanguageChange={setLanguage} theme={theme} onThemeChange={setTheme} />
      </div>
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-canvas px-5 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
          <div className="flex items-center gap-3"><button onClick={() => { if (window.innerWidth < 768) setMobileOpen(true); else setSidebarOpen((open) => !open); }} className="rounded-lg p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800" aria-label="Toggle chat history"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button><div><p className="font-semibold text-ink dark:text-slate-100">Mylo AI</p><p className="text-xs text-slate-400">{current ? current.title : language === "fa" ? "گفت‌وگوی جدید" : "A new conversation"}</p></div></div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" />{language === "fa" ? "آماده کمک" : "Ready to help"}</span>
            <Link
              href="/admin"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-accent dark:hover:text-accent"
            >
              {language === "fa" ? "پنل مدیریت" : "Admin panel"}
            </Link>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
            <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-6">
              {!current?.messages.length ? <EmptyState language={language} onPrompt={(prompt) => { setInput(prompt); window.setTimeout(() => inputRef.current?.focus(), 0); }} /> : current.messages.map((message) => <ChatMessage key={message.id} message={message} />)}
              {loading && <div className="flex gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-xs font-bold text-white">M</span><div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-4"><span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" /></div></div>}
              <div ref={endRef} />
            </div>
          </div>
          <div className="border-t border-slate-200/80 bg-canvas px-4 pb-5 pt-4 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
            {error && <div className="mx-auto mb-3 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            <DocumentSkillSelector
              language={language}
              selectedDocumentId={selectedDocumentId}
              onChange={setSelectedDocumentId}
            />
            <ChatInput ref={inputRef} value={input} loading={loading} language={language} onChange={setInput} onSend={sendMessage} />
          </div>
        </div>
      </section>
    </main>
  );
}

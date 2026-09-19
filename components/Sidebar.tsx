"use client";

import { useState } from "react";
import type { Conversation, Folder, Language, Theme } from "@/lib/types";
import ConversationItem from "@/components/ConversationItem";

type SidebarProps = {
  conversations: Conversation[];
  currentId: string | null;
  search: string;
  mobileOpen: boolean;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  folders: Folder[];
  expandedFolders: string[];
  onToggleFolder: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onMove: (id: string, folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export default function Sidebar({ conversations, currentId, search, mobileOpen, onSearchChange, onNewChat, onSelect, onDelete, onClose, folders, expandedFolders, onToggleFolder, onRename, onMove, onCreateFolder, onRenameFolder, onDeleteFolder, language, onLanguageChange, theme, onThemeChange }: SidebarProps) {
  const filtered = conversations.filter((conversation) => conversation.title.toLowerCase().includes(search.toLowerCase()));
  const [folderName, setFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const submitFolder = () => {
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      setFolderName("");
      setAddingFolder(false);
    }
  };

  return (
    <>
      {mobileOpen && <button className="fixed inset-0 z-20 bg-ink/30 md:hidden" onClick={onClose} aria-label="Close menu" />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col border-r border-slate-200 bg-[#efefeb] px-4 py-5 transition-transform dark:border-slate-800 dark:bg-slate-950 md:static md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-bold text-white">M</span>
            <div><p className="font-semibold tracking-tight text-ink dark:text-slate-100">Mylo</p><p className="text-[11px] text-slate-400">Your thoughtful companion</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white md:hidden" aria-label="Close sidebar">×</button>
        </div>
        <button onClick={onNewChat} className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-accent">
          <span className="text-lg leading-none">+</span> {language === "fa" ? "گفت‌وگوی جدید" : "New chat"}
        </button>
        <div className="relative mt-5">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={language === "fa" ? "جست‌وجوی گفتگوها..." : "Search chats..."} dir={language === "fa" ? "rtl" : "ltr"} className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        <div className="mt-7 min-h-0 flex-1 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between px-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{language === "fa" ? "پوشه‌ها" : "Folders"}</p>
              <button onClick={() => setAddingFolder(true)} className="rounded-md px-2 py-1 text-xs font-semibold text-accent hover:bg-white" aria-label="Add folder">+ {language === "fa" ? "افزودن" : "Add"}</button>
            </div>
            {addingFolder && <div className="mt-2 flex gap-1 px-2"><input autoFocus value={folderName} onChange={(event) => setFolderName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitFolder(); if (event.key === "Escape") setAddingFolder(false); }} placeholder="Folder name" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-accent" /><button onClick={submitFolder} className="rounded-lg bg-accent px-2 text-xs text-white">Add</button></div>}
            <div className="mt-2 space-y-1">
              {folders.map((folder) => {
                const folderChats = filtered.filter((conversation) => conversation.folderId === folder.id);
                const expanded = expandedFolders.includes(folder.id);
                return <div key={folder.id}>
                  <div className="group flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/70">
                    <button onClick={() => onToggleFolder(folder.id)} className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left text-sm text-slate-600 dark:text-slate-300"><span>{expanded ? "⌄" : "›"}</span><span>📁</span><span className="truncate">{folder.name}</span><span className="ml-auto text-[10px] text-slate-400">{folderChats.length}</span></button>
                    <button onClick={() => { setEditingFolder(folder.id); setEditingName(folder.name); }} className="rounded-md px-1.5 text-slate-400 opacity-0 hover:bg-slate-100 group-hover:opacity-100" aria-label={`Options for ${folder.name}`}>•••</button>
                  </div>
                  {editingFolder === folder.id && <div className="mx-2 my-1 rounded-lg border border-slate-200 bg-white p-2"><input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && editingName.trim()) { onRenameFolder(folder.id, editingName.trim()); setEditingFolder(null); } if (event.key === "Escape") setEditingFolder(null); }} className="w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none" /><div className="mt-2 flex justify-between"><button onClick={() => { onDeleteFolder(folder.id); setEditingFolder(null); }} className="text-xs text-red-500">Delete</button><button onClick={() => { if (editingName.trim()) onRenameFolder(folder.id, editingName.trim()); setEditingFolder(null); }} className="text-xs text-accent">Save</button></div></div>}
                  {expanded && <div className="ml-2 mt-1 space-y-1">{folderChats.map((conversation) => <ConversationItem key={conversation.id} conversation={conversation} active={conversation.id === currentId} folders={folders} onSelect={() => { onSelect(conversation.id); onClose(); }} onRename={(title) => onRename(conversation.id, title)} onDelete={() => onDelete(conversation.id)} onMove={(folderId) => onMove(conversation.id, folderId)} />)}</div>}
                </div>;
              })}
            </div>
          </div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{language === "fa" ? "گفتگوهای اخیر" : "Recent chats"}</p>
          <div className="mt-3 space-y-1">
            {filtered.filter((conversation) => conversation.folderId === null).length > 0 ? filtered.filter((conversation) => conversation.folderId === null).map((conversation) => <ConversationItem key={conversation.id} conversation={conversation} active={conversation.id === currentId} folders={folders} onSelect={() => { onSelect(conversation.id); onClose(); }} onRename={(title) => onRename(conversation.id, title)} onDelete={() => onDelete(conversation.id)} onMove={(folderId) => onMove(conversation.id, folderId)} />) : <p className="px-3 py-5 text-sm text-slate-400">No chats found.</p>}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-slate-500">
          <span>{language === "fa" ? "زبان" : "Language"}</span>
          <button onClick={() => onLanguageChange(language === "en" ? "fa" : "en")} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" aria-label={language === "en" ? "Switch to Persian" : "Switch to English"}>{language === "en" ? "فارسی" : "English"}</button>
        </div>
        <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-500">
          <span>{language === "fa" ? "پوسته" : "Theme"}</span>
          <button onClick={() => onThemeChange(theme === "light" ? "dark" : "light")} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>{theme === "light" ? "🌙 Dark" : "☀️ Light"}</button>
        </div>
        <button className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 transition hover:bg-white hover:text-ink dark:hover:bg-slate-900 dark:hover:text-slate-100">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3v2m0 14v2M3 12h2m14 0h2m-3.4-6.6-1.4 1.4M7.8 16.2l-1.4 1.4m0-11.6 1.4 1.4m8.4 8.8 1.4 1.4" /><circle cx="12" cy="12" r="4" /></svg>
          Settings
        </button>
      </aside>
    </>
  );
}

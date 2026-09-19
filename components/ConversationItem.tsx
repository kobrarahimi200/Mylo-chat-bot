"use client";

import type { Conversation } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type ConversationItemProps = {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  folders: { id: string; name: string }[];
  onRename: (title: string) => void;
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
};

export default function ConversationItem({ conversation, active, folders, onSelect, onRename, onDelete, onMove }: ConversationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const saveRename = () => {
    const nextTitle = title.trim();
    if (nextTitle) {
      onRename(nextTitle);
      setRenaming(false);
    }
  };

  return (
    <div className={`group relative rounded-xl px-2 py-1 transition ${active ? "bg-white shadow-sm dark:bg-slate-800" : "hover:bg-white/70 dark:hover:bg-slate-900"}`}>
      <div className="flex items-center gap-1">
        {renaming ? (
          <input ref={inputRef} value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveRename(); if (event.key === "Escape") { setTitle(conversation.title); setRenaming(false); } }} onBlur={saveRename} className="min-w-0 flex-1 rounded-md border border-accent bg-white px-2 py-1 text-sm outline-none dark:bg-slate-900 dark:text-slate-100" aria-label="Rename chat" />
        ) : (
          <button onClick={onSelect} className="min-w-0 flex-1 px-1 py-1 text-left" aria-label={`Open ${conversation.title}`}>
            <span className="block truncate text-sm font-medium text-ink dark:text-slate-100">{conversation.title}</span>
            <span className="mt-0.5 block text-xs text-slate-400">{conversation.messages.length} {conversation.messages.length === 1 ? "message" : "messages"}</span>
          </button>
        )}
        <button onClick={() => setMenuOpen((open) => !open)} className="rounded-md p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-ink group-hover:opacity-100" aria-label={`Options for ${conversation.title}`} aria-expanded={menuOpen}>•••</button>
      </div>
      {menuOpen && (
        <div className="absolute right-2 top-10 z-40 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <button onClick={() => { setRenaming(true); setMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">Rename</button>
          <div className="my-1 border-t border-slate-100" />
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Move to folder</p>
          <button onClick={() => { onMove(null); setMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">No folder</button>
          {folders.map((folder) => <button key={folder.id} onClick={() => { onMove(folder.id); setMenuOpen(false); }} className="w-full truncate rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">📁 {folder.name}</button>)}
          <div className="my-1 border-t border-slate-100" />
          <button onClick={() => { setDeleting(true); setMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Delete</button>
        </div>
      )}
      {deleting && (
        <div className="absolute right-0 top-0 z-50 w-60 rounded-xl border border-red-100 bg-white p-3 shadow-lg dark:border-red-900 dark:bg-slate-900">
          <p className="text-sm font-medium text-ink dark:text-slate-100">Delete this chat?</p>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setDeleting(false)} className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">Cancel</button>
            <button onClick={onDelete} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

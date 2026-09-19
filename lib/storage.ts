import type { Conversation, Folder, Language, Message, Theme } from "@/lib/types";

export const CONVERSATIONS_STORAGE_KEY = "mylo_conversations";
export const FOLDERS_STORAGE_KEY = "mylo_folders";
export const ACTIVE_CONVERSATION_STORAGE_KEY = "mylo_active_conversation";
export const SIDEBAR_OPEN_STORAGE_KEY = "mylo_sidebar_open";
export const EXPANDED_FOLDERS_STORAGE_KEY = "mylo_expanded_folders";
export const LANGUAGE_STORAGE_KEY = "mylo_language";
export const THEME_STORAGE_KEY = "mylo_theme";

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(CONVERSATIONS_STORAGE_KEY) ??
      window.localStorage.getItem("mylo-ai-conversations");
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isConversation).map(normalizeConversation) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
}

export function loadFolders(): Folder[] {
  return loadJson(FOLDERS_STORAGE_KEY, []).filter(isFolder);
}

export function saveFolders(folders: Folder[]) {
  saveJson(FOLDERS_STORAGE_KEY, folders);
}

export function loadActiveConversation(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_CONVERSATION_STORAGE_KEY);
}

export function saveActiveConversation(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(ACTIVE_CONVERSATION_STORAGE_KEY, id);
  else window.localStorage.removeItem(ACTIVE_CONVERSATION_STORAGE_KEY);
}

export function loadSidebarOpen(): boolean {
  if (typeof window === "undefined") return true;
  const value = window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
  return value === null ? true : value === "true";
}

export function saveSidebarOpen(open: boolean) {
  saveJson(SIDEBAR_OPEN_STORAGE_KEY, open);
}

export function loadExpandedFolders(): string[] {
  return loadJson<string[]>(EXPANDED_FOLDERS_STORAGE_KEY, []).filter((id) => typeof id === "string");
}

export function saveExpandedFolders(ids: string[]) {
  saveJson(EXPANDED_FOLDERS_STORAGE_KEY, ids);
}

export function loadLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "fa" ? "fa" : "en";
}

export function saveLanguage(language: Language) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function loadTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function saveTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Conversation>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    Array.isArray(candidate.messages) &&
    (candidate.folderId === null || typeof candidate.folderId === "string" || candidate.folderId === undefined) &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number"
  );
}

function normalizeConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    folderId: conversation.folderId ?? null,
    isRenamedManually: conversation.isRenamedManually ?? false,
    messages: conversation.messages.filter(isMessage).map((message) => ({
      ...message,
      id: message.id || `${message.createdAt}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: message.createdAt || conversation.createdAt,
    })),
  };
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<Message>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

function isFolder(value: unknown): value is Folder {
  if (!value || typeof value !== "object") return false;
  const folder = value as Partial<Folder>;
  return typeof folder.id === "string" && typeof folder.name === "string" && typeof folder.createdAt === "number";
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

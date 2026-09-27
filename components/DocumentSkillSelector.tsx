"use client";

import { useEffect, useState } from "react";
import { fetchDocumentSkills, type DocumentSkill } from "@/services/documents/skills";
import type { Language } from "@/lib/types";

type DocumentSkillSelectorProps = {
  language: Language;
  selectedDocumentId: string | null;
  onChange: (documentId: string | null) => void;
};

export default function DocumentSkillSelector({
  language,
  selectedDocumentId,
  onChange,
}: DocumentSkillSelectorProps) {
  const [skills, setSkills] = useState<DocumentSkill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchDocumentSkills()
      .then((availableSkills) => {
        if (active) setSkills(availableSkills);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load documents.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto mb-3 w-full max-w-3xl">
      <label htmlFor="document-skill" className="mb-1.5 block text-xs font-medium text-slate-500">
        {language === "fa" ? "سند برای پرسش" : "Ask about a document"}
      </label>
      <select
        id="document-skill"
        value={selectedDocumentId ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        disabled={loading || skills.length === 0}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <option value="">
          {loading
            ? (language === "fa" ? "در حال بارگذاری اسناد..." : "Loading documents...")
            : (language === "fa" ? "گفت‌وگوی عمومی (بدون سند)" : "General chat (no document)")}
        </option>
        {skills.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.filename}
          </option>
        ))}
      </select>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
      {!loading && !error && skills.length === 0 && (
        <p className="mt-1 text-xs text-slate-400">
          {language === "fa" ? "پس از پردازش موفق اسناد، اینجا نمایش داده می‌شوند." : "Completed uploads will appear here."}
        </p>
      )}
    </div>
  );
}

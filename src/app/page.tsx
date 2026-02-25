"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Candidate = {
  pdf_path: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  current_position?: string | null;
  ranking_score?: number | null;
  recruiter_ranking?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  analyzed_at?: string | null;
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"ranking" | "name">("ranking");
  const [instructions, setInstructions] = useState("");
  const [instructionsDirty, setInstructionsDirty] = useState(false);
  const [savingInstructions, setSavingInstructions] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/candidates");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load candidates");
      }
      const data = await res.json();
      setCandidates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const { prompt } = await res.json();
        setInstructions(prompt);
      }
    } catch {
      // use default
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchSettings();
  }, []);

  const handleSaveInstructions = async () => {
    setSavingInstructions(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: instructions }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setInstructionsDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingInstructions(false);
    }
  };

  const handleArchive = async (pdfPath: string) => {
    setArchiving(pdfPath);
    setError(null);
    try {
      const res = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_path: pdfPath }),
      });
      if (!res.ok) throw new Error("Archive failed");
      await fetchCandidates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archive failed");
    } finally {
      setArchiving(null);
    }
  };

  const handleDelete = async (pdfPath: string) => {
    if (!confirm("Bewerbung endgültig löschen? Die PDF wird unwiderruflich entfernt.")) return;
    setDeleting(pdfPath);
    setError(null);
    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_path: pdfPath }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchCandidates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleAnalyze = async (pdfPath: string) => {
    setAnalyzing(pdfPath);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_path: pdfPath }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }
      await fetchCandidates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(null);
    }
  };

  const handleAnalyzeAll = async () => {
    if (
      !confirm(
        "Are you sure? This will run AI analysis on all candidates. This may take several minutes and use OpenAI credits."
      )
    ) {
      return;
    }
    setAnalyzingAll(true);
    setError(null);
    let failed = 0;
    try {
      for (const c of candidates) {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdf_path: c.pdf_path }),
        });
        if (!res.ok) failed++;
      }
      await fetchCandidates();
      if (failed > 0) {
        setError(`${failed} of ${candidates.length} analyses failed.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyze all failed");
    } finally {
      setAnalyzingAll(false);
    }
  };

  const handleRecruiterRankingChange = async (pdfPath: string, value: string | null) => {
    try {
      const res = await fetch("/api/recruiter-ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_path: pdfPath, recruiter_ranking: value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setCandidates((prev) =>
        prev.map((c) =>
          c.pdf_path === pdfPath ? { ...c, recruiter_ranking: value } : c
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save ranking");
    }
  };

  const handleViewPdf = (pdfPath: string) => {
    const url = `/api/pdf?path=${encodeURIComponent(pdfPath)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const sorted = [...candidates].sort((a, b) => {
    if (sortBy === "ranking") {
      return (b.ranking_score ?? 0) - (a.ranking_score ?? 0);
    }
    return (a.name || "").localeCompare(b.name || "");
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[var(--unibe-red)] text-white py-4 px-6 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">Recruitment Admin</h1>
          <p className="text-sm opacity-90">Post Doc Plant Volatile Interactions</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm px-4 py-2 rounded bg-white/20 hover:bg-white/30"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <section className="mb-8 p-4 bg-white rounded-lg shadow border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            ChatGPT-Anweisungen für die Analyse
          </h2>
          <textarea
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value);
              setInstructionsDirty(true);
            }}
            rows={10}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
            placeholder="Anweisungen für die KI..."
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleSaveInstructions}
              disabled={!instructionsDirty || savingInstructions}
              className="px-4 py-2 text-sm font-medium rounded bg-[var(--unibe-red)] text-white hover:bg-[var(--unibe-red-dark)] disabled:opacity-50"
            >
              {savingInstructions ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </section>

        {loading ? (
          <p className="text-gray-500">Loading candidates…</p>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {candidates.length} application{candidates.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={handleAnalyzeAll}
                  disabled={candidates.length === 0 || analyzingAll || !!analyzing}
                  className="px-4 py-2 text-sm font-medium rounded bg-[var(--unibe-red)] text-white hover:bg-[var(--unibe-red-dark)] disabled:opacity-50"
                >
                  {analyzingAll ? "Analyzing…" : "Analyze all"}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("ranking")}
                  className={`px-3 py-1 text-sm rounded ${sortBy === "ranking" ? "bg-[var(--unibe-red)] text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  Sort by ranking
                </button>
                <button
                  onClick={() => setSortBy("name")}
                  className={`px-3 py-1 text-sm rounded ${sortBy === "name" ? "bg-[var(--unibe-red)] text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  Sort by name
                </button>
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Current position</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ranking AI</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ranking Recruiter</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">PDF</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Analyze</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Archiv / Löschen</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c) => (
                    <tr key={c.pdf_path} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{c.name || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{c.current_position || "—"}</td>
                      <td className="py-3 px-4">
                        {c.ranking_score != null ? (
                          <span
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                              c.ranking_score >= 80
                                ? "bg-green-100 text-green-800"
                                : c.ranking_score >= 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {c.ranking_score}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={c.recruiter_ranking ?? ""}
                          onChange={(e) =>
                            handleRecruiterRankingChange(
                              c.pdf_path,
                              e.target.value || null
                            )
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="">—</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {c.strengths || c.weaknesses ? (
                          <div className="space-y-1 text-xs">
                            {c.strengths && (
                              <div>
                                <span className="font-medium text-green-700">Strengths:</span>{" "}
                                {c.strengths}
                              </div>
                            )}
                            {c.weaknesses && (
                              <div>
                                <span className="font-medium text-amber-700">Weaknesses:</span>{" "}
                                {c.weaknesses}
                              </div>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewPdf(c.pdf_path)}
                          className="text-[var(--unibe-red)] hover:underline font-medium"
                        >
                          View PDF
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="text-[var(--unibe-red)] hover:underline"
                          >
                            {c.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleAnalyze(c.pdf_path)}
                          disabled={!!analyzing}
                          className="px-3 py-1 text-xs font-medium rounded bg-[var(--unibe-red)] text-white hover:bg-[var(--unibe-red-dark)] disabled:opacity-50"
                        >
                          {analyzing === c.pdf_path ? "Analyzing…" : c.ranking_score != null ? "Re-analyze" : "Analyze"}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleArchive(c.pdf_path)}
                            disabled={!!archiving || !!deleting}
                            className="px-3 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                          >
                            {archiving === c.pdf_path ? "…" : "Archivieren"}
                          </button>
                          <button
                            onClick={() => handleDelete(c.pdf_path)}
                            disabled={!!archiving || !!deleting}
                            className="px-3 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            {deleting === c.pdf_path ? "…" : "Löschen"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {candidates.length === 0 && (
              <p className="text-center text-gray-500 py-12">No applications yet.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

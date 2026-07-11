"use client";

import React, { useState } from "react";
import { useDialog } from "@/components/DialogProvider";

type ApiKeyData = {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: string | Date;
};

interface ApiKeyManagerProps {
  appId: string;
  initialKeys: ApiKeyData[];
}

export function ApiKeyManager({ appId, initialKeys }: ApiKeyManagerProps) {
  const { alert, confirm } = useDialog();
  const [keys, setKeys] = useState<ApiKeyData[]>(initialKeys);
  const [name, setName] = useState("");
  const [accessType, setAccessType] = useState<"ALL" | "CUSTOM">("ALL");
  const [readScope, setReadScope] = useState(true);
  const [writeScope, setWriteScope] = useState(false);
  const [deleteScope, setDeleteScope] = useState(false);

  const [loading, setLoading] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedKey(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a key name.");
      return;
    }

    const activeScopes: string[] = [];
    if (accessType === "ALL") {
      activeScopes.push("ALL");
    } else {
      if (readScope) activeScopes.push("READ");
      if (writeScope) activeScopes.push("WRITE");
      if (deleteScope) activeScopes.push("DELETE");
    }

    if (activeScopes.length === 0) {
      setError("Please select at least one scope for custom access.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/apps/${appId}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, scopes: activeScopes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate key.");
      }

      setGeneratedKey(data.apiKey.key);
      setKeys((current) => [data.apiKey, ...current]);
      setName("");
      // Reset checkboxes
      setReadScope(true);
      setWriteScope(false);
      setDeleteScope(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate key.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await alert("API key copied to clipboard!", "Copied");
    } catch {
      setError("Unable to copy API key to clipboard.");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    setError(null);

    const confirmed = await confirm(
      "Revoke this API key? This action cannot be undone.",
      "Revoke API Key"
    );
    if (!confirmed) {
      return;
    }

    setRevokingKeyId(keyId);

    try {
      const response = await fetch(`/api/apps/${appId}/keys/${keyId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to revoke key.");
      }

      setKeys((current) => current.filter((k) => k.id !== keyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke key.");
    } finally {
      setRevokingKeyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generated key success banner */}
      {generatedKey && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
            <span>✨</span>
            <span>Key Generated Successfully!</span>
          </div>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Please copy this key now. For security reasons, you will <strong>not</strong> be able to see it again.
          </p>
          <div className="flex items-center gap-2 bg-slate-950/80 border border-white/10 rounded-lg p-3">
            <code className="text-sm font-mono text-emerald-300 break-all select-all flex-1">
              {generatedKey}
            </code>
            <button
              onClick={() => copyToClipboard(generatedKey)}
              className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-md px-3 py-1.5 transition-colors shrink-0"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Key generator form */}
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-base font-semibold text-white mb-4">Create API Key</h3>
          
          <form onSubmit={handleGenerateKey} className="space-y-5">
            <div>
              <label htmlFor="keyName" className="block text-xs font-medium text-slate-400 mb-1.5">
                Key Name
              </label>
              <input
                id="keyName"
                type="text"
                placeholder="e.g. Production Client"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-500/40"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-400 mb-2">
                Access Level
              </span>
              
              <div className="space-y-3">
                {/* Radio: ALL */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/3 hover:bg-white/5 cursor-pointer transition">
                  <input
                    type="radio"
                    name="accessType"
                    value="ALL"
                    checked={accessType === "ALL"}
                    onChange={() => setAccessType("ALL")}
                    className="mt-0.5 h-4 w-4 accent-indigo-500 text-indigo-500 bg-slate-950 border-white/10"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">Full Access (ALL)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Allows complete read, write, and delete operations across all collections.</p>
                  </div>
                </label>

                {/* Radio: CUSTOM */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/3 hover:bg-white/5 cursor-pointer transition">
                  <input
                    type="radio"
                    name="accessType"
                    value="CUSTOM"
                    checked={accessType === "CUSTOM"}
                    onChange={() => setAccessType("CUSTOM")}
                    className="mt-0.5 h-4 w-4 accent-indigo-500 text-indigo-500 bg-slate-950 border-white/10"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">Custom Access</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Define a customized combination of permission scopes below.</p>
                  </div>
                </label>

                {/* Custom Scope Checkboxes */}
                {accessType === "CUSTOM" && (
                  <div className="ml-7 p-3 rounded-lg border border-white/5 bg-slate-950/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Select scopes</span>
                    
                    {/* Checkbox: READ */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={readScope}
                        onChange={(e) => setReadScope(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500 rounded border-white/10 bg-slate-950"
                      />
                      <div>
                        <span className="text-xs font-medium text-white">READ</span>
                        <span className="text-[10px] text-slate-500 ml-2">(Fetch items/collections)</span>
                      </div>
                    </label>

                    {/* Checkbox: WRITE */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={writeScope}
                        onChange={(e) => setWriteScope(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500 rounded border-white/10 bg-slate-950"
                      />
                      <div>
                        <span className="text-xs font-medium text-white">WRITE</span>
                        <span className="text-[10px] text-slate-500 ml-2">(Create and upload items)</span>
                      </div>
                    </label>

                    {/* Checkbox: DELETE */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deleteScope}
                        onChange={(e) => setDeleteScope(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500 rounded border-white/10 bg-slate-950"
                      />
                      <div>
                        <span className="text-xs font-medium text-white">DELETE</span>
                        <span className="text-[10px] text-slate-500 ml-2">(Remove items/collections)</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-400 py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {loading ? "Generating..." : "Generate API Key"}
            </button>
          </form>
        </div>

        {/* Existing keys list */}
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 flex flex-col">
          <h3 className="text-base font-semibold text-white mb-4">Active API Keys</h3>

          {keys.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <span className="text-3xl mb-2">🔑</span>
              <p className="text-xs font-medium text-slate-400">No API keys created yet</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Generate a key to securely integrate Pickaso into your apps.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="rounded-lg border border-white/5 bg-white/3 p-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{k.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] text-slate-400">
                        Created on {new Date(k.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 flex-wrap justify-end sm:max-w-[260px]">
                      {k.scopes.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-slate-300 uppercase tracking-wide"
                        >
                          {s === "ALL" ? "Full Access" : s}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeKey(k.id)}
                      disabled={revokingKeyId === k.id}
                      className="inline-flex items-center justify-center rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {revokingKeyId === k.id ? "Revoking..." : "Revoke key"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

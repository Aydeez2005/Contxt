"use client";

import { useState, use } from "react";
import { Send } from "lucide-react";
import { ActionBtn } from "@/components/dashboard/action-btn";
import { DashInput, FieldLabel } from "@/components/dashboard/dash-input";
import { Spinner } from "@/components/kibo-ui/spinner";
import { api } from "@/lib/api";

export default function TestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [queryText, setQueryText] = useState("");
  const [queryTelegramId, setQueryTelegramId] = useState("");
  const [queryReply, setQueryReply] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    setQueryLoading(true);
    setQueryReply(null);
    try {
      const res = await api.query(slug, queryText, parseInt(queryTelegramId, 10));
      setQueryReply(res.reply);
    } catch (err) {
      setQueryReply(`Error: ${err instanceof Error ? err.message : "Failed."}`);
    } finally {
      setQueryLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 560 }}>
      <p style={{ fontSize: 13.5, color: "var(--ink-50)", fontFamily: "var(--font-dm-sans)", lineHeight: 1.65 }}>
        Send a query as any member without Telegram. Useful for testing during setup.
      </p>

      <div style={{ borderRadius: 16, border: "1px solid var(--rule)", background: "white", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <form onSubmit={handleQuery} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <FieldLabel>Member Telegram ID</FieldLabel>
            <DashInput
              mono
              placeholder="123456789"
              value={queryTelegramId}
              onChange={e => setQueryTelegramId(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <div>
            <FieldLabel>Query</FieldLabel>
            <div style={{ display: "flex", gap: 8 }}>
              <DashInput
                placeholder="What is the team working on today?"
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                required
              />
              <ActionBtn type="submit" disabled={queryLoading}>
                {queryLoading ? <Spinner size={12} /> : <Send style={{ width: 13, height: 13 }} />}
                Send
              </ActionBtn>
            </div>
          </div>
        </form>

        {queryReply && (
          <div style={{ borderRadius: 12, border: "1px solid var(--rule)", background: "var(--surface)", padding: "1rem 1.125rem" }}>
            <p style={{ fontSize: 9.5, fontFamily: "var(--font-dm-sans)", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 10 }}>
              Agent reply
            </p>
            <p style={{ fontSize: 13.5, color: "var(--ink-70)", fontFamily: "var(--font-dm-sans)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {queryReply}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

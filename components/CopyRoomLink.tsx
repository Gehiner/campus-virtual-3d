"use client";

import { useState } from "react";

export default function CopyRoomLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function copy() {
    setError("");
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${encodeURIComponent(code)}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "No se pudo copiar el enlace.");
    }
  }

  return (
    <button className="btn small" type="button" onClick={copy}>
      {copied ? "Enlace copiado" : error ? "No se pudo copiar" : "Copiar enlace de invitación"}
    </button>
  );
}

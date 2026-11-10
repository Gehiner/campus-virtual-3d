"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  mode: "login" | "register" | "recover" | "reset";
  room: string;
  errorMessage?: string;
};

export default function AuthForm({ mode, room, errorMessage }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(errorMessage ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    const fullName = String(values.get("fullName") ?? "").trim();
    const supabase = createClient();

    try {
      if (mode === "recover") {
        const redirectTo = new URL("/auth/callback", window.location.origin);
        redirectTo.searchParams.set("next", "/auth?mode=reset");
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo.toString() });
        setMessage(error?.message ?? "Si el correo está registrado, recibirás un enlace para cambiar la contraseña.");
      } else if (mode === "reset") {
        const confirmPassword = String(values.get("confirmPassword") ?? "");
        if (password.length < 8 || password !== confirmPassword) {
          setMessage("Las contraseñas deben coincidir y tener al menos 8 caracteres.");
        } else {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) {
            setMessage(error.message);
          } else {
            router.replace("/estudiante");
            router.refresh();
          }
        }
      } else if (mode === "register") {
        const emailRedirectTo = new URL("/auth/callback", window.location.origin);
        if (room) emailRedirectTo.searchParams.set("room", room);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: emailRedirectTo.toString(),
          },
        });
        if (error) {
          setMessage(error.message);
        } else if (data.session) {
          router.replace(room ? `/s/${encodeURIComponent(room)}?join=1` : "/estudiante");
          router.refresh();
        } else {
          setMessage(
            "Supabase todavía exige confirmar el correo. En Authentication → Sign In / Providers → Email, desactiva Confirm email y guarda los cambios. Después inicia sesión; si la cuenta sigue pendiente, elimínala desde Authentication → Users y créala de nuevo.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(error.message);
        } else {
          router.replace(room ? `/s/${encodeURIComponent(room)}?join=1` : "/estudiante");
          router.refresh();
        }
      }
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "No se pudo completar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "register" && (
        <label>
          Nombre completo
          <input name="fullName" type="text" autoComplete="name" minLength={2} maxLength={120} required />
        </label>
      )}
      {mode !== "reset" && (
        <label>
          Correo electrónico
          <input name="email" type="email" autoComplete="email" required />
        </label>
      )}
      {mode !== "recover" && (
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete={mode === "register" || mode === "reset" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
          {(mode === "register" || mode === "reset") && <small>Usa al menos 8 caracteres.</small>}
        </label>
      )}
      {mode === "reset" && (
        <label>
          Confirmar contraseña
          <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
        </label>
      )}
      {message && <p className="auth-message" role="status">{message}</p>}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Un momento…" : mode === "register" ? "Crear cuenta"
          : mode === "recover" ? "Enviar enlace"
            : mode === "reset" ? "Guardar contraseña"
              : "Entrar"}
      </button>
    </form>
  );
}

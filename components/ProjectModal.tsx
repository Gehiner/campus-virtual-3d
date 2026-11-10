"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Project } from "@/data/projects";
import type { Role } from "@/lib/roles";
import { CAN_LIKE } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

type Props = {
  project: Project;
  role: Role;
  likes: number;
  hasLiked: boolean;
  onLike: () => void;
  interactionError: string;
  activityCode?: string;
  onClose: () => void;
};

// Solo permitimos enlaces http/https. Cuando los proyectos vengan de la base
// de datos, esto evita enlaces tipo "javascript:..." maliciosos.
function safeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

type Question = { id: string; author_id: string; content: string; created_at: string };
type Answer = { id: string; question_id: string; author_id: string; content: string };

export default function ProjectModal({
  project,
  role,
  likes,
  hasLiked,
  onLike,
  interactionError,
  activityCode,
  onClose,
}: Props) {
  const href = safeUrl(project.url);
  const canLike = CAN_LIKE[role];
  const [userId, setUserId] = useState<string | null>(null);
  const [projectAuthorId, setProjectAuthorId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionError, setQuestionError] = useState("");

  async function loadDiscussion() {
    if (!activityCode || role === "observador") return;
    try {
      const supabase = createClient();
      const [{ data: { user }, error: userError }, { data: projectRecord, error: projectError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("projects").select("student_id").eq("id", project.id).single(),
      ]);
      if (userError) {
        setQuestionError(`No se pudo validar la sesión: ${userError.message}`);
        return;
      }
      if (projectError) {
        setQuestionError(`No se pudo consultar el proyecto: ${projectError.message}`);
        return;
      }
      setUserId(user?.id ?? null);
      setProjectAuthorId(projectRecord.student_id);
      const { data: questionRows, error: questionsError } = await supabase
        .from("project_questions")
        .select("id, author_id, content, created_at")
        .eq("project_id", project.id)
        .order("created_at");
      if (questionsError) {
        setQuestionError(`No se pudieron cargar las preguntas: ${questionsError.message}`);
        return;
      }
      const nextQuestions = questionRows ?? [];
      setQuestions(nextQuestions);
      if (!nextQuestions.length) {
        setAnswers([]);
        return;
      }
      const { data: answerRows, error: answersError } = await supabase
        .from("project_answers")
        .select("id, question_id, author_id, content")
        .in("question_id", nextQuestions.map((question) => question.id))
        .order("created_at");
      if (answersError) {
        setQuestionError(`No se pudieron cargar las respuestas: ${answersError.message}`);
        return;
      }
      setAnswers(answerRows ?? []);
    } catch (error) {
      setQuestionError(error instanceof Error ? error.message : "No se pudo cargar la conversación.");
    }
  }

  useEffect(() => {
    void loadDiscussion();
  }, [project.id, activityCode, role]);

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuestionError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const content = String(form.get("content") ?? "").trim();
    if (content.length < 2 || content.length > 2000) {
      setQuestionError("Escribe entre 2 y 2000 caracteres.");
      return;
    }
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setQuestionError(`No se pudo validar la sesión: ${userError.message}`);
        return;
      }
      if (!user) {
        setQuestionError("Inicia sesión como estudiante para dejar una pregunta.");
        return;
      }
      const { error } = await supabase.from("project_questions").insert({
        project_id: project.id,
        author_id: user.id,
        content,
      });
      if (error) {
        setQuestionError(`No se pudo publicar la pregunta: ${error.message}`);
        return;
      }
      formElement.reset();
      await loadDiscussion();
    } catch (error) {
      setQuestionError(error instanceof Error ? error.message : "No se pudo publicar la pregunta.");
    }
  }

  async function answerQuestion(event: FormEvent<HTMLFormElement>, questionId: string) {
    event.preventDefault();
    setQuestionError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const content = String(form.get("content") ?? "").trim();
    if (content.length < 2 || content.length > 2000) {
      setQuestionError("Escribe una respuesta de entre 2 y 2000 caracteres.");
      return;
    }
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setQuestionError(`No se pudo validar la sesión: ${userError.message}`);
        return;
      }
      if (!user) {
        setQuestionError("Inicia sesión para responder.");
        return;
      }
      const { error } = await supabase.from("project_answers").insert({
        question_id: questionId,
        author_id: user.id,
        content,
      });
      if (error) {
        setQuestionError(`No se pudo guardar la respuesta: ${error.message}`);
        return;
      }
      formElement.reset();
      await loadDiscussion();
    } catch (error) {
      setQuestionError(error instanceof Error ? error.message : "No se pudo guardar la respuesta.");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-cover"
          role="img"
          aria-label={`Portada de ${project.title}`}
          style={
            project.coverUrl
              ? { backgroundImage: `url(${project.coverUrl})` }
              : { background: `linear-gradient(135deg, ${project.color}, #0a1426)` }
          }
        >
          <span className="cover-index">ARCHIVO DE MEMORIAS</span>
          <strong>{project.title}</strong>
          <span>{project.category}</span>
        </div>
        <div className="modal-body">
          <span className="memory-category">{project.category}</span>
          <h2>{project.title}</h2>
          <p className="muted">Por {project.author}</p>
          <p className="memory-intro">{project.memory}</p>
          <p>{project.description}</p>

          <dl className="memory-details">
            <div>
              <dt>El reto</dt>
              <dd>{project.challenge}</dd>
            </div>
            <div>
              <dt>Lo que dejó</dt>
              <dd>{project.learning}</dd>
            </div>
          </dl>

          <div className="modal-actions">
            {href ? (
              <a className="btn primary" href={href} target="_blank" rel="noopener noreferrer">
                Abrir proyecto ↗
              </a>
            ) : (
              <span className="muted">Este proyecto no tiene un enlace válido.</span>
            )}

            {canLike && !(role === "estudiante" && projectAuthorId === userId && activityCode) ? (
              <button className="btn" onClick={onLike} disabled={hasLiked}>
                {hasLiked ? "♥ Ya diste like" : "♡ Me gusta"} · {likes}
              </button>
            ) : (
              <span className="muted">♥ {likes} · solo lectura</span>
            )}

            <button className="btn ghost" onClick={onClose}>
              Cerrar (Esc)
            </button>
          </div>
          {interactionError && <p className="auth-message" role="alert">{interactionError}</p>}
          {activityCode && role !== "observador" && (
            <section className="discussion">
              <h3>Preguntas y respuestas</h3>
              {questionError && <p className="auth-message" role="alert">{questionError}</p>}
              {role === "estudiante"
                && projectAuthorId !== userId
                && !questions.some((question) => question.author_id === userId) && (
                <form className="discussion-form" onSubmit={askQuestion}>
                  <label htmlFor="project-question">Deja una pregunta o comentario</label>
                  <textarea id="project-question" name="content" minLength={2} maxLength={2000} required />
                  <button className="btn small" type="submit">Publicar</button>
                </form>
              )}
              {questions.map((question) => {
                const questionAnswers = answers.filter((answer) => answer.question_id === question.id);
                const canAnswer = userId === projectAuthorId || role === "docente";
                const alreadyAnswered = questionAnswers.some((answer) => answer.author_id === userId);
                return (
                  <article className="question-card" key={question.id}>
                    <p><strong>{question.author_id === userId ? "Tú" : "Estudiante"}:</strong> {question.content}</p>
                    {questionAnswers.map((answer) => (
                      <p className="answer-item" key={answer.id}>
                        <strong>{answer.author_id === userId ? "Tú" : "Autor / docente"}:</strong> {answer.content}
                      </p>
                    ))}
                    {canAnswer && !alreadyAnswered && (
                      <form className="discussion-form" onSubmit={(event) => answerQuestion(event, question.id)}>
                        <label htmlFor={`answer-${question.id}`}>Tu respuesta</label>
                        <textarea id={`answer-${question.id}`} name="content" minLength={2} maxLength={2000} required />
                        <button className="btn small" type="submit">Responder</button>
                      </form>
                    )}
                  </article>
                );
              })}
              {!questions.length && <p className="muted">Aún no hay preguntas.</p>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

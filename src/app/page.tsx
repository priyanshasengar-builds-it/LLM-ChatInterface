import type { Metadata } from "next";
import Link from "next/link";

const REPO_URL =
  "https://github.com/priyanshasengar-builds-it/LLM-ChatInterface";
const LINKEDIN_URL =
  "https://www.linkedin.com/in/priyansha-sengar-8b00b4145/";

const TECH = [
  "Next.js 15",
  "React 19",
  "TypeScript",
  "TanStack Query",
  "WebSockets",
  "Node (custom server)",
  "Groq · Llama 3.3",
];

const HIGHLIGHTS = [
  "A custom Node server runs Next.js and a WebSocket server together on one port.",
  "AI responses stream token-by-token, pushed live to the browser over the socket.",
  "TanStack Query drives send / loading / error states; a reducer assembles the stream.",
  "Provider-agnostic backend (OpenAI-compatible); models swap in a single file.",
];

export const metadata: Metadata = {
  title: "LLM Chat: real-time streaming chat (Next.js, WebSockets)",
  description:
    "A single-page chat interface that streams AI responses token-by-token over WebSockets. Built with Next.js, TypeScript, TanStack Query, and a custom Node server.",
};

export default function Home() {
  return (
    <main className="landing">
      <article className="landing__card">
        <span className="landing__eyebrow">Full-stack · Real-time</span>
        <h1 className="landing__title">LLM Chat Interface</h1>
        <p className="landing__desc">
          A single-page chat app that streams AI responses token-by-token over
          WebSockets.
        </p>

        <ul className="badges" aria-label="Tech stack">
          {TECH.map((t) => (
            <li key={t} className="badge">
              {t}
            </li>
          ))}
        </ul>

        <section className="landing__highlights">
          <h2>Architecture highlights</h2>
          <ul>
            {HIGHLIGHTS.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>

        <div className="landing__actions">
          <a
            className="btn btn--ghost"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Code →
          </a>
          <Link className="btn btn--primary" href="/chat">
            Live Demo
          </Link>
        </div>
      </article>

      <footer className="landing__footer">
        <span>Built by Priyansha Sengar</span>
        <span className="landing__footer-sep" aria-hidden>
          ·
        </span>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <span className="landing__footer-sep" aria-hidden>
          ·
        </span>
        <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
      </footer>
    </main>
  );
}

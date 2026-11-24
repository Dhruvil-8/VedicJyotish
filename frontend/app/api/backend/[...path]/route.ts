import { NextRequest } from "next/server";
import { handleChatStream, handleReportStream } from "@/app/lib/geminiStream";

// Configure Edge Runtime for Cloudflare Pages and Vercel Edge Functions
export const runtime = "edge";

// Allow up to 60 seconds for long-running Server-Sent Events (SSE) AI report streaming
export const maxDuration = 60;

/**
 * Dynamically resolve the Gemini API Key from environment variables at request time.
 * In Edge runtimes (Cloudflare Pages / Vercel Edge), direct static property access
 * (e.g. process.env.GEMINI_API_KEY) is required so the Next.js compiler inlines
 * and binds the variable properly.
 */
function getGeminiApiKey(): string {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_AI_KEY ||
    (typeof globalThis !== "undefined" && (globalThis as any).GEMINI_API_KEY) ||
    (typeof globalThis !== "undefined" && (globalThis as any).GOOGLE_API_KEY) ||
    (typeof globalThis !== "undefined" && (globalThis as any).GEMINI_KEY) ||
    (typeof globalThis !== "undefined" && (globalThis as any).GOOGLE_GEMINI_API_KEY) ||
    (typeof globalThis !== "undefined" && (globalThis as any).GOOGLE_AI_KEY) ||
    (typeof globalThis !== "undefined" && (globalThis as any).__ENV__?.GEMINI_API_KEY) ||
    (typeof globalThis !== "undefined" && (globalThis as any).__ENV__?.GOOGLE_API_KEY) ||
    "";

  return String(rawKey || "").replace(/^["']|["']$/g, "").trim();
}

/**
 * Dynamically resolve the backend URL at request time.
 */
function getBackendUrl(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof globalThis !== "undefined" && (globalThis as any).BACKEND_URL) ||
    (typeof globalThis !== "undefined" && (globalThis as any).NEXT_PUBLIC_API_URL) ||
    (typeof globalThis !== "undefined" && (globalThis as any).__ENV__?.BACKEND_URL) ||
    "http://127.0.0.1:7860";

  return String(raw).replace(/\/+$/, "");
}

/**
 * Dynamically resolve the server backend secret API key.
 */
function getServerApiKey(): string {
  const raw =
    process.env.API_SECRET_KEY ||
    process.env.BACKEND_API_KEY ||
    (typeof globalThis !== "undefined" && (globalThis as any).API_SECRET_KEY) ||
    (typeof globalThis !== "undefined" && (globalThis as any).BACKEND_API_KEY) ||
    (typeof globalThis !== "undefined" && (globalThis as any).__ENV__?.API_SECRET_KEY) ||
    "";

  return String(raw || "").replace(/^["']|["']$/g, "").trim();
}

function isLocalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "0.0.0.0" ||
      parsed.hostname === "::1"
    );
  } catch {
    return true;
  }
}

/**
 * Redact any accidental API keys or secrets from error logs and client responses.
 */
function sanitizeError(msg: any): string {
  if (!msg) return "";
  return String(msg)
    .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED]")
    .replace(/(?:key|apiKey|api_key|token)[=:][\s]*["']?[^&\s"'\\}]+/gi, "key=[REDACTED]");
}

async function proxyRequest(
  req: NextRequest,
  paramsPromise: Promise<{ path: string[] }>
): Promise<Response> {
  try {
    const resolvedParams = await Promise.resolve(paramsPromise);
    const path = resolvedParams?.path;
    const subpath = Array.isArray(path) ? path.join("/") : (typeof path === "string" ? path : "");

    // Read request body once safely so the body stream is never consumed twice
    let reqBodyText = "";
    let parsedBody: any = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        reqBodyText = await req.text();
        if (reqBodyText) {
          parsedBody = JSON.parse(reqBodyText);
        }
      } catch {}
    }

    // ─── Direct Serverless Gemini AI Handlers ──────────────────────────────
    // If request is for AI report or chat, handle directly via Gemini API
    const isAiStreaming =
      subpath === "generate_report" || subpath === "chat_with_astrologer";

    if (isAiStreaming) {
      const geminiApiKey = getGeminiApiKey();

      if (geminiApiKey) {
        try {
          const body = parsedBody || {};
          if (subpath === "generate_report") {
            return await handleReportStream(body, geminiApiKey);
          } else if (subpath === "chat_with_astrologer") {
            return await handleChatStream(
              body.chart_data,
              body.question,
              body.history || [],
              geminiApiKey
            );
          }
        } catch (geminiErr: any) {
          const sanitized = sanitizeError(geminiErr?.message || String(geminiErr));
          console.error("Direct serverless Gemini handler failed:", sanitized);
          return new Response(
            `data: ${JSON.stringify({
              error: `AI Service Error: ${sanitized}`,
            })}\n\n`,
            {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            }
          );
        }
      }

      // If no Gemini API key is configured and backend URL points to localhost
      // (which is unreachable in Cloudflare Pages / Edge serverless runtime)
      const backendUrl = getBackendUrl();
      if (isLocalUrl(backendUrl)) {
        return new Response(
          `data: ${JSON.stringify({
            error:
              "Gemini AI API key is not configured. Please add GEMINI_API_KEY or GOOGLE_API_KEY to your environment variables in Cloudflare Pages (under both Production and Preview scopes).",
          })}\n\n`,
          {
            status: 200,
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          }
        );
      }
    }

    const backendUrl = getBackendUrl();
    const reqUrl = new URL(req.url);
    const targetUrl = `${backendUrl}/${subpath}${reqUrl.search}`;

    const headers = new Headers();
    // Pass through relevant incoming headers
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const accept = req.headers.get("accept");
    if (accept) headers.set("accept", accept);

    // Invert client-side key exposure: inject secret securely on the server
    const serverApiKey = getServerApiKey();
    if (serverApiKey) {
      headers.set("X-API-Key", serverApiKey);
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD" && reqBodyText) {
      init.body = reqBodyText;
    }

    const backendRes = await fetch(targetUrl, init);

    // Prepare response headers
    const responseHeaders = new Headers();
    const resContentType = backendRes.headers.get("content-type");
    if (resContentType) {
      responseHeaders.set("content-type", resContentType);
    }

    // Pass through SSE buffering control
    const xAccelBuffering = backendRes.headers.get("x-accel-buffering");
    if (xAccelBuffering) {
      responseHeaders.set("x-accel-buffering", xAccelBuffering);
    }

    return new Response(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    const sanitized = sanitizeError(err?.message || String(err));
    console.error("Backend proxy error:", sanitized);
    return new Response(
      JSON.stringify({
        detail: "Backend service unreachable via server proxy.",
        error: sanitized,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context.params);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context.params);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

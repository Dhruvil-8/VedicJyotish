import { NextRequest } from "next/server";
import { handleChatStream, handleReportStream } from "@/app/lib/geminiStream";

// Configure Edge Runtime for Cloudflare Pages and Vercel Edge Functions
export const runtime = "edge";

// Allow up to 60 seconds for long-running Server-Sent Events (SSE) AI report streaming
export const maxDuration = 60;

// Server-side target URL (defaults to localhost:7860 or external deployment)
const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:7860"
).replace(/\/+$/, "");

// Server-only API Key (NEVER exposed to client browser via NEXT_PUBLIC_)
const SERVER_API_KEY = process.env.API_SECRET_KEY || process.env.BACKEND_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function proxyRequest(
  req: NextRequest,
  paramsPromise: Promise<{ path: string[] }>
): Promise<Response> {
  try {
    const { path } = await paramsPromise;
    const subpath = Array.isArray(path) ? path.join("/") : "";

    // ─── Direct Serverless Gemini AI Handlers ──────────────────────────────
    // If GEMINI_API_KEY is configured in Vercel/Cloudflare, handle AI chat & reports
    // serverlessly with zero dependency on the Rust backend process.
    if (GEMINI_API_KEY && (subpath === "generate_report" || subpath === "chat_with_astrologer")) {
      try {
        const body = await req.json();
        if (subpath === "generate_report") {
          return handleReportStream(body, GEMINI_API_KEY);
        } else if (subpath === "chat_with_astrologer") {
          return handleChatStream(
            body.chart_data,
            body.question,
            body.history || [],
            GEMINI_API_KEY
          );
        }
      } catch (geminiErr: any) {
        console.warn("Direct serverless Gemini handler failed, attempting backend fallback:", geminiErr);
      }
    }

    const reqUrl = new URL(req.url);
    const targetUrl = `${BACKEND_URL}/${subpath}${reqUrl.search}`;

    const headers = new Headers();
    // Pass through relevant incoming headers
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const accept = req.headers.get("accept");
    if (accept) headers.set("accept", accept);

    // Invert client-side key exposure: inject secret securely on the server
    if (SERVER_API_KEY) {
      headers.set("X-API-Key", SERVER_API_KEY);
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const bodyBytes = await req.arrayBuffer();
      if (bodyBytes.byteLength > 0) {
        init.body = Buffer.from(bodyBytes);
      }
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
    console.error("Backend proxy error:", err);
    return new Response(
      JSON.stringify({
        detail: "Backend service unreachable via server proxy.",
        error: err?.message || String(err),
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

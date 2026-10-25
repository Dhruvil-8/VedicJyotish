import { NextRequest } from "next/server";

// Server-side target URL (defaults to localhost:7860 or external deployment)
const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:7860"
).replace(/\/+$/, "");

// Server-only API Key (NEVER exposed to client browser via NEXT_PUBLIC_)
const SERVER_API_KEY = process.env.API_SECRET_KEY || process.env.BACKEND_API_KEY || "";

async function proxyRequest(
  req: NextRequest,
  paramsPromise: Promise<{ path: string[] }>
): Promise<Response> {
  try {
    const { path } = await paramsPromise;
    const subpath = Array.isArray(path) ? path.join("/") : "";
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
      // Forward the request body as stream or buffer
      init.body = req.body;
      // @ts-ignore - 'duplex' is required for Node.js fetch when streaming body
      init.duplex = "half";
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

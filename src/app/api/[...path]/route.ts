/**
 * Same-origin proxy to the FastAPI backend.
 *
 * This replaces the `rewrites()` entry that used to serve `/api/:path*`. The
 * rewrite worked for ordinary JSON but broke `text/event-stream`: measured
 * against the same agent turn, a direct hit on the backend delivered 379
 * chunks over 48s while the rewrite delivered *one* chunk and ended the
 * response at 11.75s. The agent's tokens, tool_call and tool_result events
 * were collapsed into a single late blob and the tail was dropped, which is
 * why chat looked like a 45-second hang followed by an answer appearing all at
 * once.
 *
 * A route handler that forwards `response.body` untouched keeps the chunk
 * boundaries the backend wrote, so SSE arrives incrementally.
 */

const BACKEND_URL = (process.env.API_BACKEND_URL ?? "http://localhost:8000").replace(/\/$/, "");

/**
 * Hop-by-hop headers, plus the ones the fetch layer must recompute for the
 * upstream connection. Forwarding `host` sends the browser's `:3000` to the
 * backend; forwarding a length or encoding that no longer matches the body we
 * pass along corrupts the request.
 */
const STRIPPED_REQUEST_HEADERS = new Set([
    "host",
    "connection",
    "keep-alive",
    "transfer-encoding",
    "upgrade",
    "content-length",
    "accept-encoding",
]);

const STRIPPED_RESPONSE_HEADERS = new Set([
    "connection",
    "keep-alive",
    "transfer-encoding",
    "content-encoding",
    "content-length",
]);

function upstreamUrl(request: Request, path: string[]): string {
    const search = new URL(request.url).search;
    return `${BACKEND_URL}/${path.join("/")}${search}`;
}

function forwardHeaders(request: Request): Headers {
    const headers = new Headers();
    request.headers.forEach((value, key) => {
        if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });
    return headers;
}

async function proxy(request: Request, path: string[]): Promise<Response> {
    const method = request.method;
    const hasBody = method !== "GET" && method !== "HEAD";

    let init: RequestInit & { duplex?: "half" };
    if (hasBody) {
        // Buffer the *request* body. Streaming it would need `duplex: 'half'`
        // and undici rejects that against a plain HTTP/1.1 origin; request
        // bodies here are small JSON payloads, so there is nothing to gain.
        const body = await request.arrayBuffer();
        init = { method, headers: forwardHeaders(request), body };
    } else {
        init = { method, headers: forwardHeaders(request) };
    }

    let upstream: Response;
    try {
        upstream = await fetch(upstreamUrl(request, path), {
            ...init,
            // Pass the backend's own status through rather than following its
            // redirects here, so the browser keeps seeing one hop.
            redirect: "manual",
            cache: "no-store",
            signal: request.signal,
        });
    } catch (err) {
        // The backend being down is an expected condition in development, not
        // a proxy bug. Return RFC 9457 Problem Details JSON.
        const detail = err instanceof Error ? err.message : "upstream unreachable";
        const problem = {
            type: "https://errors.oshift.ai/UPSTREAM_5XX_ERROR",
            title: "Bad Gateway",
            status: 502,
            detail: `backend unreachable: ${detail}`,
            instance: request.url,
            code: "UPSTREAM_5XX_ERROR",
            retryable: true,
            timestamp: new Date().toISOString(),
            errors: [],
        };
        return new Response(JSON.stringify(problem), {
            status: 502,
            statusText: "Bad Gateway",
            headers: {
                "content-type": "application/problem+json",
                "cache-control": "no-store",
            },
        });
    }

    const headers = new Headers();
    upstream.headers.forEach((value, key) => {
        if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });
    // Tell any intermediary not to sit on the stream waiting for a full body.
    if (headers.get("content-type")?.includes("text/event-stream")) {
        headers.set("cache-control", "no-cache, no-transform");
        headers.set("x-accel-buffering", "no");
    }

    // `upstream.body` is handed over as-is: no reader, no re-encode, no
    // intermediate buffer. That is the whole point of this file.
    return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
    });
}

type Context = { params: Promise<{ path: string[] }> };

// Declared per method rather than aliased from one shared const: Next's route
// compiler detects these exports statically, and `export const GET = handler`
// is not recognised as a handler — the route silently 404s to the app's
// not-found page.
export async function GET(request: Request, ctx: Context): Promise<Response> {
    return proxy(request, (await ctx.params).path);
}

export async function POST(request: Request, ctx: Context): Promise<Response> {
    return proxy(request, (await ctx.params).path);
}

export async function PUT(request: Request, ctx: Context): Promise<Response> {
    return proxy(request, (await ctx.params).path);
}

export async function PATCH(request: Request, ctx: Context): Promise<Response> {
    return proxy(request, (await ctx.params).path);
}

export async function DELETE(request: Request, ctx: Context): Promise<Response> {
    return proxy(request, (await ctx.params).path);
}

export async function HEAD(request: Request, ctx: Context): Promise<Response> {
    return proxy(request, (await ctx.params).path);
}

// Never prerender or cache: every path here is a live, authenticated call.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

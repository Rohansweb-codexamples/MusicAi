import { createSign } from "node:crypto";
import { AppError } from "../errors";
import type { GenerationResult, MusicProvider, ProgressFn, ProviderInput } from "./types";

const MODEL = "lyria-3-pro-preview";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://aiplatform.googleapis.com/v1beta1";
const TOKEN_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const MAX_DURATION_SECONDS = 184;

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function serviceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new AppError(
      503,
      "Google Lyria is not configured. Add GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON to the server secrets.",
    );
  }

  try {
    const account = JSON.parse(raw) as ServiceAccount;
    if (!account.client_email || !account.private_key) throw new Error("Missing service account fields");
    return account;
  } catch {
    throw new AppError(503, "GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON is not valid service-account JSON.");
  }
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken(account: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const unsigned = [
    base64url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    base64url(JSON.stringify({
      iss: account.client_email,
      scope: TOKEN_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })),
  ].join(".");

  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = unsigned + "." + signer.sign(account.private_key).toString("base64url");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({})) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!response.ok || !result.access_token) {
    throw new AppError(502, "Google authentication failed: " + (result.error_description || response.statusText));
  }

  cachedToken = {
    value: result.access_token,
    expiresAt: Date.now() + Number(result.expires_in || 3600) * 1000,
  };
  return result.access_token;
}

function makePrompt(input: ProviderInput) {
  const parts = [
    "Create an original, complete, professionally produced song.",
    "Target duration approximately " + Math.min(input.duration, MAX_DURATION_SECONDS) + " seconds.",
    "Genre: " + input.genre + ".",
    "Mood: " + input.mood + ".",
    input.tempo ? "Tempo: approximately " + input.tempo + " BPM." : "",
    input.mode === "INSTRUMENTAL"
      ? "Instrumental only: absolutely no singing, spoken words, or vocals."
      : "Include expressive lead singing and a complete vocal performance. Follow the supplied lyrics exactly where possible. Arrange a clear intro, verses, memorable chorus, bridge, and final chorus.",
    "Creative direction: " + input.prompt,
    input.mode === "INSTRUMENTAL"
      ? ""
      : "Lyrics to sing:\n" + (input.lyrics?.trim() || ""),
  ];
  return parts.filter(Boolean).join("\n\n");
}

export const lyriaProvider: MusicProvider = {
  name: "lyria",

  async generate(input: ProviderInput, onProgress: ProgressFn): Promise<GenerationResult> {
    if (input.duration > MAX_DURATION_SECONDS) {
      throw new AppError(400, "Lyria 3 Pro supports songs up to about 3 minutes. Choose 184 seconds or less.");
    }

    const account = serviceAccount();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || account.project_id;
    if (!projectId) {
      throw new AppError(503, "Add GOOGLE_CLOUD_PROJECT_ID or include project_id in the Google service account JSON.");
    }

    await onProgress(10, "Connecting to Google Lyria 3 Pro");
    const token = await accessToken(account);

    await onProgress(22, "Composing your full song");
    const response = await fetch(
      `${API_BASE}/projects/${encodeURIComponent(projectId)}/locations/global/interactions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          input: [{ type: "text", text: makePrompt(input) }],
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(9 * 60 * 1000),
      },
    );

    const result = await response.json().catch(() => ({})) as {
      id?: string;
      status?: string;
      outputs?: Array<{ type?: string; data?: string; text?: string; mime_type?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      const detail = result.error?.message || response.statusText;
      throw new AppError(response.status === 429 ? 429 : 502, `Google Lyria returned ${response.status}: ${detail}`);
    }

    await onProgress(88, "Finishing the audio master");
    const audioOutput = result.outputs?.find((item) => item.type === "audio" && item.data);
    if (!audioOutput?.data) {
      throw new AppError(502, "Google Lyria completed without returning an audio file. Check the Google Cloud model access and API settings.");
    }

    const audio = Buffer.from(audioOutput.data, "base64");
    if (!audio.length) throw new AppError(502, "Google Lyria returned an empty audio file.");

    await onProgress(96, "Saving your song");
    return {
      audio,
      mime: audioOutput.mime_type || "audio/mpeg",
      extension: (audioOutput.mime_type || "audio/mpeg").includes("wav") ? "wav" : "mp3",
      provider: "google-lyria",
      model: MODEL,
      providerJobId: result.id,
    };
  },
};

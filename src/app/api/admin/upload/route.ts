import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { applyRefreshedCookies, requireAdminSession } from "@/lib/admin-auth";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function getCloudinaryConfig() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();
  const folder = (process.env.CLOUDINARY_FOLDER || "donluydd/produtos").trim();

  if (!cloudName) {
    return { configured: false as const, mode: "none" as const };
  }
  if (apiKey && apiSecret) {
    return {
      configured: true as const,
      mode: "signed" as const,
      cloudName,
      apiKey,
      apiSecret,
      folder,
    };
  }
  if (uploadPreset) {
    return {
      configured: true as const,
      mode: "unsigned" as const,
      cloudName,
      uploadPreset,
      folder,
    };
  }
  return { configured: false as const, mode: "none" as const };
}

function optimizeCloudinaryUrl(rawUrl: string): string {
  // Injeta f_auto,q_auto,w_960,c_limit na URL de entrega do Cloudinary
  // para entrega ultrarrápida em WebP/AVIF sem alterar o asset original.
  const marker = "/image/upload/";
  const idx = rawUrl.indexOf(marker);
  if (idx === -1) return rawUrl;
  const before = rawUrl.slice(0, idx + marker.length);
  const after = rawUrl.slice(idx + marker.length);
  if (after.startsWith("f_auto,")) return rawUrl;
  return `${before}f_auto,q_auto,w_960,c_limit/${after}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const cfg = getCloudinaryConfig();
  return applyRefreshedCookies(
    NextResponse.json({
      configured: cfg.configured,
      mode: cfg.mode,
      folder: cfg.configured ? cfg.folder : null,
    }),
    auth.refreshedTokens
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const cfg = getCloudinaryConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      {
        error:
          "Cloudinary não configurado no servidor. Defina CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET (ou CLOUDINARY_UPLOAD_PRESET) no .env.local, ou cole a URL da imagem manualmente.",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Envie um arquivo de imagem no campo 'file'." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato não suportado. Use JPG, PNG, WebP ou AVIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Imagem acima de 5 MB. Reduza o tamanho e tente novamente." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const uploadBody = new FormData();
    uploadBody.append("file", dataUri);
    uploadBody.append("folder", cfg.folder);

    if (cfg.mode === "signed") {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const paramsToSign = `folder=${cfg.folder}&timestamp=${timestamp}${cfg.apiSecret}`;
      const signature = crypto
        .createHash("sha1")
        .update(paramsToSign)
        .digest("hex");

      uploadBody.append("api_key", cfg.apiKey);
      uploadBody.append("timestamp", timestamp);
      uploadBody.append("signature", signature);
    } else {
      uploadBody.append("upload_preset", cfg.uploadPreset);
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/image/upload`;
    const response = await fetch(endpoint, {
      method: "POST",
      body: uploadBody,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.secure_url) {
      return NextResponse.json(
        {
          error:
            payload?.error?.message ||
            "Falha ao enviar imagem para o Cloudinary.",
        },
        { status: 502 }
      );
    }

    const url = optimizeCloudinaryUrl(String(payload.secure_url));
    return applyRefreshedCookies(
      NextResponse.json({
        url,
        rawUrl: String(payload.secure_url),
        publicId: String(payload.public_id || ""),
        width: Number(payload.width || 0),
        height: Number(payload.height || 0),
      }),
      auth.refreshedTokens
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar o upload da imagem." },
      { status: 500 }
    );
  }
}

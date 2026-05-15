import { NextRequest, NextResponse } from 'next/server';
import {
  buildGeminiVisualPrompt,
  generateGeminiVisual,
  GeminiAspectRatio,
  GeminiImageSize,
  GeminiVisualPreset,
  NANO_BANANA_MODELS,
} from '@/lib/gemini';

type Body = {
  prompt?: string;
  preset?: GeminiVisualPreset;
  description?: string;
  brandName?: string;
  aspectRatio?: GeminiAspectRatio;
  imageSize?: GeminiImageSize;
  referenceImages?: Array<{ data: string; mimeType?: string }>;
  quality?: 'fast' | 'balanced' | 'pro';
};

type ReferenceImage = { data: string; mimeType?: string };

function getOpenAIKey() {
  return (process.env.OPENAI_API_KEY || '').trim();
}

function openAIImageSize(aspectRatio: GeminiAspectRatio) {
  if (aspectRatio === '16:9' || aspectRatio === '21:9') return '1536x1024';
  if (aspectRatio === '3:4' || aspectRatio === '4:5' || aspectRatio === '9:16') return '1024x1536';
  return '1024x1024';
}

function dataUrlToBlob(dataUrlOrBase64: string, mimeType = 'image/png') {
  const [header, payload] = dataUrlOrBase64.includes(',')
    ? dataUrlOrBase64.split(',', 2)
    : ['', dataUrlOrBase64];
  const detectedMime = header.match(/data:(.*?);base64/)?.[1] || mimeType;
  const buffer = Buffer.from(payload, 'base64');
  return new Blob([buffer], { type: detectedMime });
}

async function generateOpenAIVisualFallback(prompt: string, aspectRatio: GeminiAspectRatio, referenceImages: ReferenceImage[] = []) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY non configuree');
  }

  const reference = referenceImages.find((image) => image?.data);
  const safePrompt = `${prompt}

CRITICAL PRODUCT SAFETY RULES:
- Use the provided reference image as the source of truth.
- Keep the exact same product identity, shape, color, visible logo/label, quantity and main details.
- Do not invent another model, another brand, another color, another pack, or new accessories.
- Only improve lighting, background cleanliness, centering, shadows and ecommerce presentation.
- If a detail is unclear, preserve it rather than replacing it.`;

  let response: Response;
  if (reference?.data) {
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('prompt', safePrompt);
    form.append('size', openAIImageSize(aspectRatio));
    form.append('quality', 'low');
    form.append('image', dataUrlToBlob(reference.data, reference.mimeType || 'image/png'), 'reference.png');
    response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } else {
    response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: safePrompt,
        size: openAIImageSize(aspectRatio),
        quality: 'low',
        n: 1,
      }),
    });
  }

  const data = await response.json().catch(() => ({}));
  const base64 = data?.data?.[0]?.b64_json;
  if (!response.ok || !base64) {
    throw new Error(data?.error?.message || 'OpenAI image fallback failed');
  }

  return {
    image: `data:image/png;base64,${base64}`,
    mimeType: 'image/png',
    model: 'gpt-image-1',
    notes: 'Fallback OpenAI Images utilise parce que Gemini Image a refuse l acces.',
  };
}

function normalizeGeminiVisualError(error: any) {
  const raw = error?.message || String(error || '');
  const denied =
    raw.includes('PERMISSION_DENIED') ||
    raw.includes('denied access') ||
    raw.includes('"code":403') ||
    raw.includes('code: 403');

  if (denied) {
    return {
      status: 403,
      code: 'GEMINI_IMAGE_ACCESS_DENIED',
      error:
        "La generation d'image IA n'est pas encore autorisee sur ce projet Google. La brochure texte et le PDF restent disponibles.",
      details:
        "Google refuse l'acces au modele image pour cette cle API. Il faut activer l'acces Gemini image/Nano Banana sur Google AI Studio ou utiliser une autre cle autorisee.",
    };
  }

  return {
    status: 500,
    code: 'GEMINI_VISUAL_FAILED',
    error: error?.message || 'Erreur Gemini Visual Lab',
  };
}

export async function POST(req: NextRequest) {
  let promptUsed = '';
  let aspectRatioUsed: GeminiAspectRatio = '16:9';
  let imageSizeUsed: GeminiImageSize = '2K';
  let referenceImagesUsed: ReferenceImage[] = [];
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const preset = body.preset || 'hero';
    const description = (body.description || '').trim();
    const prompt = (body.prompt || '').trim() || buildGeminiVisualPrompt(preset, description || 'Mobile commerce app for WhatsApp sellers', body.brandName || 'MasterShopPro');
    promptUsed = prompt;
    aspectRatioUsed = body.aspectRatio || '16:9';
    imageSizeUsed = body.imageSize || '2K';
    referenceImagesUsed = (body.referenceImages || [])
      .filter((image) => !!image?.data)
      .slice(0, 3);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt manquant' }, { status: 400 });
    }

    const quality = body.quality || 'balanced';
    const model =
      quality === 'fast'
        ? NANO_BANANA_MODELS.fast
        : quality === 'pro'
          ? NANO_BANANA_MODELS.pro
          : NANO_BANANA_MODELS.balanced;

    const result = await generateGeminiVisual({
      prompt,
      aspectRatio: aspectRatioUsed,
      imageSize: imageSizeUsed,
      model,
      referenceImages: referenceImagesUsed
        .map((image) => ({
          data: image.data,
          mimeType: image.mimeType || 'image/png',
        })),
    });

    return NextResponse.json({
      success: true,
      image: `data:${result.mimeType};base64,${result.base64}`,
      mimeType: result.mimeType,
      notes: result.notes,
      model: result.model,
      promptUsed: result.promptUsed,
      aspectRatio: result.aspectRatio,
      imageSize: result.imageSize,
    });
  } catch (error: any) {
    const normalized = normalizeGeminiVisualError(error);
    if (normalized.code === 'GEMINI_IMAGE_ACCESS_DENIED' && getOpenAIKey() && promptUsed) {
      try {
        const fallback = await generateOpenAIVisualFallback(promptUsed, aspectRatioUsed, referenceImagesUsed);
        return NextResponse.json({
          success: true,
          image: fallback.image,
          mimeType: fallback.mimeType,
          notes: fallback.notes,
          model: fallback.model,
          promptUsed,
          aspectRatio: aspectRatioUsed,
          imageSize: imageSizeUsed,
          providerFallback: 'openai',
        });
      } catch (fallbackError: any) {
        return NextResponse.json(
          {
            ...normalized,
            fallbackError: fallbackError?.message || 'OpenAI fallback unavailable',
          },
          { status: normalized.status }
        );
      }
    }
    return NextResponse.json(
      normalized,
      { status: normalized.status }
    );
  }
}

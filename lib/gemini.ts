import { GoogleGenAI, Modality } from '@google/genai';

const PRODUCT_ANALYSIS_PROMPT = `Tu es un expert e-commerce specialise en Afrique francophone.
Analyse la photo de ce produit et reponds UNIQUEMENT avec ce JSON :
{
  "name": "nom commercial precis en francais",
  "description": "description de vente courte et attirante en francais",
  "category": "categorie la plus proche",
  "suggestedPrice": "prix estime en nombre uniquement"
}`;

export const NANO_BANANA_MODELS = {
  fast: 'gemini-2.5-flash-image',
  balanced: 'gemini-3.1-flash-image-preview',
  pro: 'gemini-3-pro-image-preview',
} as const;

export type NanoBananaModel = (typeof NANO_BANANA_MODELS)[keyof typeof NANO_BANANA_MODELS];
export type GeminiVisualPreset = 'hero' | 'app-showcase' | 'play-promo' | 'social-post' | 'product-spotlight';
export type GeminiAspectRatio = '1:1' | '3:4' | '4:5' | '9:16' | '16:9' | '21:9';
export type GeminiImageSize = '1K' | '2K' | '4K';

type GeminiReferenceImage = {
  data: string;
  mimeType: string;
};

type GenerateGeminiVisualInput = {
  prompt: string;
  aspectRatio?: GeminiAspectRatio;
  imageSize?: GeminiImageSize;
  model?: NanoBananaModel;
  referenceImages?: GeminiReferenceImage[];
};

const VISUAL_PRESET_SUFFIX: Record<GeminiVisualPreset, string> = {
  hero: 'Create a premium landing page hero visual with soft cinematic lighting, elegant depth, subtle motion cues, clean composition, no clutter, no text baked into the image.',
  'app-showcase': 'Create an app showcase visual with floating phone screens, premium reflections, gentle glow, modern ecommerce atmosphere, and realistic depth. No text inside the image.',
  'play-promo': 'Create a Google Play promo visual for a mobile commerce app. Make it credible, polished, premium, and conversion-focused. No fake ratings, no embedded logos unless provided.',
  'social-post': 'Create a bold square social media visual with strong contrast, clean hierarchy, and premium product storytelling. No text baked into the image unless requested.',
  'product-spotlight': 'Create a polished product spotlight visual with clean background separation, premium lighting, realistic shadows, and a modern ecommerce aesthetic.',
};

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();
}

function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY non configuree');
  }
  return new GoogleGenAI({ apiKey });
}

function stripDataUrlPrefix(base64OrDataUrl: string) {
  return base64OrDataUrl.includes(',') ? base64OrDataUrl.split(',')[1] : base64OrDataUrl;
}

function safeParseJson(text: string) {
  const clean = text.replace(/```json\s*|```\s*/gi, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) {
    return {
      name: '',
      description: '',
      category: '',
      suggestedPrice: '',
    };
  }

  try {
    const parsed = JSON.parse(match[0]);
    return {
      name: parsed.name || '',
      description: parsed.description || '',
      category: parsed.category || '',
      suggestedPrice: parsed.suggestedPrice || '',
    };
  } catch {
    return {
      name: '',
      description: '',
      category: '',
      suggestedPrice: '',
    };
  }
}

function extractResponseText(response: any) {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((part: any) => typeof part?.text === 'string')
    .map((part: any) => part.text)
    .join('\n')
    .trim();
}

function extractResponseImage(response: any) {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part: any) => part?.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini n a retourne aucune image');
  }

  return {
    base64: imagePart.inlineData.data as string,
    mimeType: (imagePart.inlineData.mimeType as string) || 'image/png',
  };
}

export function buildGeminiVisualPrompt(
  preset: GeminiVisualPreset,
  description: string,
  brandName = 'MasterShopPro'
) {
  return `${VISUAL_PRESET_SUFFIX[preset]}
Brand: ${brandName}.
Product context: ${description}
Important: keep the result elegant, realistic, high-end, and easy to use in a product landing page.`;
}

export async function analyzeProductImage(imageData: string, mimeType = 'image/jpeg') {
  const ai = getGeminiClient();
  const base64Data = stripDataUrlPrefix(imageData);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: PRODUCT_ANALYSIS_PROMPT },
          { inlineData: { data: base64Data, mimeType } },
        ],
      },
    ],
  });

  return safeParseJson(extractResponseText(response));
}

export async function generateGeminiVisual({
  prompt,
  aspectRatio = '16:9',
  imageSize = '2K',
  model = NANO_BANANA_MODELS.balanced,
  referenceImages = [],
}: GenerateGeminiVisualInput) {
  const ai = getGeminiClient();

  const parts = [
    { text: prompt },
    ...referenceImages.map((image) => ({
      inlineData: {
        data: stripDataUrlPrefix(image.data),
        mimeType: image.mimeType,
      },
    })),
  ];

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  });

  const image = extractResponseImage(response);
  const text = extractResponseText(response);

  return {
    ...image,
    promptUsed: prompt,
    notes: text,
    model,
    aspectRatio,
    imageSize,
  };
}

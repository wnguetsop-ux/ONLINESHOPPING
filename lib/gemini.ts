import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function analyzeProductImage(imageData: string) {
  // On utilise le modèle Flash car il est gratuit et rapide
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Analyse cette image de produit et donne-moi une réponse au format JSON :
    {
      "name": "Nom précis du produit",
      "description": "Une description marketing attirante",
      "category": "La catégorie la plus proche",
      "suggestedPrice": "Un prix estimé en nombre uniquement"
    }`;

  // Nettoyage du format base64 de l'image
  const base64Data = imageData.split(",")[1];

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    },
  ]);

  const response = await result.response;
  return JSON.parse(response.text());
}
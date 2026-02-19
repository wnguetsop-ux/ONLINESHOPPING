import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  console.log("🚀 [API] Requête reçue : Analyse avec SDK Google...");

  try {
    const { base64, mediaType = 'image/jpeg' } = await req.json();
    
    if (!base64) {
      console.error("❌ [API] Pas de données image (base64) reçues");
      return NextResponse.json({ error: 'No image data' }, { status: 400 });
    }

    // Récupération de la clé depuis ton .env.local
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ [API] Clé API manquante dans .env.local");
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 });
    }

    // Initialisation du SDK Google
    const genAI = new GoogleGenerativeAI(apiKey);
    // On utilise 1.5-flash qui est rapide et gratuit
    // Teste d'abord celui-ci :
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

// SI ÇA ÉCHOUE ENCORE, remplace par celui-là :
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Tu es un expert e-commerce. Analyse cette photo de produit.
    Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour, sans balises markdown) contenant :
    {
      "name": "nom court et précis",
      "description": "description marketing attractive en français",
      "specifications": "Couleur: ...\\nMatière: ...\\nDimensions: ...",
      "category": "La catégorie la plus proche parmi: Vêtements, Électronique, Maison, Beauté, Sport, Accessoires",
      "brand": "la marque si visible"
    }`;

    // Préparation de l'image pour le SDK
    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: mediaType
      },
    };

    // Appel à l'IA
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Nettoyage et parsing du JSON
    let parsedData;
    try {
      // On retire les éventuels ```json ... ``` que l'IA pourrait ajouter
      const cleanJson = text.replace(/```json|```/gi, "").trim();
      parsedData = JSON.parse(cleanJson);
      console.log("✅ [API] Analyse réussie pour :", parsedData.name);
    } catch (parseError) {
      console.error("❌ [API] Erreur de lecture JSON de l'IA :", text);
      return NextResponse.json({ error: "L'IA a renvoyé un format invalide" }, { status: 500 });
    }

    return NextResponse.json(parsedData);

  } catch (err: any) {
    console.error('❌ [API] Erreur globale :', err.message || err);
    return NextResponse.json({ 
      error: 'Erreur interne au serveur',
      details: err.message 
    }, { status: 500 });
  }
}
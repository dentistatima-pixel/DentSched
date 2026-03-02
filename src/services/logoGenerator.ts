import { GoogleGenAI } from "@google/genai";

async function generateLogo() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: "A minimalist, modern, flat-design logo for a dental scheduling app named 'DentSched'. The icon features a clean, stylized tooth silhouette. Inside the tooth, a subtle calendar grid is integrated using negative space. A single, elegant emerald green checkmark is seamlessly incorporated into the tooth's curve. The text 'DentSched' is next to the icon in a modern sans-serif font, with 'Dent' in bold navy blue and 'Sched' in a lighter navy blue. Professional, premium SaaS aesthetic. White background.",
        },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      const imageUrl = `data:image/png;base64,${base64EncodeString}`;
      console.log("Generated Image URL:", imageUrl);
      // In a real app, we'd display this. For now, I'll just return it or log it.
    }
  }
}

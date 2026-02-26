import { GoogleGenAI } from "@google/genai";

const getAiInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getDocentExplanation = async (context: string, query: string, userRole?: string): Promise<string> => {
  const ai = getAiInstance();
  if (!ai) return "AI features are currently unavailable.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: ${context}\n\nQuery: ${query}\n\nUser Role: ${userRole || 'Unknown'}`,
      config: {
        systemInstruction: "You are a helpful dental assistant AI named Docent. Provide clear, concise, and professional explanations.",
      }
    });
    return response.text || "I'm sorry, I couldn't generate an explanation.";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "An error occurred while generating the explanation.";
  }
};

export const reviewClinicalNote = async (note: any): Promise<string> => {
  const ai = getAiInstance();
  if (!ai) return "AI features are currently unavailable.";

  const noteText = typeof note === 'string' ? note : JSON.stringify(note);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Review the following clinical note for completeness, accuracy, and professional tone. Suggest improvements if necessary.\n\nNote: ${noteText}`,
      config: {
        systemInstruction: "You are an expert dental auditor. Review clinical notes to ensure they meet professional standards.",
      }
    });
    return response.text || "I'm sorry, I couldn't review the note.";
  } catch (error) {
    console.error("Error reviewing note:", error);
    return "An error occurred while reviewing the note.";
  }
};

export const generateSoapNote = async (procedure: string, toothNumber?: number): Promise<any> => {
  const ai = getAiInstance();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a SOAP note for the procedure: ${procedure}${toothNumber ? ` on tooth #${toothNumber}` : ''}. Return as a JSON object with subjective, objective, assessment, and plan fields.`,
      config: {
        systemInstruction: "You are an expert dental assistant AI. Generate professional and structured clinical findings in JSON format.",
      }
    });
    const text = response.text || "";
    try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { plan: text };
    } catch {
        return { plan: text };
    }
  } catch (error) {
    console.error("Error generating SOAP note:", error);
    return null;
  }
};

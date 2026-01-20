
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Patient } from '../types';

// Fix: Correctly initialize GoogleGenAI with named apiKey parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const chatWithAssistant = async (prompt: string, patientContext?: string) => {
  try {
    const fullPrompt = `
      CONTEXT: You are a helpful dental assistant AI.
      ${patientContext ? `CURRENT PATIENT CONTEXT:\n${patientContext}\n\n` : ''}
      USER QUERY: ${prompt}
    `;

    // Fix: Correctly call generateContent API.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt
    });

    // Fix: Access the 'text' property directly, not as a function.
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return "Sorry, I'm having trouble connecting to the AI assistant right now.";
  }
};

export const summarizePatient = async (patient: Patient) => {
    try {
        const summaryPrompt = `
        Summarize the following dental patient record into a concise clinical overview. 
        Focus on critical medical alerts, outstanding treatment plans, and recent major procedures.
        Format as Markdown.

        PATIENT DATA:
        Name: ${patient.name}
        Age: ${patient.age}
        Allergies: ${(patient.allergies || []).join(', ') || 'None'}
        Medical Conditions: ${(patient.medicalConditions || []).join(', ') || 'None'}
        Chief Complaint: ${patient.chiefComplaint || 'N/A'}
        Outstanding Balance: ₱${patient.currentBalance || 0}
        Treatment Plans: ${
            (patient.treatmentPlans || [])
            .map(p => `- ${p.name} (Status: ${p.status})`)
            .join('\n') || 'None'
        }
        Recent Completed Procedures: ${
            (patient.dentalChart || [])
            .filter(c => c.status === 'Completed')
            .slice(-3)
            .map(c => `- ${c.procedure} on tooth #${c.toothNumber} (${c.date})`)
            .join('\n') || 'None'
        }
      `;

      // Fix: Correctly call generateContent API.
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: summaryPrompt
      });

      // Fix: Access the 'text' property directly, not as a function.
      return response.text;
    } catch (error) {
        console.error("Gemini patient summary failed:", error);
        return "Could not generate patient summary.";
    }
}

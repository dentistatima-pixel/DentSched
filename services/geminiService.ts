import { GoogleGenAI, Type } from "@google/genai";
import { APPOINTMENTS, PATIENTS, STAFF } from '../constants';
import { Appointment, Patient, User } from '../types';

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return client;
};

// Helper to format data for the context
const getContextData = () => {
  return JSON.stringify({
    staff: STAFF.map(s => ({ name: s.name, role: s.role })),
    patients: PATIENTS.map(p => ({ name: p.name, notes: p.notes, lastVisit: p.lastVisit })),
    appointments: APPOINTMENTS.map(a => {
      const patient = PATIENTS.find(p => p.id === a.patientId);
      const provider = STAFF.find(s => s.id === a.providerId);
      return {
        date: a.date,
        time: a.time,
        type: a.type,
        patient: patient?.name || 'Unknown',
        provider: provider?.name || 'Unknown',
        status: a.status
      };
    })
  });
};

export const chatWithAssistant = async (message: string, history: {role: string, parts: {text: string}[]}[] = []) => {
  const ai = getClient();
  const context = getContextData();
  
  const systemInstruction = `You are DentSched AI, a helpful assistant for a dental practice. 
  You have access to the current schedule, staff list, and patient summaries in the following JSON context:
  ${context}
  
  Your goal is to help the administrator or dentist with scheduling questions, patient summaries, or finding gaps in the schedule.
  Keep answers concise and professional.
  If asked to schedule something, pretend to do so and confirm the details (since this is a demo).
  Structure your response in Markdown.
  `;

  try {
    // We construct the prompt to include history manually for a simple request, 
    // or use the chat API. Let's use the chat API for stateful conv.
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage({ message: message });
    return result.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the schedule right now. Please try again.";
  }
};

export const summarizePatient = async (patient: Patient, appointments: Appointment[]) => {
    const ai = getClient();
    const patientApts = appointments.filter(a => a.patientId === patient.id);
    const prompt = `
    Summarize the history and status of this patient in 3 bullet points for a dentist before they enter the room.
    Patient: ${JSON.stringify(patient)}
    History: ${JSON.stringify(patientApts)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (e) {
        return "Could not generate summary.";
    }
}
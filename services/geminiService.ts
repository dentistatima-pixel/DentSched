import { GoogleGenAI } from "@google/genai";
import { Appointment, Patient, User } from '../types';

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return client;
};

// Helper to format data for the context
const getContextData = (appointments: Appointment[], patients: Patient[], staff: User[]) => {
  return JSON.stringify({
    staff: staff.map(s => ({ name: s.name, role: s.role })),
    patients: patients.map(p => ({ name: p.name, notes: p.notes, lastVisit: p.lastVisit })),
    appointments: appointments.map(a => {
      const patient = patients.find(p => p.id === a.patientId);
      const provider = staff.find(s => s.id === a.providerId);
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

export const chatWithAssistant = async (
    message: string, 
    history: {role: string, parts: {text: string}[]}[] = [],
    contextData: { appointments: Appointment[], patients: Patient[], staff: User[] }
) => {
  const ai = getClient();
  const context = getContextData(contextData.appointments, contextData.patients, contextData.staff);
  
  const systemInstruction = `You are DentSched AI, a helpful assistant for a dental practice. 
  You have access to the *live* current schedule, staff list, and patient summaries in the following JSON context:
  ${context}
  
  Your goal is to help the administrator or dentist with scheduling questions, patient summaries, or finding gaps in the schedule.
  Keep answers concise and professional.
  If asked to schedule something, pretend to do so and confirm the details (since this is a demo).
  Structure your response in Markdown.
  `;

  try {
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

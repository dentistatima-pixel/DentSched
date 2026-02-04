

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Patient, DentalChartEntry, ClinicalIncident, Appointment, User, UserRole } from '../types';
import { calculateAge } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateSoapNote = async (procedure: string, toothNumber?: number): Promise<{subjective: string, objective: string, assessment: string, plan: string}> => {
  try {
    const prompt = `Generate a standard, medico-legally sound SOAP note for a dental procedure. 
    Procedure: ${procedure}, Tooth Number: ${toothNumber || 'N/A'}.
    The output must be a valid JSON object with keys "subjective", "objective", "assessment", and "plan".`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    subjective: { type: Type.STRING },
                    objective: { type: Type.STRING },
                    assessment: { type: Type.STRING },
                    plan: { type: Type.STRING },
                },
                required: ["subjective", "objective", "assessment", "plan"],
            },
        },
    });

    const jsonText = response.text;
    if (!jsonText) {
        throw new Error("AI returned an empty response.");
    }
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error("Gemini SOAP note generation failed:", error);
    throw new Error("Could not generate AI SOAP note.");
  }
};

export const generateSafetyBriefing = async (patient: Patient, procedureType: string): Promise<string> => {
    try {
        const patientSummary = {
            age: calculateAge(patient.dob),
            sex: patient.sex,
            allergies: patient.allergies,
            medicalConditions: patient.medicalConditions,
            currentMedications: patient.medicationDetails,
        };

        const prompt = `Generate a critical safety briefing for a pre-procedure huddle.
        Patient: ${JSON.stringify(patientSummary)}
        Procedure: ${procedureType}
        Focus ONLY on critical risks, contraindications, and necessary precautions. Be concise, use bullet points in markdown. If no major risks, state that clearly.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text ?? "Could not generate safety briefing.";
    } catch (error) {
        console.error("Gemini safety briefing generation failed:", error);
        throw new Error("Could not generate AI safety briefing.");
    }
};

export const generateMorningHuddle = async (appointments: Appointment[], patients: Patient[]): Promise<string> => {
    try {
        const patientData = appointments.map(apt => {
            const patient = patients.find(p => p.id === apt.patientId);
            if (!patient) return null;
            return {
                time: apt.time,
                patientName: patient.name,
                procedure: apt.type,
                alerts: [
                    ...(patient.allergies?.filter(a => a !== 'None') || []),
                    ...(patient.medicalConditions?.filter(c => c !== 'None') || [])
                ],
                balance: patient.currentBalance
            };
        }).filter(Boolean);

        const prompt = `Generate a morning huddle briefing for a dentist for today's appointments.
        Today's schedule: ${JSON.stringify(patientData)}.
        Focus on:
        1. High-risk patients (many medical alerts).
        2. Patients with outstanding balances.
        3. Complex procedures.
        4. Opportunities for follow-up.
        Keep it concise and in markdown format. Start with "### AI Morning Huddle".`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text ?? "Could not generate huddle.";
    } catch (error) {
        console.error("Gemini Morning Huddle generation failed:", error);
        throw new Error("Could not generate AI morning huddle.");
    }
};

export const getDocentExplanation = async (elementId: string, context: string, userRole: UserRole): Promise<string> => {
    try {
        const prompt = `As a helpful AI assistant for a dental practice management software, explain the element with ID "${elementId}" within the context of "${context}".
        The user has the role of "${userRole}". Tailor the explanation to be simple, clear, and relevant to their role. Use markdown for formatting.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text ?? "No explanation available.";
    } catch (error) {
        console.error("Gemini Docent explanation failed:", error);
        throw new Error("Could not get AI explanation.");
    }
};

export const reviewClinicalNote = async (note: DentalChartEntry): Promise<string> => {
    try {
        const prompt = `Review the following clinical SOAP note for professionalism, clarity, and medico-legal soundness.
        Note: ${JSON.stringify({ s: note.subjective, o: note.objective, a: note.assessment, p: note.plan })}
        Provide constructive feedback in markdown format. Focus on areas of improvement. If it's good, say so.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text ?? "Could not review note.";
    } catch (error) {
        console.error("Gemini clinical note review failed:", error);
        throw new Error("Could not get AI review.");
    }
};

export const summarizePatient = async (patient: Patient, appointments: Appointment[]): Promise<string> => {
    try {
        const relevantData = {
            name: patient.name,
            age: calculateAge(patient.dob),
            allergies: patient.allergies,
            medicalConditions: patient.medicalConditions,
            medications: patient.medicationDetails,
            chiefComplaint: patient.chiefComplaint,
            recentAppointments: appointments
                .filter(a => a.patientId === patient.id)
                .slice(0, 5)
                .map(a => ({ date: a.date, type: a.type, status: a.status })),
        };
        const prompt = `Generate a concise clinical summary for patient: ${JSON.stringify(relevantData)}.
        Highlight key medical risks and recent dental history. Use markdown format.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text ?? "Could not generate summary.";
    } catch (error) {
        console.error("Gemini patient summary failed:", error);
        throw new Error("Could not generate AI patient summary.");
    }
};


export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    try {
        const prompt = `Translate the following English text to ${targetLanguage}. Return only the translated text. Text to translate: "${text}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text?.trim() ?? "Translation failed.";
    } catch (error) {
        console.error("Gemini translation failed:", error);
        throw new Error("Could not translate text.");
    }
};

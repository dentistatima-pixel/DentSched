
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Patient, DentalChartEntry, ClinicalIncident, Appointment, User } from '../types';
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

    // FIX: Changed to use .text property instead of .text() method
    const jsonText = response.text?.trim();
    if (!jsonText) {
        throw new Error("AI returned an empty response.");
    }
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini SOAP note generation failed:", error);
    throw new Error("Could not generate AI SOAP note.");
  }
};

export const generateSafetyBriefing = async (patient: Patient, procedureType: string): Promise<string> => {
    try {
        const prompt = `
        Analyze this patient's medical history for critical risks related to the scheduled dental procedure.
        Patient Allergies: ${(patient.allergies || []).join(', ') || 'None'}
        Patient Medical Conditions: ${(patient.medicalConditions || []).join(', ') || 'None'}
        Patient's current medications: ${patient.medicationDetails || 'None provided'}
        Scheduled Procedure: ${procedureType}

        Provide a concise, markdown-formatted summary of ONLY CRITICAL alerts and potential interactions that require immediate attention.
        If no critical risks are identified, state clearly: "No critical risks identified for this procedure based on the provided history."
        Start with a heading "### AI Safety Briefing".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        return response.text || '';
    } catch (error) {
        console.error("Gemini safety briefing failed:", error);
        throw new Error("Could not generate AI safety briefing.");
    }
};

export const explainProcedures = async (procedureNames: string[]): Promise<string> => {
    try {
        const prompt = `
        For a patient, explain the following dental procedures in simple, easy-to-understand language.
        Use analogies if helpful. Keep it concise but clear. Format as markdown with headings for each procedure.

        Procedures:
        ${procedureNames.map(name => `- ${name}`).join('\n')}
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        return response.text || '';
    } catch (error) {
        console.error("Gemini procedure explanation failed:", error);
        throw new Error("Could not generate explanation.");
    }
};

export const analyzeRadiograph = async (dataUrl: string): Promise<string> => {
    try {
        const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
        if (!match) throw new Error("Invalid image data URL format");

        const [, mimeType, data] = match;

        const imagePart = {
            inlineData: { mimeType, data },
        };
        const textPart = {
            text: `Analyze this dental radiograph. Provide a brief, preliminary text description of potential areas of interest for a dentist to review. 
            This is NOT a diagnosis. Mention potential caries, bone loss, or periapical radiolucencies if visible. If the image quality is poor or it is not a radiograph, state that.
            Be concise and use clinical terminology. Start with a heading "### Preliminary AI Analysis".`,
        };

        const response = await ai.models.generateContent({
            // FIX: Corrected model name for image analysis per guidelines.
            model: 'gemini-3-pro-image-preview', // Vision capable model
            contents: { parts: [imagePart, textPart] },
        });

        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        return response.text || '';
    } catch (error) {
        console.error("Gemini radiograph analysis failed:", error);
        throw new Error("Could not analyze radiograph.");
    }
};

export const reviewClinicalNote = async (note: Partial<DentalChartEntry>): Promise<string> => {
    try {
        const prompt = `
        You are a lead dentist reviewing a clinical note for professionalism and medico-legal soundness.
        Analyze the following SOAP note. Provide actionable feedback on clarity, completeness, and use of professional terminology.
        Suggest specific improvements. If the note is professionally sound, state that clearly. Format as markdown.

        NOTE FOR REVIEW:
        - Procedure: ${note.procedure}
        - Tooth: #${note.toothNumber}
        - S (Subjective): ${note.subjective || 'Not provided'}
        - O (Objective): ${note.objective || 'Not provided'}
        - A (Assessment): ${note.assessment || 'Not provided'}
        - P (Plan): ${note.plan || 'Not provided'}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        return response.text || '';
    } catch (error) {
        console.error("Gemini note review failed:", error);
        throw new Error("Could not get AI review for the note.");
    }
};

export const analyzeIncidents = async (incidents: ClinicalIncident[]): Promise<string> => {
    try {
        const prompt = `
        Analyze the following list of clinical incident reports from the last 30 days.
        Identify any recurring trends, patterns (e.g., by location, procedure type, staff), or systemic issues.
        Provide a concise summary of your findings and 1-2 actionable recommendations in markdown format.

        INCIDENTS:
        ${JSON.stringify(incidents.map(({ id, reportedBy, ...rest }) => rest), null, 2)}
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });
        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        return response.text || '';
    } catch (error) {
        console.error("Gemini incident analysis failed:", error);
        throw new Error("Could not analyze incidents.");
    }
};

export const draftReferralLetter = async (patient: Patient, referredTo: string, reason: string, question?: string): Promise<string> => {
    try {
        const prompt = `
        Draft a professional and concise dental referral letter with the following details.

        - Patient: ${patient.name}, Age: ${calculateAge(patient.dob)}
        - Relevant Medical History: ${(patient.medicalConditions || []).join(', ') || 'None reported'}. Allergies: ${(patient.allergies || []).join(', ') || 'None reported'}.
        - Referring to: ${referredTo}
        - Reason for referral: ${reason}
        ${question ? `- Specific question for specialist: ${question}` : ''}
        
        The letter should be formatted professionally, ready to be printed or sent.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        return response.text || '';
    } catch (error) {
        console.error("Gemini referral letter drafting failed:", error);
        throw new Error("Could not draft referral letter.");
    }
};

export const generateMorningHuddle = async (appointments: Appointment[], patients: Patient[]): Promise<string> => {
    try {
        const relevantData = appointments.map(apt => {
            const patient = patients.find(p => p.id === apt.patientId);
            if (!patient || apt.isBlock) return null;
            return {
                time: apt.time,
                procedure: apt.type,
                patientName: patient.name,
                criticalInfo: {
                    allergies: patient.allergies?.filter(a => a.toLowerCase() !== 'none'),
                    medicalConditions: patient.medicalConditions?.filter(c => c.toLowerCase() !== 'none'),
                    balance: patient.currentBalance,
                    reliability: patient.reliabilityScore,
                    notes: patient.notes // e.g., dental anxiety
                }
            };
        }).filter(Boolean);

        if (relevantData.length === 0) {
            return "### AI Morning Huddle\n\nNo appointments scheduled for you today. Enjoy the quiet day!";
        }

        const prompt = `
        You are an AI assistant for a dental clinic. Analyze the following schedule for today and provide a concise "Morning Huddle" briefing.
        Format your response in markdown. Use bullet points.
        Highlight CRITICAL safety alerts (allergies, medical conditions) with bold text and an emoji (e.g., ⚠️).
        Mention significant outstanding balances (e.g., > ₱1,000) with a different emoji (e.g., 💰).
        Note any patients with low reliability scores (e.g., < 80%) as a potential no-show risk (e.g., 🕒).
        Keep the summary brief and actionable. Start with a heading "### AI Morning Huddle".

        Today's Schedule Data:
        ${JSON.stringify(relevantData, null, 2)}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });
        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        return response.text || '';
    } catch (error) {
        console.error("Gemini morning huddle generation failed:", error);
        throw new Error("Could not generate AI Morning Huddle.");
    }
};

export const summarizePatient = async (patient: Patient): Promise<string> => {
    try {
        const prompt = `
        Summarize the following patient record for a quick clinical overview. Highlight critical risks, allergies, ongoing treatments, and recent major procedures. Be concise and use bullet points. Format as markdown.

        Patient Name: ${patient.name}
        Age: ${calculateAge(patient.dob)}
        Sex: ${patient.sex}
        
        Critical Medical Conditions: ${(patient.medicalConditions || []).join(', ') || 'None'}
        Allergies: ${(patient.allergies || []).join(', ') || 'None'}
        Current Medications: ${patient.medicationDetails || 'None provided'}
        Chief Complaint: ${patient.chiefComplaint || 'None'}

        Recent Procedures (from dental chart):
        ${(patient.dentalChart || []).slice(0, 5).map(entry => `- ${entry.date}: ${entry.procedure} (Tooth #${entry.toothNumber}) - Status: ${entry.status}`).join('\n')}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });
        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        return response.text || '';
    } catch (error) {
        console.error("Gemini patient summarization failed:", error);
        throw new Error("Could not generate AI patient summary.");
    }
};

export const translateText = async (text: string, targetLanguage: 'tl'): Promise<string> => {
    try {
        const prompt = `Translate the following English text to Tagalog for patient understanding. This is for a dental consent form. Maintain a professional and clear tone.
        
        TEXT TO TRANSLATE:
        ---
        ${text}
        ---
        
        TAGALOG TRANSLATION:`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        let translatedText = response.text?.trim() || '';
        if (translatedText.startsWith('TAGALOG TRANSLATION:')) {
            translatedText = translatedText.replace('TAGALOG TRANSLATION:', '').trim();
        }

        return translatedText;
    } catch (error) {
        console.error("Gemini translation failed:", error);
        throw new Error("Could not translate text.");
    }
};

export const getDocentExplanation = async (elementId: string, context: string, userRole: string): Promise<string> => {
    try {
        const prompt = `
        You are the "Digital Docent," an expert on the dentsched application, dental practice management, and Philippine medico-legal standards.
        Provide a concise, helpful explanation for the following UI element, tailored for the specified user role.
        Format as markdown. Be direct and clear.

        - User Role: ${userRole}
        - UI Element ID: ${elementId}
        - Context: ${context}

        Explanation:
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        // FIX: Changed to use .text property instead of .text() method and added fallback to empty string.
        return response.text || '';
    } catch (error) {
        console.error("Gemini Docent explanation failed:", error);
        throw new Error("Could not generate AI explanation.");
    }
};

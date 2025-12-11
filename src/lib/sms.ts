
// src/lib/sms.ts

// Configuration for the Capcom6 Android SMS Gateway
const SMS_GATEWAY_CONFIG = {
    username: 'CSAAHI',
    password: 'ypcsxllu442tha',
    deviceId: 'obd9qcsflj8YkCkPgbxDS',
    apiUrl: '/api/v1/messages/send'
};

/**
 * Sends an SMS message using the Capcom6 Cloud Gateway.
 * @param phoneNumber The recipient's phone number.
 * @param message The text message to send.
 * @returns {Promise<boolean>} True if the message was sent successfully, false otherwise.
 */
export const sendSms = async (phoneNumber: string, message: string): Promise<boolean> => {
    if (!phoneNumber) {
        console.error("SMS Error: Phone number is missing.");
        return false;
    }

    const payload = {
        username: SMS_GATEWAY_CONFIG.username,
        password: SMS_GATEWAY_CONFIG.password,
        device: SMS_GATEWAY_CONFIG.deviceId,
        number: phoneNumber,
        message: message,
    };

    try {
        const response = await fetch(SMS_GATEWAY_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("SMS Gateway Error:", errorBody);
            return false;
        }

        const result = await response.json();
        
        // Check for errors returned in the API response body
        if (result.error) {
             console.error("SMS Gateway API Error:", result.error);
             return false;
        }

        console.log("SMS Gateway Success:", result);
        return true;

    } catch (error) {
        console.error("Failed to send SMS via gateway:", error);
        return false;
    }
};

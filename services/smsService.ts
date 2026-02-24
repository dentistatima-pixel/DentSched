
import { SmsConfig } from '../types';

// Per PDA guidelines, avoid specific clinical and financial terms in SMS.
const PDA_FORBIDDEN_KEYWORDS = [
    'extraction', 'root canal', 'implant', 'denture', 
    'cavity', 'crown', 'bridge', 'braces', 'surgery',
    'infection', 'pain', 'swelling', 'bleeding',
    'hiv', 'diabetes', 'hypertension', 'cancer',
    'aids', 'std', 'herpes', 'gonorrhea',
    'balance', 'debt', 'overdue', 'payment', 'unpaid', '₱', 'php'
];

export const sanitizeSmsContent = (message: string): string => {
    let sanitized = message;
    PDA_FORBIDDEN_KEYWORDS.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (regex.test(sanitized)) {
            console.warn(`⚠️ SMS Privacy Alert: Masking sensitive keyword "${term}"`);
            sanitized = sanitized.replace(regex, '[procedure/detail]');
        }
    });
    return sanitized;
};

export const formatSmsTemplate = (template: string, data: Record<string, string>): string => {
    let formatted = template;
    for (const [key, value] of Object.entries(data)) {
        formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return formatted;
};

export const sendSms = async (
  phoneNumber: string, 
  message: string, 
  config: SmsConfig
): Promise<{success: boolean; gatewayResponse?: string; error?: string}> => {
  
  try {
    const isLocal = config.mode === 'LOCAL';
    
    const baseUrl = isLocal ? config.gatewayUrl : config.cloudUrl;
    const username = isLocal ? config.local_username : config.cloud_username;
    const password = isLocal ? config.local_password : config.cloud_password;
    const deviceId = isLocal ? config.local_deviceId : config.cloud_deviceId;

    if (!baseUrl) {
      return { success: false, error: `${config.mode} URL is not configured.` };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (username || password) {
      headers['Authorization'] = 'Basic ' + btoa(`${username || ''}:${password || ''}`);
    }
    
    let endpoint = baseUrl.replace(/\/$/, '');
    let payload: any = {};

    if (isLocal) {
      // Capcom6 Local API (Android SMS Gateway)
      endpoint += '/message';
      payload = {
        phone: phoneNumber,
        message: message
      };
    } else {
      // Capcom6 Cloud API
      endpoint += '/3rdparty/v1/message';
      payload = {
        phoneNumbers: [phoneNumber],
        message: message,
      };
      if (deviceId) {
        payload.deviceId = deviceId;
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Gateway error: ${response.status} ${errorText}` };
    }

    const data = await response.json();
    
    return { 
      success: true, 
      gatewayResponse: JSON.stringify(data) 
    };

  } catch (error: any) {
    console.error('SMS Send Error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};


import { SmsLog, SmsConfig, AuditLogEntry } from '../types';
import { generateUid } from '../constants';

// NOTE: This is a conceptual service. The actual sending mechanism (capcomGateway) is not implemented.

const PROHIBITED_SMS_KEYWORDS = [
    'extraction', 'root canal', 'implant', 'denture', 
    'cavity', 'crown', 'bridge', 'braces', 'surgery',
    'infection', 'pain', 'swelling', 'bleeding',
    'hiv', 'diabetes', 'hypertension', 'cancer',
    'aids', 'std', 'herpes', 'gonorrhea',
    // Financial terms
    'balance', 'debt', 'overdue', 'payment', 'unpaid'
];

export const sanitizeSmsContent = (message: string): string => {
    let sanitized = message;
    
    PROHIBITED_SMS_KEYWORDS.forEach(keyword => {
        // Use word boundaries to avoid replacing parts of words like 'braces' in 'embraces'
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(sanitized)) {
            console.warn(`⚠️ SMS Privacy Alert: Masking sensitive keyword "${keyword}"`);
            // Replace with a generic term
            sanitized = sanitized.replace(regex, 'your appointment');
        }
    });

    // Also check for specific financial patterns like PHP {Amount}
    const financialRegex = /(PHP|₱)\s*\{?\s*Amount\s*\}?/gi;
    if (financialRegex.test(sanitized)) {
        console.warn(`⚠️ SMS Privacy Alert: Masking financial details.`);
        sanitized = sanitized.replace(financialRegex, 'your recent transaction');
    }
    
    return sanitized;
};


export const sendSms = async (
  phoneNumber: string, 
  message: string, 
  config: SmsConfig
): Promise<{success: boolean; gatewayResponse?: string; error?: string}> => {
  
  try {
    const gatewayUrl = config.mode === 'LOCAL' 
      ? config.gatewayUrl 
      : config.cloudUrl;
    
    const deviceId = config.mode === 'LOCAL'
      ? config.local_deviceId
      : config.cloud_deviceId;
    
    const username = config.mode === 'LOCAL'
      ? config.local_username
      : config.cloud_username;
    
    const password = config.mode === 'LOCAL'
      ? config.local_password
      : config.cloud_password;
      
    if (!gatewayUrl || !deviceId || !username || !password) {
        return { success: false, error: 'SMS gateway is not configured for the current mode.' };
    }
    
    // Capcom SMS Gateway REST API format
    const response = await fetch(`${gatewayUrl}/api/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${username}:${password}`)}`
      },
      body: JSON.stringify({
        device_id: deviceId,
        phone_number: phoneNumber,
        message: message
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { 
        success: true, 
        gatewayResponse: result.message_id 
      };
    } else {
      return { 
        success: false, 
        error: result.error 
      };
    }
    
  } catch (error: any) {
    console.error("SMS Gateway Error:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Log all SMS to audit trail (RA 10173 requires logging of automated communications)
export const logSmsToAudit = (smsLog: SmsLog, config: SmsConfig): AuditLogEntry => {
  // This would typically save to a persistent store like Firebase RTDB or a dedicated audit collection.
  // For this implementation, we will just create and return the entry.
  const auditEntry: AuditLogEntry = {
    id: generateUid('aud'),
    timestamp: smsLog.sentAt,
    userId: 'system',
    userName: 'SMS Service',
    action: 'SMS_SENT',
    entity: 'Patient',
    entityId: smsLog.patientId,
    details: `SMS sent via ${config.mode} gateway. Template: ${smsLog.templateId}. Status: ${smsLog.status}`
  };
  
  console.log("AUDIT LOG (SMS):", auditEntry);
  return auditEntry;
};

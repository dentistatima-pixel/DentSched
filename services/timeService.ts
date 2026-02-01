// Service to fetch time from a trusted 3rd party authority (Non-Repudiation)
export const getTrustedTime = async (): Promise<{ timestamp: string, isVerified: boolean }> => {
    try {
        // 3-second timeout to prevent blocking UI if offline
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('http://worldtimeapi.org/api/timezone/Asia/Manila', { 
            signal: controller.signal,
            cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            return { timestamp: data.datetime, isVerified: true };
        }
    } catch (e) {
        console.warn('[Compliance] Trusted time fetch failed. Falling back to system time.');
    }
    
    // Fallback: System time (Not Verified)
    return { timestamp: new Date().toISOString(), isVerified: false };
};

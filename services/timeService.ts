
// Service to fetch time from a trusted 3rd party authority (Non-Repudiation)
export const getTrustedTime = async (): Promise<{ timestamp: string, isVerified: boolean, driftMs?: number }> => {
    try {
        const startTime = Date.now();
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
            const serverTime = new Date(data.datetime).getTime();
            const localTime = Date.now();
            
            // Calculate drift between system clock and atomic clock
            // NPC Audit: Drifts > 5 mins are considered suspicious for record tampering
            const driftMs = Math.abs(serverTime - localTime);
            
            return { 
                timestamp: data.datetime, 
                isVerified: true, 
                driftMs 
            };
        }
    } catch (e) {
        console.warn('[Compliance] Trusted time fetch failed. Falling back to system time.');
    }
    
    // Fallback: System time (Not Verified)
    return { timestamp: new Date().toISOString(), isVerified: false };
};

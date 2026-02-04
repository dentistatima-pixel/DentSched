// Service to fetch time from a trusted 3rd party authority (Non-Repudiation)
export const getTrustedTime = async (): Promise<{ timestamp: string, isVerified: boolean, source: string }> => {
    try {
        // 3-second timeout to prevent blocking UI if offline
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Manila', { 
            signal: controller.signal,
            cache: 'no-store'
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            return {
                timestamp: data.datetime,
                isVerified: true,
                source: 'worldtimeapi.org'
            };
        }
    } catch (error) {
        console.warn('Failed to get trusted timestamp:', error);
    }
    
    // Fallback to local time with warning
    return {
        timestamp: new Date().toISOString(),
        isVerified: false,
        source: 'local_device'
    };
};
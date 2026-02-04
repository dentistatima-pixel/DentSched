export const getSignatureBounds = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { minX: 0, maxX: 0, minY: 0, maxY: 0, inkPixels: 0 };
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    let inkPixels = 0;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 0) {
                inkPixels++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    return { minX, maxX, minY, maxY, inkPixels };
};

export const checkSignatureQuality = (canvas: HTMLCanvasElement, strokes: number, timeToSign: number): { 
  valid: boolean; 
  reason?: string 
} => {
    const { minX, maxX, minY, maxY, inkPixels } = getSignatureBounds(canvas);
    const canvasArea = canvas.width * canvas.height;
    const minInkCoverage = 0.015; // 1.5%

    if (inkPixels / canvasArea < minInkCoverage) {
        return { valid: false, reason: `Signature too small. Please provide a full, substantial signature.` };
    }
    if (strokes < 3) {
        return { valid: false, reason: 'Signature must have at least 3 distinct strokes.' };
    }
    if (timeToSign < 1000) {
        return { valid: false, reason: 'Please sign more carefully.' };
    }
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    if (spanX < canvas.width * 0.2 || spanY < canvas.height * 0.1) {
        return { valid: false, reason: 'Signature span is too small. Please use more of the signature area.' };
    }

    return { valid: true };
};
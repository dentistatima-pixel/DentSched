export const checkSignatureQuality = (canvas: HTMLCanvasElement): { 
  valid: boolean; 
  reason?: string 
} => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { valid: false, reason: 'Canvas error' };
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  let inkPixels = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i+3] > 0) { // Check alpha channel
      inkPixels++;
    }
  }
  
  const canvasArea = canvas.width * canvas.height;
  const minInkPixels = canvasArea * 0.005; // 0.5% coverage required

  if (inkPixels < minInkPixels) {
    return { 
      valid: false, 
      reason: 'Signature too small or simple. Please provide a full, clear signature.' 
    };
  }
  
  return { valid: true };
};
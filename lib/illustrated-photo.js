/** Apply a light, still-image cartoon finish locally in the browser. */
export async function illustratedPhoto(dataUrl) {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();

    // Reduce fine photographic texture first, then scale it back smoothly.
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.round(image.naturalWidth * 0.58));
    small.height = Math.max(1, Math.round(image.naturalHeight * 0.58));
    const smallCtx = small.getContext("2d");
    if (!smallCtx)
        return dataUrl;
    smallCtx.filter = "saturate(1.16) contrast(1.06)";
    smallCtx.drawImage(image, 0, 0, small.width, small.height);

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx)
        return dataUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;
    const original = new Uint8ClampedArray(pixels);
    const step = 30;

    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
            const i = (y * canvas.width + x) * 4;
            const left = luminance(original, i - 4);
            const right = luminance(original, i + 4);
            const above = luminance(original, i - canvas.width * 4);
            const below = luminance(original, i + canvas.width * 4);
            const edge = Math.abs(right - left) + Math.abs(below - above);
            const outline = edge > 96 ? 0.58 : edge > 62 ? 0.82 : 1;

            for (let channel = 0; channel < 3; channel++) {
                const value = original[i + channel];
                const flat = Math.round(value / step) * step;
                pixels[i + channel] = Math.min(255, Math.round(flat * outline));
            }
        }
    }

    ctx.putImageData(frame, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
}

function luminance(pixels, index) {
    return pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
}

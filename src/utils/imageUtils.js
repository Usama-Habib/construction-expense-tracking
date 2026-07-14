const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

export const compressImageFile = async (file, maxDimension = 1280, targetKb = 300) => {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const sourceImage = await loadImage(sourceDataUrl);

  const scale = Math.min(1, maxDimension / Math.max(sourceImage.width, sourceImage.height));
  const width = Math.max(1, Math.round(sourceImage.width * scale));
  const height = Math.max(1, Math.round(sourceImage.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceImage, 0, 0, width, height);

  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  let bytes = Math.ceil((dataUrl.length * 3) / 4);

  while (bytes / 1024 > targetKb && quality > 0.5) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    bytes = Math.ceil((dataUrl.length * 3) / 4);
  }

  return {
    dataUrl,
    width,
    height,
    sizeKb: Math.round(bytes / 1024),
    name: file.name,
    mimeType: 'image/jpeg',
  };
};

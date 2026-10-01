import { Jimp } from 'jimp';

async function processImage(srcPath, destPath, threshold = 18, feather = 15) {
  try {
    const image = await Jimp.read(srcPath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    image.scan(0, 0, width, height, function(x, y, idx) {
      const r = this.bitmap.data[idx];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      const maxBrightness = Math.max(r, g, b);
      if (maxBrightness <= threshold) {
        this.bitmap.data[idx + 3] = 0; // Transparent
      } else if (maxBrightness < threshold + feather) {
        const factor = (maxBrightness - threshold) / feather;
        this.bitmap.data[idx + 3] = Math.round(255 * factor);
      }
    });

    await image.write(destPath);
    console.log(`Successfully saved ${destPath}`);
  } catch (err) {
    console.error(`Error processing ${srcPath}:`, err);
  }
}

async function run() {
  const userChillerImg = 'C:/Users/SANJAY GUPTA/.gemini/antigravity-ide/brain/42e52e7b-1951-4bc6-98cc-9f942c8a3a68/.user_uploaded/media_1790832316709.jpg';
  await processImage(userChillerImg, './public/chiller_transparent.png', 16, 15);
  await processImage(userChillerImg, './public/chiller.png', 16, 15);
  console.log('Chiller image updated successfully!');
}

run();

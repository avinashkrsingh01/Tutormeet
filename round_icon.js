let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error("Could not require sharp directly:", e);
  process.exit(1);
}
const fs = require('fs');

async function processImage() {
  const inputFile = '/Users/avinashsingh/.gemini/antigravity/brain/55d9621c-2bf8-4d91-aa06-c50135eeb140/media__1789211963221.jpg';
  const outDir = '/Users/avinashsingh/Desktop/Tutormeet/public/icons';
  const appDir = '/Users/avinashsingh/Desktop/Tutormeet/app';
  
  const sizes = [16, 32, 96, 180, 192, 512];
  
  for (const size of sizes) {
    const r = size * 0.20; 
    
    const roundedCorners = Buffer.from(
      `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`
    );
    
    const buffer = await sharp(inputFile)
      .resize(size, size)
      .composite([{
        input: roundedCorners,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();
      
    if (size === 16) fs.writeFileSync(`${outDir}/favicon-16x16.png`, buffer);
    if (size === 32) {
      fs.writeFileSync(`${outDir}/favicon-32x32.png`, buffer);
      fs.writeFileSync(`${outDir}/favicon.ico`, buffer);
      fs.writeFileSync(`${appDir}/favicon.ico`, buffer);
    }
    if (size === 96) fs.writeFileSync(`${outDir}/favicon-96x96.png`, buffer);
    if (size === 180) {
      fs.writeFileSync(`${outDir}/apple-touch-icon.png`, buffer);
      fs.writeFileSync(`${appDir}/apple-icon.png`, buffer);
    }
    if (size === 192) fs.writeFileSync(`${outDir}/icon-192x192.png`, buffer);
    if (size === 512) {
      fs.writeFileSync(`${outDir}/icon-512x512.png`, buffer);
      fs.writeFileSync(`${appDir}/icon.png`, buffer);
    }
  }
}

processImage().then(() => console.log('Done')).catch(console.error);

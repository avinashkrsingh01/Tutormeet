let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error("Could not require sharp directly:", e);
  process.exit(1);
}

async function getColor() {
  const inputFile = '/Users/avinashsingh/.gemini/antigravity/brain/55d9621c-2bf8-4d91-aa06-c50135eeb140/media__1789211963221.jpg';
  
  // The image is a square logo. The left side (the student) is bright blue. The right side is dark navy.
  // Let's grab a pixel from the left side, roughly 25% from left, 50% from top.
  
  const metadata = await sharp(inputFile).metadata();
  const x = Math.floor(metadata.width * 0.25);
  const y = Math.floor(metadata.height * 0.50);
  
  const { data } = await sharp(inputFile)
    .extract({ left: x, top: y, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  console.log(`RGB: ${data[0]}, ${data[1]}, ${data[2]}`);
  
  const hex = '#' + [data[0], data[1], data[2]].map(x => x.toString(16).padStart(2, '0')).join('');
  console.log(`HEX: ${hex}`);
}

getColor().catch(console.error);

// Generate PNG icons from SVG for Chrome extension
// Run: node generate-icons.js

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not installed. Using fallback method...');
  console.log('For best results, install sharp: npm install sharp');
  console.log('');
  console.log('Alternative: Use an online tool to convert the SVG to PNG:');
  console.log('1. Open icons/icon.svg in a browser');
  console.log('2. Use a tool like https://svgtopng.com/');
  console.log('3. Generate 16x16, 48x48, and 128x128 versions');
  console.log('4. Save as icon16.png, icon48.png, icon128.png in the icons folder');
  process.exit(0);
}

const sizes = [16, 48, 128];
const svgPath = path.join(__dirname, 'icons', 'icon.svg');
const outputDir = path.join(__dirname, 'icons');

// SVG content with proper sizing
const createSvg = (size) => {
  const radius = Math.round(size * 0.19);
  const fontSize = Math.round(size * 0.63);
  const textY = Math.round(size * 0.72);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#E31837"/>
  <text x="${size/2}" y="${textY}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">G</text>
</svg>`;
};

async function generateIcons() {
  console.log('Generating PNG icons...');

  for (const size of sizes) {
    const svg = createSvg(size);
    const outputPath = path.join(outputDir, `icon${size}.png`);

    try {
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated icon${size}.png`);
    } catch (error) {
      console.error(`✗ Error generating icon${size}.png:`, error.message);
    }
  }

  console.log('');
  console.log('Done! Icons generated in /extension/icons/');
}

generateIcons();

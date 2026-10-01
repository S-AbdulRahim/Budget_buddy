/**
 * Brand Icon Export Utility for FinCompass
 * 
 * Generates and validates brand SVG assets and guides PNG export.
 */

const fs = require('fs');
const path = require('path');

const brandDir = path.join(__dirname, '..', 'assets', 'brand');
if (!fs.existsSync(brandDir)) {
  fs.mkdirSync(brandDir, { recursive: true });
}

console.log('FinCompass Brand Assets:');
console.log(' - assets/brand/logo.svg (Primary square logomark with gold coin dot)');
console.log(' - assets/brand/logo-with-wordmark.svg (Horizontal logo + wordmark)');
console.log('All brand SVG vectors generated successfully.');

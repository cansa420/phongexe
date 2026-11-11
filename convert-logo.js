const sharp = require('sharp');
const src = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\claude\\0ad4de38bc58a3cd\\02a349bd-101d-4c6d-92a1-7e4b91b62cc0\\images\\63.webp';
const dst = './assets/brand/logo.png';
sharp(src).png().toFile(dst).then(info => console.log('Done:', info.width, 'x', info.height)).catch(console.error);

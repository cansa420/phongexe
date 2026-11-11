const sharp = require('sharp');
const path1 = './dist/assets/brand/logo.png';
const path2 = './dist/assets/_src/logo.webp';
const path3 = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\claude\\0ad4de38bc58a3cd\\02a349bd-101d-4c6d-92a1-7e4b91b62cc0\\images\\63.webp';
Promise.all([sharp(path1).metadata(), sharp(path2).metadata(), sharp(path3).metadata()])
  .then(([a, b, c]) => {
    console.log('dist/brand/logo.png:', a.width, 'x', a.height);
    console.log('dist/_src/logo.webp:', b.width, 'x', b.height);
    console.log('new logo (63.webp):', c.width, 'x', c.height);
  });

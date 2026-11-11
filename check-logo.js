const sharp = require('sharp');
sharp('./dist/assets/brand/logo.png').metadata().then(m => console.log('logo in dist:', m.width, 'x', m.height, m.format));

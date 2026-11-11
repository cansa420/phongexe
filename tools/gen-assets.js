'use strict';
// Sinh toàn bộ ảnh tạm:  node tools/gen-assets.js
const path = require('path');
const out = path.join(__dirname, '..', 'assets');
const cards = require('./gen-cards')(out);
const charms = require('./gen-charms')(out);
const bgs = require('./gen-bg')(out);
console.log(`Đã tạo ${cards} lá bài, ${charms} icon bùa, ${bgs} nền chặng trong ${out}`);

'use strict';
// Gộp engine + dữ liệu JSON + giao diện thành MỘT file HTML tự đủ:  node build-demo.js
// Kết quả: dist/index.html — ảnh và SFX được inline base64, không cần 140+ HTTP requests
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src');
const mods = {};
for (const f of ['rng.js', 'charms.js', 'engine.js']) mods[f] = fs.readFileSync(path.join(src, f), 'utf8');
const jsonMods = {};
for (const f of fs.readdirSync(path.join(src, 'data'))) {
  if (f.endsWith('.json')) jsonMods[f] = JSON.stringify(JSON.parse(fs.readFileSync(path.join(src, 'data', f), 'utf8')));
}

let bundle = 'var __cache = {}, __src = {};\n';
for (const [name, code] of Object.entries(mods)) bundle += `__src[${JSON.stringify(name)}] = function (module, exports, require) {\n${code}\n};\n`;
for (const [name, json] of Object.entries(jsonMods)) bundle += `__src[${JSON.stringify(name)}] = function (module) { module.exports = ${json}; };\n`;
bundle += `function __require(name) {
  var key = name.split('/').pop();
  if (__cache[key]) return __cache[key].exports;
  var module = { exports: {} }; __cache[key] = module;
  __src[key](module, module.exports, __require);
  return module.exports;
}\n`;

// ---- inline assets: chỉ SFX thành base64, ảnh tải riêng từ assets/ ----
const MIME = { '.png': 'image/png', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
const INLINE_DIRS = ['sfx'];
const assetMap = {};
let inlineBytes = 0;
for (const dir of INLINE_DIRS) {
  const dirPath = path.join(__dirname, 'assets', dir);
  if (!fs.existsSync(dirPath)) continue;
  for (const f of fs.readdirSync(dirPath)) {
    const ext = path.extname(f).toLowerCase();
    if (!MIME[ext]) continue;
    const key = `assets/${dir}/${f}`;
    const data = fs.readFileSync(path.join(dirPath, f));
    assetMap[key] = `data:${MIME[ext]};base64,${data.toString('base64')}`;
    inlineBytes += data.length;
  }
}

// danh sách ảnh nạp trước cho màn tải
const PRELOAD = [];
for (const d of ['cards', 'frames/ui', 'icons']) { const dp = path.join(__dirname, 'assets', d); if (fs.existsSync(dp)) for (const f of fs.readdirSync(dp)) if (/\.(png|webp)$/i.test(f)) PRELOAD.push(`assets/${d}/${f}`); }
// Script: inject asset map + patch img src (MutationObserver) + patch CSS setProperty
const assetScript = `<script>
var __A=${JSON.stringify(assetMap)};
window.__PRELOAD=${JSON.stringify(PRELOAD)};
(function(){
  // 1. Thay src <img> được inject qua innerHTML
  function patchImgs(root){
    var imgs=root.tagName==='IMG'?[root]:root.querySelectorAll?root.querySelectorAll('img'):[];
    for(var i=0;i<imgs.length;i++){var a=imgs[i].getAttribute('src');if(a&&__A[a])imgs[i].setAttribute('src',__A[a]);}
  }
  patchImgs(document.documentElement);
  new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){var ns=muts[i].addedNodes;for(var j=0;j<ns.length;j++){if(ns[j].nodeType===1)patchImgs(ns[j]);}}
  }).observe(document.documentElement,{childList:true,subtree:true});
  // 2. img.src = '...' dùng JS setter
  var d=Object.getOwnPropertyDescriptor(Image.prototype,'src');
  if(d&&d.set) Object.defineProperty(Image.prototype,'src',{
    set:function(v){d.set.call(this,__A[v]||v);},get:function(){return d.get.call(this);}
  });
  // 3. CSS custom property url(assets/...) cho background
  var sp=CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty=function(p,v,pr){
    if(typeof v==='string')v=v.replace(/url\\((['"]?)([^'"\\)\\s]+)\\1\\)/g,function(_,q,u){return'url('+q+(__A[u]||u)+q+')';});
    return sp.call(this,p,v,pr);
  };
})();
</script>
`;

const tpl = fs.readFileSync(path.join(__dirname, 'web/index.template.html'), 'utf8');
const ui = fs.readFileSync(path.join(__dirname, 'web/ui.js'), 'utf8');
const fx = fs.readFileSync(path.join(__dirname, 'web/fx.js'), 'utf8');
const boot = fs.readFileSync(path.join(__dirname, 'web/boot.js'), 'utf8');

// Inject asset script trước khi thay /*__BUNDLE__*/ để placeholder vẫn còn
const tplPatched = tpl.replace('<script>\n/*__BUNDLE__*/', assetScript + '<script>\n/*__BUNDLE__*/');
let skinCss = fs.readFileSync(path.join(__dirname, 'web/skin.css'), 'utf8');
skinCss = skinCss.replace(/url\(['"]?(assets\/[^'")\s]+)['"]?\)/g, (_, key) => assetMap[key] ? `url(${assetMap[key]})` : `url(${key})`);
let out = tplPatched.replace('/*__BUNDLE__*/', () => bundle).replace('/*__UI__*/', () => ui).replace('/*__FX__*/', () => fx).replace('/*__BOOT__*/', () => boot).replace('/*__SKIN__*/', () => skinCss);

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), out);
fs.cpSync(path.join(__dirname, 'assets'), path.join(__dirname, 'dist/assets'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'manifest.json'), path.join(__dirname, 'dist/manifest.json'));
const inlineKB = (inlineBytes / 1024).toFixed(0);
const totalKB = (out.length / 1024).toFixed(0);
console.log(`Đã tạo dist/index.html ${totalKB} KB (inline ${inlineKB} KB assets, music vẫn tải riêng)`);

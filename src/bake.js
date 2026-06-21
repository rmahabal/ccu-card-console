const fs=require('fs');
const tpl=fs.readFileSync(__dirname+'/console_template.html','utf8');
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
require(__dirname+'/engine_v2.js');
const out=globalThis.KGEngine.buildPage(tpl,data);
fs.writeFileSync(process.argv[3],out);
console.log('baked '+process.argv[3]+' ('+out.length+' bytes)');

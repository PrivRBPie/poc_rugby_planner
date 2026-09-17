import fs from 'node:fs';
const file = 'scripts/r8-domain-complete.mjs';
let source = fs.readFileSync(file, 'utf8');
const broken = "title={publishedHalves[key] ? `Published by ${'${publishedHalves[key].publishedBy}'}` : 'Validate and publish this half'}";
const fixed = "title={publishedHalves[key] ? 'Published lineup' : 'Validate and publish this half'}";
if (!source.includes(broken)) throw new Error('Expected generator fragment not found');
source = source.replace(broken, fixed);
fs.writeFileSync(file, source);
console.log('R8 domain generator quoting fixed.');

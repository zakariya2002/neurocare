// Sur chaque <img ... logo-neurocare.svg ... brightness-0 invert ...>,
// remplace par <img ... logo-neurocare-blanc.svg ... (sans le filtre)>.
// Idem pour le fallback mobile logo-neurocare-vert.png → logo-neurocare-blanc.svg.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function listFiles(dir, exts, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist'].includes(entry.name)) continue;
      listFiles(full, exts, acc);
    } else if (exts.some((e) => full.endsWith(e))) {
      acc.push(full);
    }
  }
  return acc;
}

const files = [
  ...listFiles(path.join(ROOT, 'app'), ['.tsx', '.ts']),
  ...listFiles(path.join(ROOT, 'components'), ['.tsx', '.ts']),
];

let totalLinesChanged = 0;
let totalFilesChanged = 0;

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  let linesChanged = 0;

  // Cas 1 : ligne contenant à la fois "logo-neurocare.svg" et "brightness-0 invert"
  after = after.replace(/.*$/gm, (line) => {
    if (line.includes('logo-neurocare.svg') && line.includes('brightness-0 invert')) {
      linesChanged++;
      return line
        .replace('logo-neurocare.svg', 'logo-neurocare-blanc.svg')
        .replace(/\s*brightness-0 invert/g, '');
    }
    return line;
  });

  // Cas 2 : remplacement direct du PNG vert (mobile menu) par le SVG blanc
  if (after.includes('logo-neurocare-vert.png')) {
    after = after.replace(/logo-neurocare-vert\.png/g, 'logo-neurocare-blanc.svg');
    linesChanged++;
  }

  if (after !== before) {
    fs.writeFileSync(file, after);
    totalFilesChanged++;
    totalLinesChanged += linesChanged;
    console.log(`✔ ${path.relative(ROOT, file)} (${linesChanged} ligne${linesChanged > 1 ? 's' : ''})`);
  }
}

console.log(`\n${totalFilesChanged} fichier(s), ${totalLinesChanged} ligne(s) modifiée(s).`);

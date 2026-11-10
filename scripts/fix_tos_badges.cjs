const fs = require('fs');

const file = 'public/src/pages/TermsOfService.tsx';
let s = fs.readFileSync(file, 'utf8');

const target = 'Effective: {lastUpdated}';
if (s.includes(target)) {
  s = s.replace(
    'Effective: {lastUpdated}',
    'Effective: {currentDisplayDate}'
  );
  s = s.replace(
    'Version: ATC-MSA 2026.4',
    'Version: {currentDisplayVersion}'
  );
  console.log('Replaced badge labels in TermsOfService.tsx');
}

fs.writeFileSync(file, s, 'utf8');

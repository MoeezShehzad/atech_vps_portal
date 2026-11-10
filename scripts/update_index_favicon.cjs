const fs = require('fs');
const path = require('path');

const filePath = path.resolve('public/index.html');
let html = fs.readFileSync(filePath, 'utf8');

const target = '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />';
const replacement = `<link rel="icon" type="image/png" href="/ATC_Logo.png" />
    <link rel="apple-touch-icon" href="/ATC_Logo.png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.atechconsult.com" />
    <meta property="og:title" content="ATC Cloud — Analytical Technical Consulting" />
    <meta property="og:description" content="High Performance Cloud Virtual Private Servers by Analytical Technical Consulting (ATC)" />
    <meta property="og:image" content="https://www.atechconsult.com/ATC_Logo.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://www.atechconsult.com" />
    <meta name="twitter:title" content="ATC Cloud — Analytical Technical Consulting" />
    <meta name="twitter:description" content="High Performance Cloud Virtual Private Servers by Analytical Technical Consulting (ATC)" />
    <meta name="twitter:image" content="https://www.atechconsult.com/ATC_Logo.png" />`;

if (html.includes(target)) {
  html = html.replace(target, replacement);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Successfully updated index.html with ATC logo and OG tags');
} else {
  console.log('Target not found');
}

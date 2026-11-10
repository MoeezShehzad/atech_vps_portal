const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e "
      async function main() {
        // 1. Fetch countries or check India
        const provRes = await fetch('http://127.0.0.1:5000/api/geo/provinces?countryCode=IN');
        const provData = await provRes.json();
        console.log('Provinces for IN:', JSON.stringify(provData.provinces?.slice(0, 5), null, 2));

        const ap = provData.provinces?.find(p => p.name.includes('Andhra'));
        console.log('Andhra Pradesh province obj:', ap);

        if (ap) {
          // 2. Fetch cities for Andhra Pradesh
          let url = 'http://127.0.0.1:5000/api/geo/cities?provinceId=' + encodeURIComponent(ap.id);
          if (ap.countryCode) url += '&countryCode=' + encodeURIComponent(ap.countryCode);
          if (ap.code) url += '&stateCode=' + encodeURIComponent(ap.code);
          console.log('Fetching url:', url);
          const cityRes = await fetch(url);
          const cityData = await cityRes.json();
          console.log('City count:', cityData.count);
          console.log('First 10 cities:', cityData.cities?.slice(0, 10).map(c => c.name));
          console.log('Last 10 cities:', cityData.cities?.slice(-10).map(c => c.name));
        }
        process.exit(0);
      }
      main().catch(err => { console.error(err); process.exit(1); });
    "
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });

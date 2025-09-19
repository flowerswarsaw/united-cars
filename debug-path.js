const path = require('path');
const fs = require('fs');

console.log('Current working directory:', process.cwd());

const dataFile = path.join(process.cwd(), '.crm-data', 'data.json');
console.log('Looking for data file at:', dataFile);
console.log('Data file exists:', fs.existsSync(dataFile));

const webDataFile = path.join(process.cwd(), 'apps/web/.crm-data', 'data.json');
console.log('Web data file at:', webDataFile);
console.log('Web data file exists:', fs.existsSync(webDataFile));

if (fs.existsSync(webDataFile)) {
  const stats = fs.statSync(webDataFile);
  console.log('Web data file size:', stats.size, 'bytes');
}
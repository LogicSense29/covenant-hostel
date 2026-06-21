const sharp = require('sharp');
const path = require('path');

const imagePath = path.join(__dirname, 'public', 'convenant-hostel-logo.png');

sharp(imagePath)
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    const colors = {};
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = info.channels === 4 ? data[i + 3] : 255;
      
      // ignore transparent
      if (a < 50) continue;
      
      // ignore pure white / near white
      if (r > 240 && g > 240 && b > 240) continue;
      
      // ignore pure black / near black / greys
      if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20) {
        if (r < 50 || r > 200) continue; // ignore very dark and very light greys
      }

      // quantize to 16-level buckets to group similar colors
      const qr = Math.floor(r / 16) * 16;
      const qg = Math.floor(g / 16) * 16;
      const qb = Math.floor(b / 16) * 16;
      
      const key = `${qr},${qg},${qb}`;
      colors[key] = (colors[key] || 0) + 1;
    }
    
    const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
    console.log("Top 5 non-greyscale colors:", sorted.slice(0, 5).map(x => {
      const parts = x[0].split(',');
      const hex = '#' + parseInt(parts[0]).toString(16).padStart(2, '0') + 
                  parseInt(parts[1]).toString(16).padStart(2, '0') + 
                  parseInt(parts[2]).toString(16).padStart(2, '0');
      return `${hex} (count: ${x[1]})`;
    }));
  })
  .catch(err => console.error(err));

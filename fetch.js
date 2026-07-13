const fs = require('fs');
fetch('http://localhost:3000/api/clean')
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('debug.json', JSON.stringify(data, null, 2));
  });

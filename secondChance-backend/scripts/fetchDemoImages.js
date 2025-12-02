const fs = require('fs');
const path = require('path');
const https = require('https');

const TOTAL_IMAGES = 200;
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const ensureDir = () => {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
};

const downloadImage = (url, dest) => new Promise((resolve, reject) => {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      file.close();
      fs.unlink(dest, () => {
        reject(new Error(`Failed to download ${url} - Status ${response.statusCode}`));
      });
      return;
    }
    response.pipe(file);
    file.on('finish', () => file.close(resolve));
  }).on('error', (err) => {
    fs.unlink(dest, () => reject(err));
  });
});

const fetchDemoImages = async ({ total = TOTAL_IMAGES } = {}) => {
  ensureDir();
  for (let i = 1; i <= total; i += 1) {
    const id = String(i).padStart(3, '0');
    const filename = `demo-item-${id}.jpg`;
    const filepath = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(filepath)) {
      continue;
    }
    const url = `https://loremflickr.com/800/600/furniture,interior,room?lock=${i}`;
    try {
      console.log(`Downloading ${url} -> ${filename}`);
      await downloadImage(url, filepath);
    } catch (err) {
      console.error(`Failed to download image ${i}:`, err.message);
    }
  }
  console.log('Demo images fetch complete.');
};

if (require.main === module) {
  fetchDemoImages().catch((err) => {
    console.error('Fetcher script failed:', err);
    process.exit(1);
  });
}

module.exports = {
  fetchDemoImages,
};


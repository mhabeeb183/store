const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');

// Configure custom DNS servers first to prevent SRV connection failures on MongoDB Atlas
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

const ASSETS_DIR = path.join(__dirname, '../../client/public/assets');

const dbMigrationMapping = [
  {
    url: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/ToyCar/glTF-Binary/ToyCar.glb',
    filename: 'ToyCar.glb'
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    filename: 'RobotExpressive.glb'
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
    filename: 'MaterialsVariantsShoe.glb'
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    filename: 'DamagedHelmet.glb'
  },
  {
    url: 'https://images.unsplash.com/photo-1608248597481-496100c8c836',
    filename: 'unsplash-608248597481-496100c8c836.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1496181130204-755241524eab',
    filename: 'unsplash-1496181130204-755241524eab.jpg'
  },
  {
    url: 'https://res.cloudinary.com/dugvuaam3/raw/upload/v1785520994/products/models/zky8st19pdikibwes5an',
    filename: 'zky8st19pdikibwes5an.glb'
  },
  {
    url: 'https://res.cloudinary.com/dugvuaam3/raw/upload/v1785862430/products/models/anuh4fgbysdwex9yhcjh',
    filename: 'anuh4fgbysdwex9yhcjh.glb'
  }
];

// Unsplash images are generated/downloaded manually to avoid 404 block from Unsplash CDN
const filesToDownload = dbMigrationMapping.filter(item => !item.filename.startsWith('unsplash-'));

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    const request = (targetUrl) => {
      const parsedUrl = new URL(targetUrl);
      const options = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };

      https.get(options, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = new URL(response.headers.location, targetUrl).toString();
          request(redirectUrl);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${targetUrl}' (Status: ${response.statusCode})`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    };
    
    request(url);
  });
}

async function run() {
  // 1. Download files (excluding unsplash files)
  console.log('Starting file downloads to client/public/assets...');
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  for (const item of filesToDownload) {
    const destPath = path.join(ASSETS_DIR, item.filename);
    console.log(`Downloading ${item.url} -> ${item.filename}...`);
    try {
      await downloadFile(item.url, destPath);
      console.log(`Successfully downloaded ${item.filename}`);
    } catch (err) {
      console.error(`Failed to download ${item.filename}:`, err.message);
    }
  }

  // 2. Connect to MongoDB and update records using dbMigrationMapping
  console.log('\nConnecting to MongoDB to migrate references...');
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is missing!");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const products = await Product.find({});
    let updateCount = 0;

    for (const product of products) {
      let modified = false;

      // Update arModelUrl
      if (product.arModelUrl) {
        for (const item of dbMigrationMapping) {
          if (product.arModelUrl.includes(item.url) || product.arModelUrl === item.url) {
            product.arModelUrl = `/assets/${item.filename}`;
            modified = true;
            console.log(`Updating Product "${product.name}": arModelUrl -> /assets/${item.filename}`);
          }
        }
      }

      // Update images array
      if (product.images && product.images.length > 0) {
        const updatedImages = product.images.map(img => {
          for (const item of dbMigrationMapping) {
            const cleanImgUrl = img.split('?')[0];
            const cleanItemUrl = item.url.split('?')[0];
            if (cleanImgUrl.includes(cleanItemUrl) || img.includes(item.url) || img === item.url) {
              console.log(`Updating Product "${product.name}": image -> /assets/${item.filename}`);
              modified = true;
              return `/assets/${item.filename}`;
            }
          }
          return img;
        });
        product.images = updatedImages;
      }

      if (modified) {
        await product.save();
        updateCount++;
      }
    }

    console.log(`\nSuccessfully migrated references for ${updateCount} products.`);
  } catch (err) {
    console.error('Database migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();

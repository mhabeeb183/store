const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const https = require("https");

const url = "https://res.cloudinary.com/dugvuaam3/raw/upload/v1785862430/products/models/anuh4fgbysdwex9yhcjh";

function fetchGlbHeader() {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      let totalLength = 0;

      res.on("data", (chunk) => {
        chunks.push(chunk);
        totalLength += chunk.length;
        // The glTF JSON header is usually in the first 50KB or so. Let's download up to 200KB.
        if (totalLength > 200000) {
          res.destroy();
        }
      });

      res.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      res.on("close", () => {
        resolve(Buffer.concat(chunks));
      });
    }).on("error", reject);
  });
}

async function run() {
  try {
    console.log("Fetching GLB file header...");
    const buffer = await fetchGlbHeader();
    console.log("Downloaded buffer size:", buffer.length, "bytes");

    if (buffer.length < 20) {
      console.log("File is too small.");
      return;
    }

    // Check Magic (GLB magic is 0x46546C67 / "glTF")
    const magic = buffer.readUInt32LE(0);
    console.log("Magic:", magic.toString(16), magic === 0x46546c67 ? "(glTF)" : "(unknown)");

    const version = buffer.readUInt32LE(4);
    console.log("Version:", version);

    const length = buffer.readUInt32LE(8);
    console.log("Total GLB Length in header:", length);

    // Read Chunk 0 (JSON chunk)
    const chunkLength = buffer.readUInt32LE(12);
    const chunkType = buffer.readUInt32LE(16);
    console.log("Chunk 0 Length:", chunkLength);
    console.log("Chunk 0 Type:", chunkType.toString(16), chunkType === 0x4E4F534A ? "(JSON)" : "(unknown)");

    if (chunkType === 0x4E4F534A) {
      const jsonStr = buffer.toString("utf8", 20, 20 + chunkLength);
      const gltf = JSON.parse(jsonStr);
      console.log("\nParsed glTF structure:");
      
      console.log("Textures count:", gltf.textures ? gltf.textures.length : 0);
      console.log("Images count:", gltf.images ? gltf.images.length : 0);
      if (gltf.images) {
        console.log("Images:");
        gltf.images.forEach((img, i) => {
          console.log(`  [${i}]: name=${img.name}, uri=${img.uri}, bufferView=${img.bufferView}, mimeType=${img.mimeType}`);
        });
      }
      
      console.log("Materials count:", gltf.materials ? gltf.materials.length : 0);
      if (gltf.materials) {
        console.log("Materials:");
        gltf.materials.forEach((mat, i) => {
          console.log(`  [${i}]: name=${mat.name}, pbrMetallicRoughness=`, mat.pbrMetallicRoughness);
        });
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const Auction = require("../models/Auction");
const LiveStream = require("../models/LiveStream");
const SubscriptionPlan = require("../models/SubscriptionPlan");

const seedDatabase = async () => {
  try {
    // Seed Subscription Plans if none exist
    const planCount = await SubscriptionPlan.countDocuments({});
    if (planCount === 0) {
      await SubscriptionPlan.create([
        {
          name: "Monthly Premium",
          duration: 30,
          price: 299,
          freeDelivery: true,
          isActive: true,
        },
        {
          name: "Quarterly Pro",
          duration: 90,
          price: 799,
          freeDelivery: true,
          isActive: true,
        },
        {
          name: "Yearly Elite",
          duration: 365,
          price: 2499,
          freeDelivery: true,
          isActive: true,
        },
      ]);
      console.log("Seeded Subscription Plans successfully.");
    }

    // Check if database is already seeded with all 20 products and scenes
    const productCount = await Product.countDocuments({});
    const Scene = require("../models/Scene");
    const sceneCount = await Scene.countDocuments({});
    
    if (productCount >= 20 && sceneCount >= 9) {
      console.log("Database already seeded with enough products & scenes. Skipping seeder.");
      return;
    }

    console.log("Cleaning and seeding/re-seeding products, warehouses, auctions, and live streams...");

    // Clear existing product, warehouse, auction, and stream data to avoid conflicts
    await Product.deleteMany({});
    await Warehouse.deleteMany({});
    await Auction.deleteMany({});
    await LiveStream.deleteMany({});

    // 1. Get or Create Users
    let admin = await User.findOne({ role: "admin" });
    let vendor = await User.findOne({ role: "vendor" });
    let customer = await User.findOne({ role: "user" });

    if (!admin || !vendor || !customer) {
      // Clear users to prevent partial duplicate states
      await User.deleteMany({});
      
      const salt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash("admin123", salt);
      const vendorPassword = await bcrypt.hash("vendor123", salt);
      const userPassword = await bcrypt.hash("user123", salt);

      admin = await User.create({
        name: "Super Admin",
        email: "admin@example.com",
        password: adminPassword,
        role: "admin",
        isAdmin: true,
        walletBalance: 10000,
      });

      vendor = await User.create({
        name: "Tech vendor Pro",
        email: "vendor@example.com",
        password: vendorPassword,
        role: "vendor",
        walletBalance: 5000,
      });

      customer = await User.create({
        name: "John Doe",
        email: "user@example.com",
        password: userPassword,
        role: "user",
        walletBalance: 1500,
      });
      console.log("Seeded Users: admin@example.com, vendor@example.com, user@example.com");
    } else {
      console.log("Using existing database users.");
    }

    // 2. Create Products (20 total)
    const products = await Product.insertMany([
      {
        name: "Meta Quest 3 VR Headset",
        description: "Next-gen mixed reality headset with dual screen, 128GB storage, and advanced controller-free tracking. Perfect for immersive gaming and spatial computing.",
        category: "Metaverse",
        brand: "Meta",
        price: 49999,
        basePrice: 49999,
        dynamicPrice: 49999,
        stock: 50,
        soldCount: 12,
        images: ["/assets/unsplash-d337b6d320.jpg"],
        arModelUrl: "/assets/DamagedHelmet.glb",
        user: vendor._id,
        averageRating: 4.8,
      },
      {
        name: "AI Autonomous Drone 4K",
        description: "Smart follow-me drone with obstacle avoidance, 4K HDR stabilized camera, and gesture controls. Powered by onboard edge-computing neural networks.",
        category: "Electronics",
        brand: "Skydio",
        price: 79999,
        basePrice: 79999,
        dynamicPrice: 79999,
        stock: 20,
        soldCount: 5,
        images: ["/assets/unsplash-ae40ccc12e.jpg"],
        user: vendor._id,
        averageRating: 4.5,
      },
      {
        name: "Pro Gaming Mechanical Keyboard",
        description: "Tactile mechanical keyboard with customized hot-swappable yellow switches, dynamic per-key RGB backlighting, and solid aluminum chassis.",
        category: "Accessories",
        brand: "Keychron",
        price: 8999,
        basePrice: 8999,
        dynamicPrice: 8999,
        stock: 120,
        soldCount: 45,
        images: ["/assets/unsplash-3b82ff2851.jpg"],
        user: vendor._id,
        averageRating: 4.2,
      },
      {
        name: "Noise-Cancelling Wireless Headphones",
        description: "Studio-quality over-ear wireless headphones with active hybrid noise cancellation, 40-hour battery life, and spatial audio support.",
        category: "Audio",
        brand: "Sony",
        price: 24999,
        basePrice: 24999,
        dynamicPrice: 24999,
        stock: 80,
        soldCount: 30,
        images: ["/assets/unsplash-08729ae24d.jpg"],
        user: vendor._id,
        averageRating: 4.7,
      },
      {
        name: "Apple Vision Pro Spatial Computer",
        description: "Revolutionary spatial computer that seamlessly blends digital content with your physical space, featuring dual-micro-OLED displays and advanced eye tracking.",
        category: "Metaverse",
        brand: "Apple",
        price: 299999,
        basePrice: 299999,
        dynamicPrice: 299999,
        stock: 15,
        soldCount: 3,
        images: ["/assets/unsplash-608248597481-496100c8c836.jpg"],
        user: vendor._id,
        averageRating: 4.9,
      },
      {
        name: "PlayStation 5 Console Slim",
        description: "Experience lightning-fast loading with an ultra-high-speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio.",
        category: "Gaming",
        brand: "Sony",
        price: 44999,
        basePrice: 44999,
        dynamicPrice: 44999,
        stock: 40,
        soldCount: 18,
        images: ["/assets/unsplash-dded49329c.jpg"],
        user: vendor._id,
        averageRating: 4.8,
      },
      {
        name: "Nintendo Switch OLED Model",
        description: "Features a vibrant 7-inch OLED screen, a wide adjustable stand, a dock with a wired LAN port, 64 GB of internal storage, and enhanced audio.",
        category: "Gaming",
        brand: "Nintendo",
        price: 32999,
        basePrice: 32999,
        dynamicPrice: 32999,
        stock: 60,
        soldCount: 22,
        images: ["/assets/unsplash-86cb20ac25.jpg"],
        user: vendor._id,
        averageRating: 4.6,
      },
      {
        name: "Smart Fitness Watch Series 9",
        description: "Advanced health monitoring wristwear tracking real-time heart rate, blood oxygen levels, sleep quality, and active workout calories with premium design.",
        category: "Wearables",
        brand: "Fitbit",
        price: 14999,
        basePrice: 14999,
        dynamicPrice: 14999,
        stock: 100,
        soldCount: 35,
        images: ["/assets/unsplash-2e686c87e2.jpg"],
        user: vendor._id,
        averageRating: 4.4,
      },
      {
        name: "Ergonomic Mesh Office Chair",
        description: "Premium mesh office chair designed for maximum lumbar support, containing highly adjustable armrests, seat depth, and smooth-rolling castors.",
        category: "Furniture",
        brand: "Steelcase",
        price: 24999,
        basePrice: 24999,
        dynamicPrice: 24999,
        stock: 25,
        soldCount: 8,
        images: ["/assets/unsplash-657f135d1c.jpg"],
        arModelUrl: "/assets/SheenChair.glb",
        user: vendor._id,
        averageRating: 4.3,
      },
      {
        name: "Mechanical Gaming Mouse RGB",
        description: "High-precision gaming mouse with customizable weight system, 16000 DPI sensor, and 11 programmable buttons with dynamic RGB lighting profiles.",
        category: "Accessories",
        brand: "Logitech",
        price: 4999,
        basePrice: 4999,
        dynamicPrice: 4999,
        stock: 150,
        soldCount: 88,
        images: ["/assets/unsplash-5506dddc3e.jpg"],
        user: vendor._id,
        averageRating: 4.5,
      },
      {
        name: "Portable Bluetooth Speaker Waterproof",
        description: "Rugged waterproof outdoor speaker with deep bass, dual passive radiators, 20-hour battery life, and wireless multi-speaker connection support.",
        category: "Audio",
        brand: "JBL",
        price: 9999,
        basePrice: 9999,
        dynamicPrice: 9999,
        stock: 75,
        soldCount: 29,
        images: ["/assets/unsplash-93a6b222b5.jpg"],
        user: vendor._id,
        averageRating: 4.6,
      },
      {
        name: "Smart Home Assistant Speaker",
        description: "Compact smart speaker delivering rich sound with assistant integration to control lights, thermostats, and smart home appliances by voice.",
        category: "Electronics",
        brand: "Google",
        price: 4499,
        basePrice: 4499,
        dynamicPrice: 4499,
        stock: 200,
        soldCount: 110,
        images: ["/assets/unsplash-2fb71a29bd.jpg"],
        user: vendor._id,
        averageRating: 4.1,
      },
      {
        name: "4K Ultra HD Action Camera",
        description: "Pocket-sized action camera capturing stunning 4K video with HyperSmooth stabilization, waterproof design up to 10m, and dual preview screens.",
        category: "Electronics",
        brand: "GoPro",
        price: 34999,
        basePrice: 34999,
        dynamicPrice: 34999,
        stock: 45,
        soldCount: 14,
        images: ["/assets/unsplash-3f9c72fb83.jpg"],
        user: vendor._id,
        averageRating: 4.7,
      },
      {
        name: "Ultra-Slim 14\" ZenBook Laptop",
        description: "Thin and lightweight performance laptop with Intel Core i7 processor, 16GB LPDDR5 RAM, 512GB NVMe SSD, and bright OLED NanoEdge screen.",
        category: "Electronics",
        brand: "ASUS",
        price: 69999,
        basePrice: 69999,
        dynamicPrice: 69999,
        stock: 30,
        soldCount: 7,
        images: ["/assets/unsplash-1496181130204-755241524eab.jpg"],
        user: vendor._id,
        averageRating: 4.5,
      },
      {
        name: "Lego Star Wars Millennium Falcon",
        description: "Ultimate collector series Star Wars Millennium Falcon building kit. Contains 7500+ pieces, detailed interior, and multiple minifigures. The ultimate building challenge for fans.",
        category: "Kids",
        brand: "Lego",
        price: 14999,
        basePrice: 14999,
        dynamicPrice: 14999,
        stock: 30,
        soldCount: 10,
        images: ["/assets/unsplash-be0d6e6447.jpg"],
        arModelUrl: "/assets/ToyCar.glb",
        user: vendor._id,
        averageRating: 4.9,
      },
      {
        name: "RC Intelligent Dancing Robot",
        description: "Interactive smart remote control robot that sings, dances, walks, and responds to hand gestures. Perfect educational toy for kids learning technology.",
        category: "Kids",
        brand: "Sphero",
        price: 3999,
        basePrice: 3999,
        dynamicPrice: 3999,
        stock: 45,
        soldCount: 15,
        images: ["/assets/unsplash-07a83226f3.jpg"],
        arModelUrl: "/assets/RobotExpressive.glb",
        user: vendor._id,
        averageRating: 4.4,
      },
      {
        name: "Wooden Activity Blocks Castle",
        description: "Classic building block set with 100 solid wood blocks in various shapes and colors for building castles, towers, and towns. Excellent for early childhood development.",
        category: "Kids",
        brand: "Melissa & Doug",
        price: 1999,
        basePrice: 1999,
        dynamicPrice: 1999,
        stock: 60,
        soldCount: 25,
        images: ["/assets/unsplash-3d7571e920.jpg"],
        user: vendor._id,
        averageRating: 4.6,
      },
      {
        name: "Premium VR Tech Hoodie",
        description: "Futuristic street-style hoodie with integrated headphone channels, hidden pockets, and water-resistant soft-shell fabric. Sleek look for virtual reality creators.",
        category: "Fashion",
        brand: "Metaverse",
        price: 2999,
        basePrice: 2999,
        dynamicPrice: 2999,
        stock: 80,
        soldCount: 34,
        images: ["/assets/unsplash-d7c6f67cbf.jpg"],
        user: vendor._id,
        averageRating: 4.5,
      },
      {
        name: "Cyberpunk LED Sneakers",
        description: "Light-up LED sneakers with custom colors controlled via mobile app. Rechargeable battery, breathable mesh, and high-traction futuristic design.",
        category: "Fashion",
        brand: "FutureWear",
        price: 7999,
        basePrice: 7999,
        dynamicPrice: 7999,
        stock: 25,
        soldCount: 8,
        images: ["/assets/unsplash-60a828fce4.jpg"],
        arModelUrl: "/assets/MaterialsVariantsShoe.glb",
        user: vendor._id,
        averageRating: 4.7,
      },
      {
        name: "Anti-Radiation Gaming Glasses",
        description: "Professional blue light blocking glasses designed to reduce eye strain, eliminate glare, and improve visual focus during long virtual showroom visits and gaming sessions.",
        category: "Fashion",
        brand: "Gunnar",
        price: 3499,
        basePrice: 3499,
        dynamicPrice: 3499,
        stock: 65,
        soldCount: 42,
        images: ["/assets/unsplash-2f03b3a736.jpg"],
        user: vendor._id,
        averageRating: 4.3,
      }
    ]);

    console.log("Seeded Products successfully.");

    // 3. Create Warehouses
    const warehouse1 = await Warehouse.create({
      name: "Silicon Valley Fulfillment Center",
      location: {
        address: "123 Silicon Valley Road",
        city: "San Jose",
        state: "CA",
        country: "USA",
      },
      manager: admin._id,
      capacity: 10000,
      currentStock: 170,
      products: [
        { product: products[0]._id, quantity: 30, bin: "A-12" },
        { product: products[1]._id, quantity: 10, bin: "B-04" },
        { product: products[2]._id, quantity: 70, bin: "C-11" },
        { product: products[3]._id, quantity: 60, bin: "D-08" },
      ],
      status: "active",
    });

    const warehouse2 = await Warehouse.create({
      name: "Austin Logistics Hub",
      location: {
        address: "456 Lone Star Blvd",
        city: "Austin",
        state: "TX",
        country: "USA",
      },
      manager: admin._id,
      capacity: 5000,
      currentStock: 100,
      products: [
        { product: products[0]._id, quantity: 20, bin: "Z-01" },
        { product: products[1]._id, quantity: 10, bin: "Y-02" },
        { product: products[2]._id, quantity: 50, bin: "X-03" },
        { product: products[3]._id, quantity: 20, bin: "W-04" },
      ],
      status: "active",
    });

    console.log("Seeded Warehouses successfully.");

    // 4. Create Auctions
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const activeAuctionEndDate = new Date();
    activeAuctionEndDate.setHours(activeAuctionEndDate.getHours() + 4);

    await Auction.create({
      product: products[2]._id, // keyboard
      seller: vendor._id,
      title: "Autographed Vintage Stratocaster Guitar (1974)",
      description: "Extremely rare, authentic autographed Fender Stratocaster in vintage sunburst. Includes certificate of authenticity.",
      startingPrice: 150000,
      currentPrice: 175000,
      bidIncrement: 5000,
      startTime: new Date(),
      endTime: activeAuctionEndDate,
      status: "active",
      bids: [
        { user: customer._id, amount: 160000, timestamp: new Date(Date.now() - 3600000) },
        { user: admin._id, amount: 170000, timestamp: new Date(Date.now() - 1800000) },
        { user: customer._id, amount: 175000, timestamp: new Date(Date.now() - 300000) }
      ],
      images: ["/assets/unsplash-6d9b38fc1e.jpg"]
    });

    await Auction.create({
      product: products[1]._id, // drone
      seller: vendor._id,
      title: "First Edition Holographic Charizard Card (PSA 10)",
      description: "The Holy Grail of Pokemon cards. Graded Gem Mint PSA 10 first edition shadowless holographic Charizard.",
      startingPrice: 500000,
      currentPrice: 500000,
      bidIncrement: 20000,
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 86400000 * 2),
      status: "upcoming",
      bids: [],
      images: ["/assets/unsplash-8a8eb9e094.jpg"]
    });

    console.log("Seeded Auctions successfully.");

    // 5. Create LiveStreams
    await LiveStream.create({
      title: "Future of Mixed Reality: Meta Quest 3 Launch Showcase!",
      description: "Join us live as we showcase the gaming, workspace and entertainment features of Meta Quest 3 in high definition. Special discount codes for live viewers!",
      host: vendor._id,
      products: [products[0]._id, products[2]._id],
      status: "live",
      viewers: [],
      chat: [
        { user: customer._id, userName: "John Doe", message: "Wow, the visual clarity looks amazing!" },
        { user: admin._id, userName: "Super Admin", message: "Is the battery life improved over Quest 2?" },
        { user: customer._id, userName: "John Doe", message: "Can you show the passthrough mode live?" }
      ]
    });

    console.log("Seeded LiveStreams successfully.");

    // 6. Seed Scenes & Hotspots (VR Virtual Store Module)
    const Hotspot = require("../models/Hotspot");
    
    console.log("Re-seeding VR virtual showroom departments...");
    await Scene.deleteMany({});
    await Hotspot.deleteMany({});

    const lobbyScene = await Scene.create({
      name: "Lobby",
      panoramaUrl: "/assets/lobby_360.jpg",
      connections: []
    });

    const kidsScene = await Scene.create({
      name: "Kids Section",
      panoramaUrl: "/assets/toys_360.jpg",
      connections: []
    });

    const mensScene = await Scene.create({
      name: "Men's Fashion",
      panoramaUrl: "/assets/fashion_360.jpg",
      connections: []
    });

    const womensScene = await Scene.create({
      name: "Women's Fashion",
      panoramaUrl: "/assets/fashion_360.jpg",
      connections: []
    });

    const electronicsScene = await Scene.create({
      name: "Electronics Center",
      panoramaUrl: "/assets/tech_360.jpg",
      connections: []
    });

    const groceryScene = await Scene.create({
      name: "Grocery Mart",
      panoramaUrl: "/assets/lobby_360.jpg",
      connections: []
    });

    const furnitureScene = await Scene.create({
      name: "Furniture Lounge",
      panoramaUrl: "/assets/lobby_360.jpg",
      connections: []
    });

    const beautyScene = await Scene.create({
      name: "Beauty & Cosmetics",
      panoramaUrl: "/assets/fashion_360.jpg",
      connections: []
    });

    const sportsScene = await Scene.create({
      name: "Sports & Outdoors",
      panoramaUrl: "/assets/tech_360.jpg",
      connections: []
    });

    // Connect Lobby symmetrically with all 8 departments
    const departments = [
      kidsScene,
      mensScene,
      womensScene,
      electronicsScene,
      groceryScene,
      furnitureScene,
      beautyScene,
      sportsScene
    ];

    lobbyScene.connections = departments.map(d => d._id);
    await lobbyScene.save();

    for (const dep of departments) {
      dep.connections = [lobbyScene._id];
      await dep.save();
    }

    // Seed Teleport Portals inside the Lobby (8 portals, symmetrically positioned)
    const portalData = [
      { target: kidsScene, label: "Kids Department", yaw: 0.0 },
      { target: mensScene, label: "Men's Fashion", yaw: 0.78 },
      { target: womensScene, label: "Women's Fashion", yaw: 1.57 },
      { target: electronicsScene, label: "Electronics Center", yaw: 2.35 },
      { target: groceryScene, label: "Grocery Mart", yaw: 3.14 },
      { target: furnitureScene, label: "Furniture Lounge", yaw: 3.92 },
      { target: beautyScene, label: "Beauty & Cosmetics", yaw: 4.71 },
      { target: sportsScene, label: "Sports & Outdoors", yaw: 5.5 }
    ];

    for (const p of portalData) {
      await Hotspot.create({
        sceneId: lobbyScene._id,
        targetSceneId: p.target._id,
        pitch: -0.15,
        yaw: p.yaw,
        type: "teleport",
        label: p.label
      });

      // Add return portal from each department back to Lobby
      await Hotspot.create({
        sceneId: p.target._id,
        targetSceneId: lobbyScene._id,
        pitch: -0.3,
        yaw: Math.PI,
        type: "teleport",
        label: "Back to Lobby"
      });
    }

    // Seed Product Hotspots in relevant departments
    // Kids
    if (products[14]) {
      await Hotspot.create({
        sceneId: kidsScene._id,
        productId: products[14]._id,
        pitch: 0.1,
        yaw: 0.5,
        type: "product"
      });
    }
    if (products[15]) {
      await Hotspot.create({
        sceneId: kidsScene._id,
        productId: products[15]._id,
        pitch: -0.05,
        yaw: 1.2,
        type: "product"
      });
    }

    // Men
    if (products[17]) {
      await Hotspot.create({
        sceneId: mensScene._id,
        productId: products[17]._id,
        pitch: 0.1,
        yaw: 0.8,
        type: "product"
      });
    }

    // Women
    if (products[18]) {
      await Hotspot.create({
        sceneId: womensScene._id,
        productId: products[18]._id,
        pitch: -0.05,
        yaw: 1.6,
        type: "product"
      });
    }

    // Electronics
    if (products[0]) {
      await Hotspot.create({
        sceneId: electronicsScene._id,
        productId: products[0]._id,
        pitch: -0.08,
        yaw: 5.5,
        type: "product"
      });
    }
    if (products[4]) {
      await Hotspot.create({
        sceneId: electronicsScene._id,
        productId: products[4]._id,
        pitch: 0.05,
        yaw: 0.7,
        type: "product"
      });
    }

    // Grocery
    if (products[10]) {
      await Hotspot.create({
        sceneId: groceryScene._id,
        productId: products[10]._id,
        pitch: -0.1,
        yaw: 2.1,
        type: "product"
      });
    }

    // Furniture
    if (products[8]) {
      await Hotspot.create({
        sceneId: furnitureScene._id,
        productId: products[8]._id,
        pitch: -0.12,
        yaw: 3.4,
        type: "product"
      });
    }

    // Beauty
    if (products[3]) {
      await Hotspot.create({
        sceneId: beautyScene._id,
        productId: products[3]._id,
        pitch: 0.05,
        yaw: 4.2,
        type: "product"
      });
    }

    // Sports
    if (products[7]) {
      await Hotspot.create({
        sceneId: sportsScene._id,
        productId: products[7]._id,
        pitch: -0.06,
        yaw: 5.1,
        type: "product"
      });
    }

    console.log("Seeded VR Rooms and hotspots successfully.");
    console.log("Seeding Database Completed!");
  } catch (error) {
    console.error("Database Seeding Failed:", error.message);
  }
};

module.exports = seedDatabase;

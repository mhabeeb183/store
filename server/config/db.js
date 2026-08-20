import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectToDb = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const connection = await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    return connection;
  } catch (error) {
    console.log(error);
  }
};

export default connectToDb;

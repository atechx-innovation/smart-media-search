   import dns from "node:dns";
   dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
}

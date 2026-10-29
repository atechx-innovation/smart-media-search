import "dotenv/config";
import path from "node:path";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  isProd: process.env.NODE_ENV === "production",
  mongoUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? "uploads"),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024,
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};

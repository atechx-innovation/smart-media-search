import { RequestHandler, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password needs at least one letter")
  .regex(/[0-9]/, "Password needs at least one number");

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  password: passwordSchema,
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

export const cookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  // cross-site deploy (Vercel frontend + separate API host) needs "none" + secure
  sameSite: (env.isProd ? "none" : "lax") as "none" | "lax",
};

function setSession(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: "7d" });
  res.cookie("sid", token, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

const publicUser = (u: { id: string; name: string; email: string }) => ({
  id: u.id, name: u.name, email: u.email,
});

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    if (await User.exists({ email: email.toLowerCase() })) throw new AppError(409, "An account with this email already exists");
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    setSession(res, user.id);
    res.status(201).json({ ok: true, user: publicUser(user) });
  } catch (e) { next(e); }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    // same message for unknown email and wrong password
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, "Incorrect email or password");
    setSession(res, user.id);
    res.json({ ok: true, user: publicUser(user) });
  } catch (e) { next(e); }
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie("sid", cookieOpts);
  res.json({ ok: true });
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(401, "Account not found");
    res.json({ ok: true, user: publicUser(user) });
  } catch (e) { next(e); }
};

import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { Collection } from "../models/Collection.js";
import { Conversation } from "../models/Conversation.js";
import { Media } from "../models/Media.js";
import { Message } from "../models/Message.js";
import { SearchHistory } from "../models/SearchHistory.js";
import { User } from "../models/User.js";
import { deleteMediaDocs } from "../services/mediaCleanup.js";
import { AppError } from "../utils/errors.js";
import { cookieOpts, passwordSchema } from "./auth.js";

async function verifyPassword(userId: string, password: string) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, "Incorrect password");
  return user;
}

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().trim().min(1, "Name is required").max(80) }).parse(req.body);
    const user = await User.findByIdAndUpdate(req.userId, { name }, { new: true });
    if (!user) throw new AppError(404, "Account not found");
    res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema }).parse(req.body);
    const user = await verifyPassword(req.userId!, currentPassword);
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
};

/** Permanently removes the account and everything it owns. Requires the password. */
export const deleteAccount: RequestHandler = async (req, res, next) => {
  try {
    const { password } = z.object({ password: z.string().min(1, "Enter your password") }).parse(req.body);
    await verifyPassword(req.userId!, password);
    const id = req.userId!;
    await deleteMediaDocs(id, await Media.find({ ownerId: id }));
    const convs = await Conversation.find({ ownerId: id }).select("_id");
    await Message.deleteMany({ conversationId: { $in: convs.map((c) => c._id) } });
    await Promise.all([
      Conversation.deleteMany({ ownerId: id }), Collection.deleteMany({ ownerId: id }),
      SearchHistory.deleteMany({ ownerId: id }), User.deleteOne({ _id: id }),
    ]);
    res.clearCookie("sid", cookieOpts);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

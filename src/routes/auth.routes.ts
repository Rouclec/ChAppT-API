import { Router } from "express";
import { login, logout, verifyUser } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/verify", verifyUser);

export default router;

import { Router } from "express";
import { protect } from "../controllers/auth.controller";
import {
  searchUsers,
  updateUser,
  uploadImage,
} from "../controllers/user.controller";
import { resizePhoto } from "../utils/helper";

const router = Router();

router.use(protect);
router.patch("/update-me", uploadImage, resizePhoto, updateUser);
router.get("/search", searchUsers);

export default router;

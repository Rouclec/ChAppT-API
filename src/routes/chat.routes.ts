import { Router } from "express";
import { protect } from "../controllers/auth.controller";
import {
  addUsersToGroup,
  createChat,
  createGroupChat,
  getAllUserChat,
  updateGroup,
} from "../controllers/chat.controller";

const router = Router();

router.use(protect);

router.route("/").post(createChat).get(getAllUserChat);
router.route("/group").post(createGroupChat);
router.patch("/group/:id", updateGroup);
router.patch("/group/:id/add-users", addUsersToGroup);
// router.route('/group').post(createGroup).patch(renameGroup)
// router.patch('/group/add-user',addUsersToGroup);
// router.patch('/group/remove-app',removeUserFromGroup)

export default router;

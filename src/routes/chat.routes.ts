import { Router } from "express";
import { protect } from "../controllers/auth.controller";
import { createChat } from "../controllers/chat.controller";

const router = Router();

router.use(protect);
// router.route("/").post(createChat).get(fetchChats)
router.route("/").post(createChat);
// router.route('/group').post(createGroup).patch(renameGroup)
// router.patch('/group/add-user',addUsersToGroup);
// router.patch('/group/remove-app',removeUserFromGroup)

export default router;

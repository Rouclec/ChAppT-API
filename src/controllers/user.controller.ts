import User from "../models/user";
import catchAsync from "../utils/catchAsync";
import DB from "../utils/db";
import { upload } from "../utils/helper";

export const uploadImage = upload.single("image");

export const updateUser = catchAsync(async (req: any, res, next) => {
  const { username } = req.body;

  let image;
  req?.image ? (image = req?.image) : (image = undefined);

  await DB();
  const updatedUser = await User.findByIdAndUpdate(req?.user?._id, {
    username,
    profileImage: image,
  });

  return next(
    res.status(200).json({
      status: "OK",
      data: updatedUser,
    })
  );
});

export const searchUsers = catchAsync(async (req: any, res, next) => {
  const keyword = req.query.search
    ? {
        $or: [
          {
            username: { $regex: req?.query?.search, $options: "i" },
          },
          {
            phoneNumber: { $regex: req?.query?.search, $options: "i" },
          },
        ],
      }
    : {};

  await DB();

  const users = await User.find(keyword);

  return next(
    res.status(200).json({
      status: "OK",
      results: users.length,
      data: users,
    })
  );
});

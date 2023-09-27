import Chat from "../models/chat";
import User from "../models/user";
import catchAsync from "../utils/catchAsync";
import DB from "../utils/db";

export const createChat = catchAsync(async (req, res, next) => {
  const { phoneNumber } = req?.body;

  if (!phoneNumber) {
    return next(
      res.status(400).json({
        status: "Bad request",
        message: `Please enter a phone number`,
      })
    );
  }

  await DB();
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `User with phone number ${phoneNumber} doesn't exist`,
      })
    );
  }

  const chat = await Chat.findOne({
    isGroupChat: false,
    users: [req?.user?._id, user?._id],
  })
    .populate("users")
    // .populate("latestMessage");

  if (!!chat) {
    return next(
      res.status(200).json({
        status: "OK",
        data: chat,
      })
    );
  }

  const chatData = {
    chatName: `${user?.username}`,
    users: [req?.user?._id, user?._id],
  };
  const newChat = await Chat.create(chatData);

  const populatedChat = await Chat.findById(newChat._id).populate("users");

  return next(
    res.status(201).json({
      status: "OK",
      data: populatedChat,
    })
  );
});

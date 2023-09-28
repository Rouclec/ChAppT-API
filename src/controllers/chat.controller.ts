import Chat from "../models/chat";
import User from "../models/user";
import catchAsync from "../utils/catchAsync";
import DB from "../utils/db";
import { updateOne } from "../utils/helper";

function getUniqueUsers(array1: any[], array2: any[]): any[] {
  return array2.filter((value) => !array1.includes(value));
}

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
  }).populate("users");
  // .populate("latestMessage");

  if (!!chat) {
    if (chat.name !== user.username) {
      const updatedChat = await Chat.findByIdAndUpdate(
        chat._id,
        { name: user.username },
        { new: true }
      );

      return next(
        res.status(200).json({
          status: "OK",
          data: updatedChat,
        })
      );
    }
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

export const getAllUserChat = catchAsync(async (req, res, next) => {
  await DB();
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req?.user?._id } },
  })
    .populate("users")
    .sort({ updatedAt: -1 });

  return next(
    res.status(200).json({
      status: "OK",
      results: chats.length,
      data: chats,
    })
  );
});

export const createGroupChat = catchAsync(async (req, res, next) => {
  const usersBody = req?.body?.users.filter(
    (user: string) => user.toString() !== req?.user?._id.toString()
  );

  if (usersBody.length === 0) {
    return next(
      res.status(400).json({
        status: "Bad request",
        message: "Please enter atleast 1 user",
      })
    );
  }

  const admins = [req?.user?._id];
  const users = [req?.user?._id, ...usersBody];

  const { description = "", name = "" } = req?.body;

  const chatObj = {
    name,
    description,
    isGroupChat: true,
    users,
    groupAdmins: admins,
  };
  await DB();
  const newChat = await Chat.create(chatObj);
  const chat = await Chat.findById(newChat._id).populate("users");

  return next(
    res.status(200).json({
      status: "OK",
      data: chat,
    })
  );
});

export const updateGroup = updateOne(Chat, ["name", "description"]);

export const addUsersToGroup = catchAsync(async (req, res, next) => {
  await DB();
  const chat = await Chat.findById(req?.params?.id);

  if (!chat) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `No chat with id ${req?.params?.id}`,
      })
    );
  }

  const isAdmin = chat.groupAdmins?.find(
    (user) => user.toString() === req?.user?._id.toString()
  );

  if (!isAdmin) {
    return next(
      res.status(403).json({
        status: "Forbidden",
        message: `You don't have permission to add users`,
      })
    );
  }

  if (!req?.body?.users || req?.body?.users?.length === 0) {
    return next(
      res.status(400).json({
        status: "Bad request",
        message: "Please enter atleast 1 user",
      })
    );
  }

  const uniqueUsers = getUniqueUsers(chat.users as any, req?.body?.users);

  if (uniqueUsers.length === 0) {
    return next(
      res.status(400).json({
        status: "Bad request",
        message: "Users are alrealdy members of this group",
      })
    );
  }

  const updatedChat = await Chat.findByIdAndUpdate(chat._id, {
    $push: { users: uniqueUsers },
  });

  return next(
    res.status(200).json({
      status: "OK",
      data: updatedChat,
    })
  );
});

export const removeUsersFromGroup = catchAsync(async (req, res, next) => {
  await DB();
  const chat = await Chat.findById(req?.params?.id);

  if (!chat) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `No chat with id ${req?.params?.id}`,
      })
    );
  }

  const isAdmin = chat.groupAdmins?.find(
    (user) => user.toString() === req?.user?._id.toString()
  );

  if (!isAdmin) {
    return next(
      res.status(403).json({
        status: "Forbidden",
        message: `You don't have permission to add users`,
      })
    );
  }

  if (!req?.body?.users || req?.body?.users?.length === 0) {
    return next(
      res.status(400).json({
        status: "Bad request",
        message: "Please enter atleast 1 user",
      })
    );
  }

  const updatedChat = await Chat.findByIdAndUpdate(chat._id, {
    $pull: { users: req?.body?.users },
  });

  return next(
    res.status(200).json({
      status: "OK",
      data: updatedChat,
    })
  );
});

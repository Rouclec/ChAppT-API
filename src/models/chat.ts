import { Schema, model, Document, Query } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import User, { UserType } from "./user";
import { Message } from "./message";

export interface Chat extends Document {
  _id?: string;
  name: string;
  isGroupChat: boolean;
  description: string;
  users?: string[] | UserType[];
  groupAdmins: string[] | UserType[];
  messages?: Message[]
}

const chatSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    description: String,
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: String,
        ref: "User",
      },
    ],
    groupAdmins: [
      {
        type: String,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

chatSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} is already in use",
});

chatSchema.index({ "$**": "text" });

const Chat = model<Chat>("Chat", chatSchema);

export default Chat;

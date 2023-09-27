import { Schema, model, Document } from "mongoose";
import { Chat } from "./chat";
import uniqueValidator from "mongoose-unique-validator";
import { UserType } from "./user";

export interface Message extends Document {
  _id?: string;
  sender: string | UserType;
  body: string;
  chat: string | Chat;
}

const messageSchema = new Schema(
  {
    sender: {
      type: String,
      ref: "User",
    },
    body: {
      type: String,
    },
    chat: {
      type: String,
      ref: "Chat",
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} is already in use",
});

messageSchema.index({ "$**": "text" });

const Message = model<Message>("Message", messageSchema);

export default Message;

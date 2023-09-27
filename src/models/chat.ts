import { Schema, model, Document } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { UserType } from "./user";

export interface Chat extends Document {
  _id?: string;
  name: string;
  isGroupChat: {
    type: boolean;
    default: false;
  };
  users?: String[] | UserType[];
  groupAdmins: String[] | UserType[];
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

import { Schema, model, Document } from "mongoose";
import { Chat } from "./chat";
import uniqueValidator from "mongoose-unique-validator";
import validator from "validator";

export interface UserType extends Document {
  _id?: string;
  username: string;
  phoneNumber: string;
  profileImage?: string;
  isVerified: boolean;
  isLoggedInTo?: string | null;
  verificationCode?: string | null;
  chats?: String[] | Chat[];
}

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Please enter a valid phone number"],
      unique: true,
      validate: [validator.isMobilePhone, "Please enter a valid phone number"],
    },
    isLoggedInTo: {
      type: String,
    },
    profileImage: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    chats: [
      {
        type: String,
        ref: "Chat",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} is already in use",
});

userSchema.index({ "$**": "text" });

const User = model<UserType>("User", userSchema);

export default User;

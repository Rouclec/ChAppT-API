import { config } from "dotenv";
import mongoose from "mongoose";

config({path: './config.env'})
const connectionString = process.env.DB as string;

export default function DB() {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(connectionString)
      .then((res) => {
        if (res) {
          console.log("Database connected");
          resolve("Database connected!");
        }
      })
      .catch((err) => {
        console.log({ err });
        reject(`Error connecting to database ${err?.message}`);
      });
  });
}

import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import session from "express-session";
import authRouter from "./routes/auth.routes";
import chatRouter from "./routes/chat.routes";
import userRouter from "./routes/user.routes";

const app: Express = express();

const corsOptions = {
  origin: ["http://localhost:3000"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());

app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: "session",
    cookie: {
      maxAge: 1000 * 60 * 60,
      sameSite: "none",
      secure: false,
    },
  })
);

app.use(express.json({ limit: "10kb" }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/user", userRouter);

export default app;

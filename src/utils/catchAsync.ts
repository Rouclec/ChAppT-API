import { NextFunction, Request, Response } from "express";

export default function catchAsync(
  fxn: (
    arg0: any,
    arg1: any,
    arg2: NextFunction
  ) => Promise<Response<any, Record<string, any>> | undefined | void>
) {
  return (req: any, res: any, next: NextFunction) => {
    fxn(req, res, next).catch((err: any) => {
      if (err.name === "ValidationError") {
        return next(
          res.status(500).json({
            status: "Server Error",
            message: err.message.split(",")[0],
          })
        );
      } else if (err.name === "JsonWebTokenError") {
        return next(
          res.status(500).json({
            status: "Server Error",
            message: err.message,
          })
        );
      } else if (err.name === "TokenExpiredError") {
        return next(
          res.status(401).json({
            status: "Token expired",
            message: err.message,
          })
        );
      } else {
        return next(err);
      }
    });
  };
}

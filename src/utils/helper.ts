import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import APIFeatures from "./apiFeatures";
import catchAsync from "./catchAsync";
import DB from "./db";
import multer from "multer";
import fs from "fs";
import sharp from "sharp";

const multerStorage = multer.memoryStorage();
const s3Config: S3ClientConfig = {
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_TOKEN as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
};
const s3 = new S3Client(s3Config);

const uploadFile = async (filename: string, path: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const file = fs.readFileSync(path);
      const BUCKET = process.env.AWS_BUCKET as string;

      const uploadParams = {
        Bucket: BUCKET,
        Key: `${filename}`,
        Body: file,
      };

      const data = await new Upload({
        client: s3,
        params: uploadParams,
      }).done();
      resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
};

const multerFilter = (_: any, file: any, cbFxn: any) => {
  if (file.mimetype.startsWith("image")) {
    cbFxn(null, true);
  } else {
    cbFxn("Error: Not an image!", false);
  }
};

export const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const resizePhoto = catchAsync(async (req: any, res, next) => {
  if (!req.file) return next();

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile("public/img/image.jpeg");

  const response = (await uploadFile(
    `${req.file.originalname}`,
    "public/img/image.jpeg"
  )) as any;
  req.image = response.Location;

  return next();
});

export const deleteOne = (Model: any) =>
  catchAsync(async (req, res, next) => {
    if (!req.params.id) {
      return next(
        res.status(400).json({
          status: "Bad request",
          message: `Please enter the document id`,
        })
      );
    }

    await DB();
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(
        res.status(404).json({
          status: "Not found",
          message: `Document with id ${req.params.id} not found`,
        })
      );
    }
    await Model.findByIdAndDelete(req.params.id);

    return next(
      res.status(204).json({
        status: "OK",
        data: doc,
      })
    );
  });

export const updateOne = (Model: any, params: string[]) =>
  catchAsync(async (req, res, next) => {
    let body = {} as any;
    params.forEach((param) => (body[param] = req.body[param]));
    await DB();
    const updatedDoc = await Model.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    return next(
      res.status(200).json({
        status: "OK",
        data: updatedDoc,
      })
    );
  });

export const createOne = (Model: any, params: string[]) =>
  catchAsync(async (req: any, res, next) => {
    let body = {
      createdBy: req?.user?._id,
    } as any;
    params.forEach((param) => (body[param] = req.body[param]));

    await DB();
    const newDoc = await Model.create(body);

    return next(
      res.status(201).json({
        status: "OK",
        data: newDoc,
      })
    );
  });

export const getOne = (
  Model: any,
  populateOptions?: string[],
  selectionOption?: string[]
) =>
  catchAsync(async (req, res, next) => {
    if (!req.params.id) {
      return next(
        res.status(400).json({
          status: "Bad request",
          message: `Please enter the document id`,
        })
      );
    }

    await DB();
    let query = Model.findById(req.params.id);

    if (populateOptions)
      populateOptions.forEach((option) => (query = query.populate(option)));

    if (selectionOption)
      selectionOption.forEach((option) => (query = query.select(option)));

    const doc = await query;

    if (!doc) {
      return next(
        res.status(404).json({
          status: "Not found",
          message: `Document with id ${req.params.id} not found`,
        })
      );
    }

    return next(
      res.status(200).json({
        status: "OK",
        data: doc,
      })
    );
  });

export const getAll = (Model: any) =>
  catchAsync(async (req, res, next) => {
    await DB();
    const features = new APIFeatures(Model.find(), req?.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;
    let pageQuery = features.queryString.page;
    let limitQuery = features.queryString.limit;
    let newQueryString = features.queryString;

    delete newQueryString.sort;
    delete newQueryString.page;
    delete newQueryString.limit;

    const count = await Model.coung(newQueryString);
    let page = "1 of 1";

    if (pageQuery && limitQuery) {
      const pages = Math.ceil(count / limitQuery);
      page = `${pageQuery} of ${pages}`;
    }

    return next(
      res.status(200).json({
        status: "OK",
        results: count,
        page,
        data: docs,
      })
    );
  });

export const search = (Model: any) =>
  catchAsync(async (req, res, next) => {
    let docs = [];
    let count = 0;
    let page = "1 of 1";

    await DB();
    if (req?.query?.page && req?.query?.limit) {
      let paginate = Number(req.query.page) - 1;
      let limit = Number(req.query.limit);
      count = await Model.count({
        $text: { $search: req.params.searchString },
      });
      const pages = Math.ceil(count / limit);
      page = `${paginate + 1} of ${pages}`;
      docs = await Model.find({
        $text: { $search: req.params.searchString },
      })
        .skip(paginate)
        .limit(limit);
    } else {
      docs = await Model.find({
        $text: { $search: req.params.searchString },
      });
      count = docs.length;
    }

    return next(
      res.status(200).json({
        status: "OK",
        results: count,
        page,
        data: docs,
      })
    );
  });

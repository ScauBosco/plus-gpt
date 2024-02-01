import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  maxDuration: 60,
};
export const apiErrorHandler =
  (fn: any) => async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const data = await fn(req, res);
      if (typeof data === "string") {
        // 直接返回字符串
        res.status(200).send(data);
      } else {
        res.status(200).json({
          data,
        });
      }
    } catch (error: any) {
      const statusCode = 200;
      const message = error.message || "Internal Server Error";
      console.error(error);
      res.status(statusCode).json({
        errors: [
          {
            message,
            code: error.code || 3,
          },
        ],
      });
    }
  };

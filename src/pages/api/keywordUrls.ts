import { NextApiRequest } from "next";
import { apiErrorHandler } from "@/util/apiErrorHandler";

import YouTube from "youtube-sr";

const handler = async (req: NextApiRequest) => {
  const { search = "" } = req.query;
  const urlList = await YouTube.search(search as string, {
    limit: 5,
    type: "video",
  });
  return urlList;
};

export default apiErrorHandler(handler);

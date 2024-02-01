import { NextApiRequest } from "next";
import { parse } from "url";
import { apiErrorHandler } from "@/util/apiErrorHandler";

import YouTube from "youtube-sr";
function getParameterFromUrl(urlString: string, parameter: string) {
  const urlObj = parse(urlString, true);
  return (urlObj.query[parameter] ?? "") as string;
}
const handler = async (req: NextApiRequest) => {
  const { videoUrl = "" } = req.query;
  const listID = getParameterFromUrl(videoUrl as string, "list"); // 获取视频ID
  const urlList = await YouTube.getPlaylist(listID, { fetchAll: true });
  return urlList;
};

export default apiErrorHandler(handler);

import { NextApiRequest, NextApiResponse } from "next";
import { getSubtitles } from "youtube-captions-scraper";
import { parse } from "url";
import OpenAI from "openai";
import { APIKEY, BASEURL } from "@/constant/config";
import { CaptionsItem, getPromptTextParams } from "../urlToEssay/interface";

export const config = {
  maxDuration: 10,
};
function getParameterFromUrl(urlString: string, parameter: string) {
  const urlObj = parse(urlString, true);
  return (urlObj.query[parameter] ?? "") as string;
}
const openai = new OpenAI({
  apiKey: APIKEY,
  baseURL: BASEURL,
});
const roleDuty = "You are a helpful assistant designed to output essay";
const DEFAULT_PROMPT = "期望输出涵盖字幕所有提到的点输出成一篇生成要点文章.";

const getPromptText = (data: getPromptTextParams) => `
  #第一、markdown形式，返回中文
  #第二、${data.prompt || DEFAULT_PROMPT}
  ${data.appendTime &&`#第三，列出要点并附上视频时间跳转链接，[time](${data.videoUrl}&t=[time]s)#例如：[3.319](${data.videoUrl}&t=3.319s),[6.96](${data.videoUrl}&t=6.96s)。`}
  以下是提供的字幕文段:\n
  ${data.captains}
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 设置必要的 HTTP 头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let prompt = "";
  if (req.method === "POST") {
    // 解析POST请求体
    const data = JSON.parse(req.body);
    // console.log("req.body", data.prompt);
    if (data.prompt) prompt = data.prompt;
  }

  // 处理关闭连接
  req.on("close", () => {
    res.end();
  });

  let { videoUrl = "" } = req.query;
  const videoID = getParameterFromUrl(videoUrl as string, "v"); // 获取视频ID
  const result: CaptionsItem[] = await getSubtitles({
    videoID,
    lang: "en", // 你可以指定你想要的语言
  });
  const captionsText = result
    .map((el) => `${el.text} - time:${el.start}`)
    .filter((el) => !el.includes("[Music]"));
  const promptText = getPromptText({
    captains: captionsText.join("\n"),
    prompt,
    appendTime: true,
    videoUrl: videoUrl as string,
  });
  // console.log("promptText", promptText);
  try {
    // 发起请求到 OpenAI 的接口
    const response = await openai.chat.completions.create({
      temperature: 0.01,
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: roleDuty },
        { role: "user", content: JSON.stringify({ prompt: promptText }) },
      ],
      stream: true,
    });
    // 将数据流式地发送到客户端
    for await (const chunk of response) {
      let message = chunk.choices[0]?.delta?.content || "";
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
    res.end();
  } catch (e) {
    res.write(e);
    res.end();
    throw e;
  }

  res.end();
}

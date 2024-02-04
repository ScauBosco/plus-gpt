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
const DEFAULT_PROMPT =
  "输入一段从视频中提取的字幕文本，输入到大模型中，期望输出涵盖字幕所有提到的点不增不减地重新组织语言，输出成一篇流畅的中文文章.";

const getPromptText = (data: getPromptTextParams) => `
    ${data.prompt || DEFAULT_PROMPT}
    所有结果返回都是中文！并以markdown形式返回！
    ${
      data.appendTime &&
      `在生成文章时，把时间以[time]的形式添加到句子末尾，选这一句话或者这一个描述点涉及到的这个字幕的时间段的开始时间.
    请注意，这里是关键，一定要按照以下格式拼接到对应句子末尾，而不是文段末尾!!
    [time](${data.videoUrl}&t=[time]s)
    例如：一开始我们就在这里[3.319](${data.videoUrl}&t=3.319s),后面我们去了那里[6.96](${data.videoUrl}&t=6.96s)。
    `
    }
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
        { role: "user", content: JSON.stringify({ prompt:promptText }) },
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

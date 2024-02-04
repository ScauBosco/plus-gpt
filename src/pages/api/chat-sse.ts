import { APIKEY, BASEURL } from "@/constant/config";
import { apiErrorHandler } from "@/util/apiErrorHandler";
import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: APIKEY,
  baseURL: BASEURL,
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // 设置必要的 HTTP 头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let prompt = "";
  if (req.method === "POST") {
    // 解析POST请求体
    const data = req.body;
    prompt = data.prompt;
  }

  // 处理关闭连接
  req.on("close", () => {
    res.end();
  });

  // 发起请求到 OpenAI 的接口
  const response = await openai.chat.completions.create({
    temperature: 0.01,
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
  });

  // 将数据流式地发送到客户端
  res.write(`data: ${JSON.stringify(response)}\n\n`);

  res.end();
};
export default apiErrorHandler(handler);

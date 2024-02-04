import { APIKEY, BASEURL } from "@/constant/config";
import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: APIKEY,
  baseURL: BASEURL,
});
const DEFAULT_PROMPT = "生成一个苹果";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 设置必要的 HTTP 头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let prompt = DEFAULT_PROMPT;
  if (req.method === "POST") {
    // 解析POST请求体
    const data = JSON.parse(req.body);
    console.log("req.body", data.prompt);
    if (data.prompt) prompt = data.prompt;
  }

  // 处理关闭连接
  req.on("close", () => {
    res.end();
  });

  try {
    // 发起请求到 OpenAI 的接口
    const response = await openai.chat.completions.create({
      temperature: 0.01,
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: JSON.stringify({ prompt }) },
      ],
      stream: true,
    });
    // 将数据流式地发送到客户端
    for await (const chunk of response) {
      let message = chunk.choices[0]?.delta?.content || "";
      console.log(message)
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
    // res.write(`data: ${JSON.stringify(response)}\n\n`);
    // res.write(`data: ${JSON.stringify(response)}\n\n`);
    // res.write(`data: ${JSON.stringify(response)}\n\n`);
    // res.write(JSON.stringify({response}));
  } catch (e) {
    res.write(e);
    res.end();
    throw e;
  }

  res.end();
}

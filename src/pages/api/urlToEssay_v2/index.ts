import { NextApiRequest, NextApiResponse } from "next";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { RequestOptions } from "openai/core";
import OpenAI from "openai";
import { throwApiError } from "@/constant/errorCode";
import { apiErrorHandler } from "@/util/apiErrorHandler";

export const config = {
  maxDuration: 10,
};
const openai = new OpenAI({
  apiKey: "sk-OZIo76FU51NfLGOg1g1OEMlcvz2CFItk3vyEz46VLGwHaDom",
  baseURL: "https://api.chatanywhere.tech",
});
const roleDuty = "You are a helpful assistant designed to output essay";
async function chat(
  body: ChatCompletionCreateParamsNonStreaming,
  options?: RequestOptions
) {
  const completion = await openai.chat.completions.create(body, options);

  const msg = completion.choices[0].message;
  return msg;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let promptText = "";
  if (req.method === "POST") {
    // 解析POST请求体
    const data = req.body;
    promptText = data.prompt;
  }
  console.log("promptText2", promptText);
  const chatEssay = await getChatMsg(promptText);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return chatEssay?.content;
};
async function getChatMsg(doWhat: string) {
  const msg = await chat({
    messages: [
      { role: "system", content: roleDuty },
      { role: "user", content: doWhat },
    ],
    temperature: 0.01,
    model: "gpt-3.5-turbo",
  }).catch((err) => {
    throwApiError("OPENAI_ERROR", {
      message: err.message,
    });
  });
  return msg;
}

export default apiErrorHandler(handler);

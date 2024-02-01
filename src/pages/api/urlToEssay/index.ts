import {NextApiRequest, NextApiResponse} from 'next';
import {getSubtitles} from 'youtube-captions-scraper';
import {parse} from 'url';
import {CaptionsItem} from './interface';
import {ChatCompletionCreateParamsNonStreaming} from 'openai/resources/chat/completions';
import {RequestOptions} from 'openai/core';
import OpenAI from 'openai';
import { throwApiError } from '@/constant/errorCode';
import { apiErrorHandler } from '@/util/apiErrorHandler';

export const maxDuration = 60
function getParameterFromUrl(urlString: string, parameter: string) {
    const urlObj = parse(urlString, true);
    return (urlObj.query[parameter] ?? '') as string;
}
const openai = new OpenAI({
    apiKey: 'sk-OZIo76FU51NfLGOg1g1OEMlcvz2CFItk3vyEz46VLGwHaDom',
    baseURL: 'https://api.chatanywhere.tech',
});
const roleDuty = 'You are a helpful assistant designed to output essay';
const DEFAULT_PROMPT
    = '输入一段从视频中提取的字幕文本，输入到大模型中，期望输出涵盖字幕所有提到的点不增不减地重新组织语言，输出成一篇流畅的中文文章.';
interface getPromptTextParams {
    captains: string;
    prompt?: string;
    appendTime: boolean;
    videoUrl?: string;
}
const getPromptText = (data: getPromptTextParams) => `
    ${data.prompt || DEFAULT_PROMPT}
    所有结果返回都是中文！并以markdown形式返回！
    ${data.appendTime
        && `在生成文章时，把时间以[time]的形式添加到句子末尾，选这一句话或者这一个描述点涉及到的这个字幕的时间段的开始时间.
    请一定要按照以下格式拼接到对应句子末尾，而不是文段末尾！
    [time](${data.videoUrl}&t=[time]s)
    例如：一开始我们就在这里[3.319](${data.videoUrl}&t=3.319s),后面我们去了那里[6.96](${data.videoUrl}&t=6.96s)。
    `}
    以下是提供的字幕文段:\n
    ${data.captains}
`;
async function chat(
    body: ChatCompletionCreateParamsNonStreaming,
    options?: RequestOptions
) {
    const completion = await openai.chat.completions.create(body, options);

    const msg = completion.choices[0].message;
    return msg;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    let prompt = '';
    if (req.method === 'POST') {
        // 解析POST请求体
        const data = req.body;
        prompt = data.prompt;
    }
    let {videoUrl = ''} = req.query;
    const videoID = getParameterFromUrl(videoUrl as string, 'v'); // 获取视频ID
    const result: CaptionsItem[] = await getSubtitles({
        videoID,
        lang: 'en', // 你可以指定你想要的语言
    });
    const captionsText = result
        .map(el => `${el.text} - time:${el.start}`)
        .filter(el => !el.includes('[Music]'));
    const promptText = getPromptText({
        captains: captionsText.join('\n'),
        prompt,
        appendTime: true,
        videoUrl: videoUrl as string,
    });
    console.log('promptText', promptText);
    const chatEssay = await getChatMsg(promptText);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // res.setHeader('Authorization', 'Bearer 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');
    return chatEssay?.content;
};
async function getChatMsg(doWhat: string) {
    const msg = await chat({
        messages: [
            {role: 'system', content: roleDuty},
            {role: 'user', content: doWhat},
        ],
        temperature: 0.01,
        model: 'gpt-3.5-turbo',
        // functions: CHAT_PROMPT.tools.map(tool => tool.function),
    }).catch(err => {
        throwApiError('OPENAI_ERROR', {
            message: err.message,
        });
    });
    return msg;
}

export default apiErrorHandler(handler);

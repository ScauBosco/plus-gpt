import Head from "next/head";
import { NextPage } from "next";
import Layout from "../components/Layout";
import styles from "../styles/Home.module.css";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const DEFAULT_VIDEO_URL =
  "https://www.youtube.com/watch?v=BIpz9Hdjm_A&list=PLNYkxOF6rcIAcezfL8q0rjt13ufKseL5X";
const DEFAULT_VIDEO_URLS =
  "https://www.youtube.com/playlist?list=PLNYkxOF6rcIAcezfL8q0rjt13ufKseL5X";
  const DEFAULT_VIDEO_KEYWORDS='三国演义'
  const Essay: NextPage<any> = () => {
  const [essay, setEssay] = useState<any>();
  const [typewriterValue, setTypewriterValue] = useState<string>();
  const [url, setUrl] = useState(DEFAULT_VIDEO_URL);
  const [listUrls, setListUrls] = useState(DEFAULT_VIDEO_URLS);
  const [prompt, setPrompt] = useState();
  const [urls, setUrls] = useState<string[]>();
  const [keywordUrls, setKeywordUrls] = useState<string[]>();
  const [keyword, setKeyword] = useState<string>(DEFAULT_VIDEO_KEYWORDS);
  const contentRef = useRef("");
  const essayRef = useRef("");
  const urlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;
    setUrl(inputValue);
  };
  const urlsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;
    setListUrls(inputValue);
  };
  const keywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;
    setKeyword(inputValue);
  };
  const promptChange = (event: any) => {
    const inputValue = event.target.value;
    setPrompt(inputValue);
  };
  const asyncEvent = async () => {
    let res = null;
    try {
      res = await axios.post(`/api/urlToEssay?videoUrl=${url}`, {
        prompt,
      });
      setEssay(res.data);
    } catch (error) {
      throw error;
    }
  };
  const asyncEvent2 = async () => {
    const ctrl2 = new AbortController();
    fetchEventSource(`/api/urlToEssay_v2?videoUrl=${url}`, {
      method: "POST",
      body: JSON.stringify({
        prompt,
      }),
      signal: ctrl2.signal,
      onmessage: (event) => {
        essayRef.current += JSON.parse(event.data);
      },
      onerror: (event) => {
        // console.log("asyncEvent2", event);
        throw event;
      },
      onclose: () => {
        setEssay(essayRef.current);
        essayRef.current=''
        ctrl2.abort()
      },
    });
  };

  const asyncEvent3 = async () => {
    const ctrl = new AbortController();
    fetchEventSource("/api/chat-sse", {
      method: "POST",
      body: JSON.stringify({
        prompt,
      }),
      signal: ctrl.signal,
      onmessage: (event) => {
        // setEssay(data.chioces[0].content);
        contentRef.current += JSON.parse(event.data);
        // setTypewriterValue(pre=>pre+JSON.parse(event.data));
      },
      onerror: (event) => {
        // aiChat.pushMessage("assistant", "请求失败" + event?.message);
        // console.log("qingqiushibai", event);
        throw event;
      },
      onclose: () => {
        setTypewriterValue(contentRef.current);
        contentRef.current=''
      },
    });
  };
  const getSeriesUrls = async () => {
    let res = null;
    try {
      res = await axios.get(`/api/videoUrls?videoUrl=${listUrls}`);
      let list = res.data.data.videos.map((element: any) => {
        return element.url;
      });
      setUrls(list);
    } catch (e) {
      throw e;
    }
  };
  const getKeywordUrls = async () => {
    let res = null;
    try {
      res = await axios.get(`/api/keywordUrls?search=${keyword}`);
      // console.log("keywordUrls",res)
      let list = res.data.data.map((element: any) => {
        return element.url;
      });
      setKeywordUrls(list);
    } catch (e) {
      throw e;
    }
  };
  return (
    <div className={styles.container}>
      <Head>
        <title>Essay</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div>
          <label htmlFor="urls">请输入视频系列链接</label>
          <input
            id="urls"
            className={styles.input_url}
            type="text"
            placeholder="e.g. https://www.youtube.com/playlist?list=PLNYkxOF6rcIAcezfL8q0rjt13ufKseL5X"
            defaultValue={DEFAULT_VIDEO_URLS}
            onChange={urlsChange}
            required
          />
          <button onClick={getSeriesUrls}>获取视频系列链接</button>
          <>
            {urls &&
              urls.map((url, index) => {
                let keys = `url-${index}`;
                return <div key={keys}>{url}</div>;
              })}
          </>
        </div>
        <div>
          <label htmlFor="url">请输入单个视频链接</label>
          <input
            id="url"
            className={styles.input_url}
            type="text"
            placeholder="请输入网址"
            defaultValue={DEFAULT_VIDEO_URL}
            onChange={urlChange}
            required
          />
        </div>
        <div>
          <label htmlFor="search">搜索视频链接</label>
          <input
            id="search"
            className={styles.input_url}
            type="text"
            placeholder="请输入视频关键词,如：桑国演义"
            onChange={keywordChange}
          />
          <button onClick={getKeywordUrls}>搜索🔍</button>
          <>
            {keywordUrls &&
              keywordUrls.map((url, index) => {
                let keys = `keywordUrls-${index}`;
                return <div key={keys}>{url}</div>;
              })}
          </>
        </div>
        <textarea
          className={styles.input_url}
          onChange={promptChange}
          placeholder="请输入prompt,如:列出要点并附上视频时间跳转链接"
        />
        <button onClick={asyncEvent}>旧版，vercel会限制接口等待时间</button>
        <button onClick={asyncEvent2}>{(typewriterValue ? "重新生成" : "确认生成")+' 流式返回数据，点击最新版'}</button>
        <button onClick={asyncEvent3}>当作gpt使用</button>
        {essay && (
          <div className={styles.input_url}>
            <ReactMarkdown>{essay}</ReactMarkdown>
          </div>
        )}
        {typewriterValue && (
          <div className={styles.input_url}>
            <ReactMarkdown>{typewriterValue}</ReactMarkdown>
          </div>
        )}
        
      </Layout>
    </div>
  );
};

export default Essay;

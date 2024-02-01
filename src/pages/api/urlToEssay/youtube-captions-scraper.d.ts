// types/youtube-captions-scraper.d.ts
declare module 'youtube-captions-scraper' {
    export function getSubtitles(options: {
        videoID: string;
        lang?: string;
    }): Promise<CaptionsType>;
}
export interface CaptionsType{
    subtitles: CaptionsItem[];
};

export interface CaptionsItem{
    start: string;
    dur: string;
    text: string;
}
export interface getPromptTextParams {
    captains: string;
    prompt?: string;
    appendTime: boolean;
    videoUrl?: string;
  }
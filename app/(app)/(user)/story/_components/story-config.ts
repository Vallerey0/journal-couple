export const STORY_PHASES = [
  {
    key: "how_we_met",
    defaultTitle: "How We Met",
    icon: "/icon/story/how-we-met.png",
    position: "left",
  },
  {
    key: "getting_closer",
    defaultTitle: "Getting Closer",
    icon: "/icon/story/getting-closer.png",
    position: "right",
  },
  {
    key: "turning_point",
    defaultTitle: "Turning Point",
    icon: "/icon/story/turning-point.png",
    position: "left",
  },
  {
    key: "growing_together",
    defaultTitle: "Growing Together",
    icon: "/icon/story/growing-together.png",
    position: "left",
  },
  {
    key: "today",
    defaultTitle: "Today & Future",
    icon: "/icon/story/today.png",
    position: "right",
  },
] as const;

export type StoryPhaseKey = (typeof STORY_PHASES)[number]["key"];

export interface StoryData {
  id: string;
  couple_id: string;
  phase_key: StoryPhaseKey;
  title: string;
  story: string;
  story_date: string; // ISO Date (from DB date column)
}

export const STORY_PHASES = [
  {
    key: "how_we_met",
    defaultTitle: "Awal Bertemu",
    icon: "/icon/story/how-we-met.png",
    position: "left",
  },
  {
    key: "getting_closer",
    defaultTitle: "Semakin Dekat",
    icon: "/icon/story/getting-closer.png",
    position: "right",
  },
  {
    key: "turning_point",
    defaultTitle: "Titik Balik",
    icon: "/icon/story/turning-point.png",
    position: "left",
  },
  {
    key: "growing_together",
    defaultTitle: "Tumbuh Bersama",
    icon: "/icon/story/growing-together.png",
    position: "left",
  },
  {
    key: "today",
    defaultTitle: "Hari Ini & Masa Depan",
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
  story_date: string | null; // ISO Date (from DB date column)
  image_url?: string | null; // R2 key or full URL
  is_visible?: boolean;
}

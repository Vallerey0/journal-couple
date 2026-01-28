import { Metadata } from "next";
import { getStoryPhases } from "@/lib/stories/queries";
import { StoryTimeline } from "./_components/story-timeline";

export const metadata: Metadata = {
  title: "Our Story",
  description: "The timeline of our journey together.",
};

export default async function StoryPage() {
  const storyData = await getStoryPhases();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="pt-8 px-6 text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Our Journey</h1>
        <p className="text-sm text-muted-foreground">
          Every step of our story, woven together.
        </p>
      </div>

      <StoryTimeline initialData={storyData} />
    </div>
  );
}

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
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 pt-8 px-6 text-center space-y-2">
        <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
          Our Journey
        </h1>
        <p className="text-sm text-muted-foreground">
          Every step of our story, woven together.
        </p>
      </div>

      <div className="relative z-10 pb-20">
        <StoryTimeline initialData={storyData} />
      </div>
    </div>
  );
}

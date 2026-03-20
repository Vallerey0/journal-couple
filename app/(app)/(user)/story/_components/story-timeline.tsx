"use client";

import { useState } from "react";
import { getPublicMediaUrl } from "@/lib/media/url";
import { STORY_PHASES, StoryData, StoryPhaseKey } from "./story-config";
import { StoryNode } from "./story-node";
import { RopePath } from "./rope-path";
import { StorySheet } from "./story-sheet";

interface StoryTimelineProps {
  initialData: StoryData[];
}

export function StoryTimeline({ initialData }: StoryTimelineProps) {
  const [selectedPhase, setSelectedPhase] = useState<StoryPhaseKey | null>(
    null,
  );
  const [sheetMode, setSheetMode] = useState<"preview" | "edit" | undefined>(
    undefined,
  );

  const selectedConfig = STORY_PHASES.find((p) => p.key === selectedPhase);
  const selectedData = initialData.find((d) => d.phase_key === selectedPhase);

  const handleNodeClick = (phaseKey: StoryPhaseKey) => {
    setSheetMode(undefined); // Let StorySheet decide (Preview if data exists)
    setSelectedPhase(phaseKey);
  };

  return (
    <div className="relative w-full max-w-md mx-auto py-12 px-4 min-h-[800px]">
      {/* Background Rope */}
      <RopePath />

      {/* Nodes */}
      <div className="relative z-10 space-y-24 pt-20">
        {STORY_PHASES.map((phase, index) => {
          const data = initialData.find((d) => d.phase_key === phase.key);
          const iconSrc = (() => {
            const raw = data?.image_url;
            if (!raw) return phase.icon;
            if (raw.startsWith("http") || raw.startsWith("/")) return raw;
            try {
              return getPublicMediaUrl(raw) ?? phase.icon;
            } catch {
              return phase.icon;
            }
          })();

          // Manual offsets to match the S-curve
          const offsets = [
            -25, // Top (How We Met)
            -80, // Left Curve Peak
            0, // Middle (Center)
            80, // Right Curve Peak
            0, // Bottom (Center)
          ];

          return (
            <StoryNode
              key={phase.key}
              index={index}
              title={data?.title || phase.defaultTitle}
              icon={iconSrc}
              position={phase.position as "left" | "right"}
              data={data}
              onClick={() => handleNodeClick(phase.key)}
              xOffset={offsets[index]}
              priority={index === 0}
            />
          );
        })}
      </div>

      {/* Edit Sheet */}
      {selectedPhase && selectedConfig && (
        <StorySheet
          key={selectedPhase}
          open={!!selectedPhase}
          onOpenChange={(open) => !open && setSelectedPhase(null)}
          phaseKey={selectedPhase}
          title={selectedData?.title || selectedConfig.defaultTitle}
          defaultData={selectedData}
          initialMode={sheetMode}
        />
      )}
    </div>
  );
}

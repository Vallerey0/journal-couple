"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import filmRollSvg from "./film-roll.svg";

export type StoryPhase = {
  id?: string;
  phase_key: string;
  title?: string | null;
  story?: string | null;
  story_date?: string | null;
  is_visible?: boolean | null;
  image_url?: string | null;
};

export function formatPhaseKey(phaseKey: string) {
  return phaseKey.replaceAll("_", " ");
}

export function normalizeStoryImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
    return imageUrl;
  const base = process.env.NEXT_PUBLIC_R2_DOMAIN;
  if (!base) return imageUrl;
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = imageUrl.replace(/^\//, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function formatStoryDate(value?: string | null) {
  if (!value) return null;
  const datePart = value.includes("T") ? value.split("T")[0] : value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return value;
  const [, yyyy, mm, dd] = match;
  return `${dd}-${mm}-${yyyy}`;
}

function hasDbStory(phase: StoryPhase) {
  const hasId = !!phase.id;
  const hasStory = typeof phase.story === "string" && phase.story.trim() !== "";
  const hasDate = !!phase.story_date;
  const hasImage = !!phase.image_url;
  return hasId || hasStory || hasDate || hasImage;
}

function storyIconSrc(phaseKey: string) {
  const slug = phaseKey.replaceAll("_", "-");
  return `/icon/story/${slug}.png`;
}

export const DEFAULT_STORY_PHASES: StoryPhase[] = [
  {
    phase_key: "how_we_met",
    title: "How we met",
    story: null,
    image_url: null,
    is_visible: true,
  },
  {
    phase_key: "getting_closer",
    title: "Getting closer",
    story: null,
    image_url: null,
    is_visible: true,
  },
  {
    phase_key: "turning_point",
    title: "Turning point",
    story: null,
    image_url: null,
    is_visible: true,
  },
  {
    phase_key: "growing_together",
    title: "Growing together",
    story: null,
    image_url: null,
    is_visible: true,
  },
  {
    phase_key: "today",
    title: "Today",
    story: null,
    image_url: null,
    is_visible: true,
  },
];

export function mergeStoryPhases(phases?: StoryPhase[]) {
  const input = phases || [];
  const byKey = new Map(input.map((p) => [p.phase_key, p]));

  const merged = DEFAULT_STORY_PHASES.map((base) => ({
    ...base,
    ...(byKey.get(base.phase_key) || {}),
  }));

  const extras = input.filter(
    (p) => !DEFAULT_STORY_PHASES.some((d) => d.phase_key === p.phase_key),
  );

  return extras.length > 0 ? [...merged, ...extras] : merged;
}

export function BookPage({
  phase,
  className,
}: {
  phase?: StoryPhase;
  className?: string;
}) {
  const imageUrl = normalizeStoryImageUrl(phase?.image_url);
  const title = (phase?.title || formatPhaseKey(phase?.phase_key || "")).trim();
  const story =
    typeof phase?.story === "string"
      ? phase.story.trim()
      : (phase?.story ?? "");
  const hasStory = phase ? hasDbStory(phase) : false;
  const fallbackIcon = phase?.phase_key ? storyIconSrc(phase.phase_key) : null;
  const formattedDate = formatStoryDate(phase?.story_date);

  return (
    <div className={className}>
      <div
        className="
relative w-full h-full overflow-hidden flex flex-col
top-[-9%] left-[-10%]
rounded-[10px]

pl-[clamp(9px,1.6vw,14px)]
pr-[clamp(40px,5vw,64px)]
py-[clamp(4px,1.2vw,14px)]

transform-gpu
"
      >
        {hasStory && (
          <>
            <div className="flex flex-col">
              {(imageUrl || fallbackIcon) && (
                <div className="flex justify-start">
                  <div className="relative rotate-[-6deg] drop-shadow-md">
                    <div className="bg-white p-[6px] pb-[5px] border border-black/10">
                      <div className="relative w-[58px] h-[58px] md:w-[76px] md:h-[76px] overflow-hidden bg-zinc-100">
                        <Image
                          src={imageUrl || fallbackIcon!}
                          alt={title || "Story image"}
                          fill
                          sizes="(max-width: 768px) 70px, 90px"
                          draggable={false}
                          className="object-cover pointer-events-none select-none"
                        />
                      </div>
                      <div className="mt-1 h-[6px] md:h-[8px] bg-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="min-w-0 text-center mt-1 md:mt-2">
                <div className="text-[10px] md:text-lg font-semibold text-pink-900 line-clamp-2">
                  {title}
                </div>
                {formattedDate && (
                  <div className="mt-0.5 text-[7px] md:text-xs text-pink-900/60 line-clamp-1">
                    {formattedDate}
                  </div>
                )}
              </div>
            </div>

            {story && (
              <div className="mt-2 max-h-[55%] md:max-h-[60%] overflow-y-auto touch-pan-y [-webkit-overflow-scrolling:touch] pr-1 text-[8px] md:text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap text-justify [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {story}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AutoMarquee({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [distancePx, setDistancePx] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    const span = textRef.current;
    if (!el || !span) return;

    const measure = () => {
      const containerWidth = el.clientWidth;
      const textWidth = span.scrollWidth;
      const overflow = textWidth > containerWidth + 2;
      setIsOverflowing(overflow);

      if (!overflow) {
        setDistancePx(0);
        setDurationSec(0);
        return;
      }

      const gap = Math.max(24, Math.floor(containerWidth * 0.25));
      const distance = textWidth + gap;
      setDistancePx(distance);
      setDurationSec(Math.max(7, distance / 28));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(span);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={["overflow-hidden", className].join(" ")}
    >
      {isOverflowing ? (
        <div
          className="inline-flex whitespace-nowrap"
          style={
            {
              ["--marquee-distance"]: `${distancePx}px`,
              ["--marquee-duration"]: `${durationSec}s`,
              animation: "marquee var(--marquee-duration) linear infinite",
              willChange: "transform",
            } as React.CSSProperties
          }
        >
          <span ref={textRef} className="inline-block">
            {text}
          </span>
          <span className="inline-block pl-8">{text}</span>
        </div>
      ) : (
        <span ref={textRef} className="block whitespace-nowrap">
          {text}
        </span>
      )}

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-1 * var(--marquee-distance)));
          }
        }
      `}</style>
    </div>
  );
}

export function FilmRoll({
  phases,
  selectedPhaseKey,
  onSelect,
  className,
}: {
  phases: StoryPhase[];
  selectedPhaseKey?: string;
  onSelect: (phaseKey: string) => void;
  className?: string;
}) {
  const items = useMemo(() => {
    const visible = phases.filter((p) => (p.is_visible ?? true) !== false);
    return visible.length > 0 ? visible : phases;
  }, [phases]);

  const loopItems = useMemo(() => {
    const make = (copy: number) =>
      items.map((phase, baseIndex) => ({
        key: `${copy}-${phase.phase_key}-${baseIndex}`,
        phase,
        baseIndex,
        copy,
      }));

    if (items.length <= 1) return make(0);
    return [...make(0), ...make(1), ...make(2)];
  }, [items]);

  const maskRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const oneHeightRef = useRef(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const speedPxPerSec = items.length > 3 ? 6 : 0;
    if (speedPxPerSec <= 0) return;

    let rafId = 0;
    let last = performance.now();

    const applyTransform = () => {
      const track = trackRef.current;
      if (!track) return;
      track.style.transform = `translate3d(0, ${-offsetRef.current}px, 0)`;
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 48);
      const one = oneHeightRef.current;
      if (one > 0) {
        offsetRef.current += (dt * speedPxPerSec) / 1000;
        if (items.length > 1 && offsetRef.current >= one * 2) {
          offsetRef.current -= one;
        }
        applyTransform();
      }

      last = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [items.length]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const applyTransform = () => {
      const t = trackRef.current;
      if (!t) return;
      t.style.transform = `translate3d(0, ${-offsetRef.current}px, 0)`;
    };

    const measure = () => {
      const total = track.scrollHeight;
      if (total <= 0) return;
      const one = items.length > 1 ? total / 3 : total;
      oneHeightRef.current = one;

      if (items.length <= 1) {
        offsetRef.current = 0;
        applyTransform();
        return;
      }

      offsetRef.current = one;
      const firstStoryIndex = items.findIndex((p) => hasDbStory(p));
      if (firstStoryIndex >= 0) {
        const node = track.querySelector<HTMLElement>(
          `[data-roll-copy="1"][data-roll-base="${firstStoryIndex}"]`,
        );
        if (node) offsetRef.current = Math.max(0, node.offsetTop - 4);
      }

      applyTransform();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    if (maskRef.current) ro.observe(maskRef.current);
    return () => ro.disconnect();
  }, [items]);

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute left-1/2 top-[-10px] -translate-x-1/2 z-40 w-[72%] h-[18px] rotate-[-6deg] rounded-sm bg-white/70 shadow-sm" />

        <div className="relative w-full aspect-[120/360]">
          <Image
            src={filmRollSvg}
            alt=""
            fill
            sizes="220px"
            draggable={false}
            className="pointer-events-none select-none z-0 object-fill"
          />

          <div className="absolute top-[7%] bottom-[7%] left-[18%] right-[18%] overflow-hidden z-10">
            <div
              ref={maskRef}
              className="h-full w-full overflow-hidden touch-pan-y"
              style={{ touchAction: "pan-y" }}
            >
              <div
                ref={trackRef}
                className="flex flex-col pt-[2%] will-change-transform"
              >
                {loopItems.map(({ key, phase: p, baseIndex, copy }) => {
                  const imageUrl = normalizeStoryImageUrl(p.image_url);
                  const hasStory = hasDbStory(p);
                  const fallbackIcon = storyIconSrc(p.phase_key);
                  const title = hasStory
                    ? (p.title || formatPhaseKey(p.phase_key)).trim()
                    : "";
                  const isSelected = selectedPhaseKey === p.phase_key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onSelect(p.phase_key)}
                      data-roll-copy={copy}
                      data-roll-base={baseIndex}
                      className={[
                        "relative w-full aspect-[4/3] mb-4 md:mb-5 last:mb-0 rounded-[10px] overflow-hidden border touch-pan-y touch-manipulation",
                        isSelected
                          ? "border-white/45 ring-1 ring-white/25"
                          : "border-white/20",
                        imageUrl || hasStory ? "" : "bg-white/10",
                      ].join(" ")}
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={title || "Story"}
                          fill
                          sizes="180px"
                          draggable={false}
                          className="object-cover pointer-events-none select-none"
                        />
                      ) : hasStory ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-200/40 to-zinc-100/20" />
                          <Image
                            src={fallbackIcon}
                            alt={title || "Story"}
                            fill
                            sizes="180px"
                            draggable={false}
                            className="object-cover pointer-events-none select-none"
                          />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-white/10" />
                      )}
                      {hasStory && (
                        <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-black/35 text-white text-[10px] leading-tight">
                          <AutoMarquee
                            text={title}
                            className="font-medium text-center"
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

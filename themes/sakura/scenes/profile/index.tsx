"use client";

import React from "react";
import Image, { type StaticImageData } from "next/image";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";

import envelopeOpen from "./envelope-open.png";
import paperPartners from "./paper-partners.png";
import paperAnniversary from "./paper-anniversary.png";
import sakuraImg from "./sakura.png";
import coupleGif from "./couple.gif";
import frameMale from "./profile-male.png";
import frameFemale from "./profile-female.png";

import flowerBottom from "../../assets/flower-envelope-top.png";
import flowerTop from "../../assets/flower-envelope-bottom.png";

import { getPublicMediaUrl } from "@/lib/media/url";

type ProfileData = {
  relationship_start_date: string;
  male_name: string;
  female_name: string;
  male_nickname?: string | null;
  female_nickname?: string | null;
  male_birth_date?: string | null;
  female_birth_date?: string | null;
  male_zodiac?: string | null;
  female_zodiac?: string | null;
  male_city?: string | null;
  female_city?: string | null;
  male_hobby?: string | null;
  female_hobby?: string | null;
  male_photo_url?: string | null;
  female_photo_url?: string | null;
};

interface ProfileProps {
  data: ProfileData;
}

const PhotoFrame = ({
  frame,
  photo,
  alt,
}: {
  frame: StaticImageData;
  photo: string | null;
  alt: string;
}) => (
  <div className="relative w-full drop-shadow-[0_4px_4px_rgba(0,0,0,0.45)]">
    {/* FOTO */}
    {photo && (
      <div className="absolute inset-1.5 pt-[2%] pl-[16%] pr-[10%] pb-[9%] z-0">
        <div className="relative w-full h-full overflow-hidden rounded-sm">
          <Image src={photo} alt={alt} fill className="object-fill" />
        </div>
      </div>
    )}

    {/* FRAME */}
    <Image
      src={frame}
      alt="frame"
      className="relative w-full h-auto z-10 pointer-events-none"
    />
  </div>
);

export default function SakuraProfile({ data }: ProfileProps) {
  const malePhoto = data.male_photo_url
    ? getPublicMediaUrl(data.male_photo_url)
    : null;

  const femalePhoto = data.female_photo_url
    ? getPublicMediaUrl(data.female_photo_url)
    : null;

  const today = new Date();
  const startDate = new Date(data.relationship_start_date);

  const togetherDays = differenceInDays(today, startDate);
  const togetherSince = format(startDate, "yyyy");

  const nextAnniversary = new Date(
    today.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );

  if (nextAnniversary < today)
    nextAnniversary.setFullYear(today.getFullYear() + 1);

  const daysUntilAnniversary = differenceInDays(nextAnniversary, today);

  return (
    <div className="relative min-h-svh w-full overflow-x-clip flex justify-center px-2 pt-6 pb-24 md:py-24">
      <div className="absolute inset-0 pointer-events-none z-40">
        <motion.div
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1, rotate: [0, 2, -1, 1.5, 0] }}
          transition={{
            x: { duration: 1.5, ease: "easeOut" },
            opacity: { duration: 1.5 },
            rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute top-0 right-[-30px] md:right-[-60px] w-44 md:w-80 drop-shadow-[0_4px_4px_rgba(0,0,0,0.45)]"
          style={{ transformOrigin: "top right" }}
        >
          <Image
            src={sakuraImg}
            alt="sakura"
            className="w-full h-auto scale-x-[-1]"
          />
        </motion.div>

        {/* Bottom Left - Slide from Left to Right */}
        <motion.div
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1, rotate: [1, -1.5, 1, -2, 0] }}
          transition={{
            x: { duration: 1.5, ease: "easeOut" },
            opacity: { duration: 1.5 },
            rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-0 left-[-30px] md:left-[-60px] w-44 md:w-80 drop-shadow-[0_4px_4px_rgba(0,0,0,0.45)]"
          style={{ transformOrigin: "bottom left" }}
        >
          <Image src={sakuraImg} alt="sakura" className="w-full h-auto" />
        </motion.div>
      </div>

      {/* MAIN POSTER CONTAINER */}
      <div
        className="
        relative
        w-full
        max-w-[420px]
        md:max-w-[850px]
        flex
        flex-col
        items-center
        z-10
        "
      >
        {/* ======== SECTION 1: ENVELOPE WITH FLOWERS ======== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative w-full scale-[1.15] md:scale-100 z-20 drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]"
        >
          {/* Flower decoration - bottom right of envelope */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
            className="absolute -bottom-[-1%] -right-[-10%] w-[40%] z-30 pointer-events-none drop-shadow-[0_3px_3px_rgba(0,0,0,0.4)]"
          >
            <Image src={flowerTop} alt="flower" className="w-full h-auto" />
          </motion.div>

          <Image
            src={envelopeOpen}
            alt="envelope"
            className="w-full h-auto relative z-10"
          />

          {/* Flower decoration - top left of envelope */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            className="absolute -top-[-20%] -left-[-5%] w-[40%] z-30 pointer-events-none rotate-[-15deg] drop-shadow-[0_3px_3px_rgba(0,0,0,0.4)]"
          >
            <Image src={flowerBottom} alt="flower" className="w-full h-auto" />
          </motion.div>

          <div className="absolute inset-0 flex flex-col items-center justify-center -mt-[10%] md:-mt-[10%] z-20 px-[15%]">
            <h2 className="font-great-vibes text-[5vw] md:text-3xl text-pink-900 leading-tight text-center line-clamp-1">
              {data.male_name}
            </h2>

            <span className="text-pink-800 text-[3vw] md:text-xl">&</span>

            <h2 className="font-great-vibes text-[5vw] md:text-3xl text-pink-900 leading-tight text-center line-clamp-1">
              {data.female_name}
            </h2>
          </div>
        </motion.div>

        {/* ======== SECTION 2: PHOTOS ======== */}
        <div className="relative w-full -mt-[30%] md:-mt-[20%] z-20 pl-[2%]">
          <div className="flex items-start w-full">
            {/* MALE - left, slightly higher */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="w-[55%] md:w-[50%] -mr-[12%] relative z-10 rotate-[-5deg] md:rotate-[-3deg]"
            >
              <PhotoFrame frame={frameMale} photo={malePhoto} alt="male" />
            </motion.div>

            {/* FEMALE - right, lower and overlapping */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
              className="w-[55%] md:w-[50%] -ml-[6%] mt-[8%] relative z-20 rotate-[4deg] md:rotate-[3deg]"
            >
              <PhotoFrame
                frame={frameFemale}
                photo={femalePhoto}
                alt="female"
              />
            </motion.div>
          </div>
        </div>

        {/* ======== SECTION 3: BOTTOM CONTENT ======== */}
        <div className="relative w-full scale-[1.15] md:scale-[1.3] -mt-[15%] z-30">
          {/* --- MOBILE LAYOUT: Two-column scrapbook --- */}
          <div className="md:hidden relative w-full">
            <div className="flex items-start w-full">
              {/* LEFT COLUMN: Anniversary Paper + Chibi */}
              <div className="flex flex-col items-center w-[55%] relative z-20">
                {/* Anniversary Paper */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
                  className="relative w-full rotate-[-20deg] drop-shadow-[0_5px_5px_rgba(0,0,0,0.4)]"
                >
                  <Image
                    src={paperAnniversary}
                    alt="paper"
                    className="w-full h-auto mr-[-40%]"
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-start pt-[14%] text-center px-[10%]">
                    <div className="flex gap-0.5 items-end">
                      <span className="text-[5.5vw] font-bold text-amber-900 leading-none">
                        {togetherDays}
                      </span>
                      <span className="text-[2.2vw] text-amber-700 uppercase font-bold">
                        Days
                      </span>
                    </div>

                    <p className="text-[1.8vw] text-amber-700 mb-[3%]">
                      Together since {togetherSince}
                    </p>

                    <div className="mb-[0%]">
                      <p className="text-[2.2vw] italic text-amber-900">
                        Menuju Hari Bahagia
                      </p>
                      <p className="text-[2.8vw] font-bold text-amber-900 leading-tight">
                        Anniversary Tunangan
                      </p>
                    </div>

                    <div className="flex gap-0.5 items-center text-amber-700">
                      <span className="text-[2.2vw]">✦</span>
                      <span className="font-bold text-[5vw] text-amber-900">
                        {daysUntilAnniversary}
                      </span>
                      <span className="text-[2.2vw] uppercase font-bold">
                        Hari Lagi
                      </span>
                      <span className="text-[2.2vw]">✦</span>
                    </div>
                  </div>
                </motion.div>

                {/* Chibi - below anniversary */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 1.1, ease: "easeOut" }}
                  className="w-[60%] -mt-[4%] self-start ml-[15%]"
                >
                  <Image
                    src={coupleGif}
                    alt="couple"
                    className="w-full h-auto"
                  />
                </motion.div>
              </div>

              {/* RIGHT COLUMN: Profile Paper */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
                className="w-[50%] -ml-[15%] mt-[2%] relative z-30 drop-shadow-[0_5px_5px_rgba(0,0,0,0.4)]"
              >
                <Image
                  src={paperPartners}
                  alt="paper"
                  className="w-full h-auto"
                />

                <div className="absolute inset-0 pl-[20%] pr-[6%] pt-[28%] text-center">
                  {/* Names header */}
                  <div className="grid grid-cols-2 gap-1 mb-[2%] mr-[15%]">
                    <div className="text-center">
                      <h3 className="font-bold text-pink-900 text-[3vw] leading-tight">
                        {data.male_nickname || "Sayang"}
                      </h3>
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-pink-900 text-[3vw] leading-tight">
                        {data.female_nickname || "Babe"}
                      </h3>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 px-[2%] mb-[20%]">
                    {/* Male details */}
                    <div className="space-y-0.5 text-[2.2vw] text-pink-800 text-left">
                      <p className="flex items-center gap-0.5 truncate">
                        <span className="text-[2.2vw]">📅</span>
                        {data.male_birth_date
                          ? format(new Date(data.male_birth_date), "dd MMMM")
                          : "-"}
                      </p>
                      <p className="flex items-center gap-0.5 truncate">
                        <span className="text-[2.2vw]">♓</span>
                        {data.male_zodiac || "Pisces"}
                      </p>
                      <p className="flex items-center gap-0.5 truncate">
                        <span className="text-[2.2vw]">📍</span>
                        {data.male_city || "-"}
                      </p>
                    </div>

                    {/* Female details */}
                    <div className="space-y-0.5 text-[2.2vw] text-pink-800 text-left pl-[10%]">
                      <p className="flex items-center gap-0.5 truncate">
                        <span className="text-[2.2vw]">📅</span>
                        {data.female_birth_date
                          ? format(new Date(data.female_birth_date), "dd MMMM")
                          : "-"}
                      </p>
                      <p className="flex items-center gap-0.5 truncate">
                        <span className="text-[2.2vw]">♓</span>
                        {data.female_zodiac || "Pisces"}
                      </p>
                      <p className="flex items-center gap-0.5 truncate">
                        <span className="text-[2.2vw]">📍</span>
                        {data.female_city || "-"}
                      </p>
                    </div>
                  </div>

                  {/* HOBBY SECTION */}
                  <div className="mt-[6%] pt-[4%] pr-[20%]">
                    <p className="text-[2.5vw] uppercase font-bold text-pink-900 mb-[3%]">
                      ✦ Hobby ✦
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      <p className="text-[2vw] text-pink-700 italic leading-relaxed">
                        {data.male_hobby || "-"}
                      </p>
                      <p className="text-[2vw] text-pink-700 italic leading-relaxed">
                        {data.female_hobby || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* --- DESKTOP LAYOUT --- */}
          <div className="hidden md:flex flex-col items-center gap-8 mt-4">
            <div className="flex items-start justify-center gap-6 w-full">
              {/* Left column: Anniversary Paper + Chibi */}
              <div className="flex flex-col items-center w-[45%]">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
                  className="relative w-full rotate-[-6deg] drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]"
                >
                  <Image
                    src={paperAnniversary}
                    alt="paper"
                    className="w-full h-auto"
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-start pt-[14%] text-center px-[10%]">
                    <div className="flex gap-1 items-end">
                      <span className="text-5xl font-bold text-amber-900 leading-none">
                        {togetherDays}
                      </span>
                      <span className="text-sm text-amber-700 uppercase font-bold">
                        Days
                      </span>
                    </div>

                    <p className="text-[10px] text-amber-700 mb-4">
                      Together since {togetherSince}
                    </p>

                    <div className="mb-4">
                      <p className="text-sm italic text-amber-900">
                        Menuju Hari Bahagia
                      </p>
                      <p className="text-lg font-bold text-amber-900 leading-tight">
                        Anniversary Tunangan
                      </p>
                    </div>

                    <div className="flex gap-1 items-center text-amber-700">
                      <span className="text-lg">✦</span>
                      <span className="font-bold text-4xl text-amber-900">
                        {daysUntilAnniversary}
                      </span>
                      <span className="text-sm uppercase font-bold">
                        Hari Lagi
                      </span>
                      <span className="text-lg">✦</span>
                    </div>
                  </div>
                </motion.div>

                {/* Chibi below anniversary */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 1.1, ease: "easeOut" }}
                  className="w-[55%] -mt-4"
                >
                  <Image
                    src={coupleGif}
                    alt="couple"
                    className="w-full h-auto"
                  />
                </motion.div>
              </div>

              {/* Right column: Profile Paper */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
                className="relative w-[50%] mt-4 drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]"
              >
                <Image
                  src={paperPartners}
                  alt="paper"
                  className="w-full h-auto"
                />

                <div className="absolute inset-0 px-20 pt-36 text-center">
                  <div className="grid grid-cols-2 gap-10">
                    {/* MALE PROFILE */}
                    <div className="flex flex-col items-center">
                      <h3 className="font-bold text-pink-900 text-2xl leading-tight">
                        {data.male_nickname || "Sayang"}
                      </h3>
                      <div className="space-y-2.5 text-base text-pink-800 text-left w-full mt-2">
                        <p className="flex items-center gap-2 truncate">
                          <span className="text-lg">📅</span>
                          {data.male_birth_date
                            ? format(new Date(data.male_birth_date), "dd MMMM")
                            : "-"}
                        </p>
                        <p className="flex items-center gap-2 truncate">
                          <span className="text-lg">♓</span>
                          {data.male_zodiac || "Pisces"}
                        </p>
                        <p className="flex items-center gap-2 truncate">
                          <span className="text-lg">📍</span>
                          {data.male_city || "-"}
                        </p>
                      </div>
                    </div>

                    {/* FEMALE PROFILE */}
                    <div className="flex flex-col items-center">
                      <h3 className="font-bold text-pink-900 text-2xl leading-tight">
                        {data.female_nickname || "Babe"}
                      </h3>
                      <div className="space-y-2.5 text-base text-pink-800 text-left w-full mt-2">
                        <p className="flex items-center gap-2 truncate">
                          <span className="text-lg">📅</span>
                          {data.female_birth_date
                            ? format(
                                new Date(data.female_birth_date),
                                "dd MMMM",
                              )
                            : "-"}
                        </p>
                        <p className="flex items-center gap-2 truncate">
                          <span className="text-lg">♓</span>
                          {data.female_zodiac || "Pisces"}
                        </p>
                        <p className="flex items-center gap-2 truncate">
                          <span className="text-lg">📍</span>
                          {data.female_city || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* HOBBY SECTION */}
                  <div className="mt-14 pt-8 border-t border-pink-300/30">
                    <p className="text-base uppercase font-bold text-pink-900 mb-5 tracking-widest">
                      ✦ Hobby ✦
                    </p>
                    <div className="grid grid-cols-2 gap-8">
                      <p className="text-base text-pink-700 italic leading-relaxed">
                        {data.male_hobby || "-"}
                      </p>
                      <p className="text-base text-pink-700 italic leading-relaxed">
                        {data.female_hobby || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="h-24 md:h-0" />
      </div>
    </div>
  );
}

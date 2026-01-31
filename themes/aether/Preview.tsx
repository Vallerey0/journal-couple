"use client";

import React from "react";
import { differenceInDays, format } from "date-fns";
import { id } from "date-fns/locale";
import { motion } from "framer-motion";
import { Heart, MapPin, Calendar, Star, Music } from "lucide-react";

type CoupleData = {
  male_name: string;
  female_name: string;
  male_nickname?: string;
  female_nickname?: string;
  male_birth_date?: string;
  female_birth_date?: string;
  male_city?: string;
  female_city?: string;
  male_hobby?: string;
  female_hobby?: string;
  relationship_start_date: string;
  anniversary_note?: string;
  notes?: string;
  show_age?: boolean;
  show_zodiac?: boolean;
};

export default function AetherPreview({ data }: { data: CoupleData }) {
  const startDate = new Date(data.relationship_start_date);
  const daysTogether = differenceInDays(new Date(), startDate);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-slate-800 font-sans selection:bg-blue-100">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-3xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center space-y-12"
      >
        {/* HERO SECTION */}
        <motion.div variants={item} className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-4 text-2xl md:text-4xl font-serif text-blue-900">
            <span>{data.male_nickname || data.male_name}</span>
            <Heart className="w-6 h-6 md:w-8 md:h-8 text-rose-500 fill-rose-500 animate-pulse" />
            <span>{data.female_nickname || data.female_name}</span>
          </div>
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100/50 text-blue-700 text-sm font-medium tracking-wide border border-blue-200">
            Since {format(startDate, "d MMMM yyyy", { locale: id })}
          </div>
        </motion.div>

        {/* COUNTER */}
        <motion.div variants={item} className="text-center">
          <div className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tabular-nums">
            {daysTogether}
          </div>
          <p className="text-slate-500 font-medium tracking-widest uppercase text-sm mt-2">
            Days of Loving You
          </p>
        </motion.div>

        {/* QUOTE / NOTE */}
        {(data.anniversary_note || data.notes) && (
          <motion.div
            variants={item}
            className="max-w-xl text-center space-y-4"
          >
            {data.anniversary_note && (
              <blockquote className="text-lg md:text-xl font-serif italic text-slate-700 leading-relaxed">
                "{data.anniversary_note}"
              </blockquote>
            )}
            {data.notes && (
              <p className="text-slate-500 text-sm leading-relaxed">
                {data.notes}
              </p>
            )}
          </motion.div>
        )}

        {/* PROFILES */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl mt-8"
        >
          {/* MALE PROFILE */}
          <ProfileCard
            name={data.male_name}
            birthDate={data.male_birth_date}
            city={data.male_city}
            hobby={data.male_hobby}
            iconColor="text-blue-500"
            bgColor="bg-blue-50/50"
          />

          {/* FEMALE PROFILE */}
          <ProfileCard
            name={data.female_name}
            birthDate={data.female_birth_date}
            city={data.female_city}
            hobby={data.female_hobby}
            iconColor="text-rose-500"
            bgColor="bg-rose-50/50"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

function ProfileCard({
  name,
  birthDate,
  city,
  hobby,
  iconColor,
  bgColor,
}: {
  name: string;
  birthDate?: string;
  city?: string;
  hobby?: string;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl border border-slate-100 ${bgColor} space-y-4 transition-all hover:shadow-md`}
    >
      <h3 className="font-bold text-lg text-slate-800">{name}</h3>

      <div className="space-y-3 text-sm text-slate-600">
        {birthDate && (
          <div className="flex items-center space-x-3">
            <Calendar className={`w-4 h-4 ${iconColor}`} />
            <span>
              {format(new Date(birthDate), "d MMMM yyyy", { locale: id })}
            </span>
          </div>
        )}

        {city && (
          <div className="flex items-center space-x-3">
            <MapPin className={`w-4 h-4 ${iconColor}`} />
            <span>{city}</span>
          </div>
        )}

        {hobby && (
          <div className="flex items-center space-x-3">
            <Star className={`w-4 h-4 ${iconColor}`} />
            <span>{hobby}</span>
          </div>
        )}
      </div>
    </div>
  );
}

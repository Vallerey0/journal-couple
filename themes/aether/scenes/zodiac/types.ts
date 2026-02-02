import { ZodiacTrait } from "./lib/zodiac-data";

export interface ZodiacSign {
  name: string;
  date_range: string;
}

export interface HoroscopeResponse {
  date_range: string;
  current_date: string;
  description: string;
  compatibility: string;
  mood: string;
  color: string;
  lucky_number: string;
  lucky_time: string;
}

export interface ZodiacData {
  sign: string;
  horoscope: string;
  traits?: ZodiacTrait; // Added to support new engine data while keeping UI compatible
}

export interface CoupleHoroscope {
  date: string;
  male: ZodiacData;
  female: ZodiacData;
  compatibility_percent: number;
  summary: string;
}

export interface ZodiacSceneProps {
  male_birthdate: string;
  female_birthdate: string;
  male_name: string;
  female_name: string;
}

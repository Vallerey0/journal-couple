import { NextResponse } from "next/server";
import { getZodiacSignFromDate } from "../lib/zodiac-range";
import { zodiacData } from "../lib/zodiac-data";
import { getDailyEnergy } from "../lib/daily-energy";
import { getCompatibility } from "../lib/compatibility";
import { generateHoroscope, generateCoupleSummary } from "../lib/generator";
import { CoupleHoroscope } from "../types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { male_birthdate, female_birthdate } = body;

    if (!male_birthdate || !female_birthdate) {
      return NextResponse.json(
        { error: "Birthdates required" },
        { status: 400 },
      );
    }

    // 1. Determine Signs
    const maleSign = getZodiacSignFromDate(male_birthdate);
    const femaleSign = getZodiacSignFromDate(female_birthdate);

    // 2. Get Static Data
    const maleData = zodiacData[maleSign];
    const femaleData = zodiacData[femaleSign];

    if (!maleData || !femaleData) {
      return NextResponse.json(
        { error: "Invalid zodiac data" },
        { status: 500 },
      );
    }

    // Determine Birth Month (for MonthVariation)
    const maleMonth = parseInt(male_birthdate.split("-")[1], 10);
    const femaleMonth = parseInt(female_birthdate.split("-")[1], 10);

    const maleVariation = maleData.monthVariations.find(
      (v) => v.monthId === maleMonth,
    );
    const femaleVariation = femaleData.monthVariations.find(
      (v) => v.monthId === femaleMonth,
    );

    // 3. Get Daily Energy (Deterministic based on Date + Sign)
    const today = new Date().toISOString().split("T")[0];
    const maleEnergy = getDailyEnergy(today, maleSign);
    const femaleEnergy = getDailyEnergy(today, femaleSign);

    // 4. Generate Individual Horoscopes
    const maleHoroscope = generateHoroscope(
      maleData,
      {
        mood: maleEnergy.dailyMood,
        theme: maleEnergy.monthlyTheme,
        luckyColor: maleEnergy.luckyColor,
        cosmicAspect: maleEnergy.cosmicAspect,
      },
      maleVariation,
    );

    const femaleHoroscope = generateHoroscope(
      femaleData,
      {
        mood: femaleEnergy.dailyMood,
        theme: femaleEnergy.monthlyTheme,
        luckyColor: femaleEnergy.luckyColor,
        cosmicAspect: femaleEnergy.cosmicAspect,
      },
      femaleVariation,
    );

    // 5. Calculate Compatibility
    const compatibility = getCompatibility(maleSign, femaleSign, today);

    // 6. Generate Couple Summary (Rich Narrative)
    const summary = generateCoupleSummary(
      maleData,
      femaleData,
      {
        percent: compatibility.percent,
        status: compatibility.status,
      },
      maleVariation,
      femaleVariation,
    );

    // 7. Construct Response with DD-MM-YYYY Date Format
    const [year, month, day] = today.split("-");
    const formattedDate = `${day}-${month}-${year}`;

    const response: CoupleHoroscope = {
      date: formattedDate,
      male: {
        sign: maleData.name,
        horoscope: maleHoroscope,
        traits: maleData.traits,
      },
      female: {
        sign: femaleData.name,
        horoscope: femaleHoroscope,
        traits: femaleData.traits,
      },
      compatibility_percent: compatibility.percent,
      summary: summary,
    };

    // 8. Return with Cache Headers
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Zodiac Engine Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

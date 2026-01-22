import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnniversaryCountdown } from "./anniversary-countdown";
import { CoupleAvatar } from "./couple-avatar";
import { Heart, CalendarDays, MapPin, Sparkles, Lock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */
type RelationshipStage = "dating" | "engaged" | "married";

type Couple = {
  male_name: string;
  female_name: string;

  male_nickname?: string | null;
  female_nickname?: string | null;

  male_birth_date?: string | null;
  female_birth_date?: string | null;

  male_city?: string | null;
  female_city?: string | null;

  male_hobby?: string | null;
  female_hobby?: string | null;

  relationship_start_date: string;
  relationship_stage: RelationshipStage;
  married_at?: string | null;

  notes?: string | null;
  anniversary_note?: string | null;

  show_age: boolean;
  show_zodiac: boolean;
};

type Props = {
  couple: Couple;
  locked?: boolean;
};

/* ================= HELPERS ================= */
function stageLabel(stage: RelationshipStage) {
  if (stage === "dating") return "In Love";
  if (stage === "engaged") return "Engaged";
  if (stage === "married") return "Married";
  return "Together";
}

function daysTogether(start: string) {
  const s = new Date(start);
  const t = new Date();
  s.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((t.getTime() - s.getTime()) / 86400000));
}

function isCoupleIncomplete(couple: Couple) {
  return !(
    couple.male_nickname ||
    couple.female_nickname ||
    couple.male_birth_date ||
    couple.female_birth_date ||
    couple.anniversary_note
  );
}

/* ===== AGE & ZODIAC (TYPE-SAFE) ===== */
function calculateAge(birth?: string | null) {
  if (!birth) return null;

  const b = new Date(birth);
  const t = new Date();

  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();

  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

function getZodiac(birth?: string | null) {
  if (!birth) return null;

  const d = new Date(birth);
  const day = d.getDate();
  const month = d.getMonth() + 1;

  const zodiac: [string, number, number, number, number][] = [
    ["Capricorn", 12, 22, 1, 19],
    ["Aquarius", 1, 20, 2, 18],
    ["Pisces", 2, 19, 3, 20],
    ["Aries", 3, 21, 4, 19],
    ["Taurus", 4, 20, 5, 20],
    ["Gemini", 5, 21, 6, 20],
    ["Cancer", 6, 21, 7, 22],
    ["Leo", 7, 23, 8, 22],
    ["Virgo", 8, 23, 9, 22],
    ["Libra", 9, 23, 10, 22],
    ["Scorpio", 10, 23, 11, 21],
    ["Sagittarius", 11, 22, 12, 21],
  ];

  return zodiac.find(
    ([, m1, d1, m2, d2]) =>
      (month === m1 && day >= d1) || (month === m2 && day <= d2),
  )?.[0];
}

/* ================= MAIN ================= */
export function CoupleDashboard({ couple, locked = false }: Props) {
  const days = daysTogether(couple.relationship_start_date);

  return (
    <div className="pb-8 space-y-6">
      {/* ================= HERO CARD ================= */}
      <section className="relative overflow-hidden rounded-[32px] p-6 text-center border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl shadow-indigo-500/10">
        
        {/* Decorative Background Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <CoupleAvatar
            maleName={couple.male_name}
            femaleName={couple.female_name}
          />

          <div className="mt-4 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
              {couple.male_name} <span className="text-pink-500">&</span> {couple.female_name}
            </h1>
            
            <Badge 
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 text-white px-3 py-1 rounded-full text-[11px] shadow-lg shadow-pink-500/20"
            >
              <Heart className="w-3 h-3 mr-1 fill-current" />
              {stageLabel(couple.relationship_stage)}
            </Badge>
          </div>

          <div className="mt-8 mb-4">
             <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
                  {days}
                </span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Days</span>
             </div>
             <p className="text-xs text-muted-foreground mt-1">
               Together since {new Date(couple.relationship_start_date).getFullYear()}
             </p>
          </div>

          <div className="w-full max-w-xs bg-white/5 rounded-2xl p-2 border border-white/10">
             <AnniversaryCountdown
              relationship_start_date={couple.relationship_start_date}
              theme={{
                from: "rgba(236, 72, 153, 0.2)", // pink-500
                via: "rgba(168, 85, 247, 0.2)", // purple-500
                to: "rgba(59, 130, 246, 0.2)",  // blue-500
              }}
            />
          </div>
        </div>
      </section>

      {/* ================= COMPLETE NOTICE ================= */}
      {isCoupleIncomplete(couple) && (
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-amber-100/80 to-orange-100/80 p-4 border border-orange-200/50 shadow-sm">
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-orange-900 text-sm">Profile Incomplete</p>
                <p className="text-orange-800/70 text-xs">Add details to enrich your journal</p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20 h-9 px-4 text-xs font-semibold">
              <Link href="/couple/edit#profile">Complete</Link>
            </Button>
          </div>
        </div>
      )}

      {/* ================= DETAILS GRID ================= */}
      <section className="grid grid-cols-1 gap-4">
        {/* Info Card */}
        <div className="rounded-[24px] bg-white/5 backdrop-blur-md border border-white/10 p-5 shadow-lg">
           <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
             <CalendarDays className="w-4 h-4 text-indigo-500" />
             Relationship Info
           </h3>
           
           <div className="space-y-4">
             <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Started Dating</span>
                <span className="text-sm font-semibold">{new Date(couple.relationship_start_date).toLocaleDateString("id-ID", { dateStyle: 'long' })}</span>
             </div>
             
             {couple.relationship_stage === "married" && couple.married_at && (
               <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-muted-foreground">Married On</span>
                  <span className="text-sm font-semibold">{new Date(couple.married_at).toLocaleDateString("id-ID", { dateStyle: 'long' })}</span>
               </div>
             )}

             {couple.notes && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Our Note</p>
                  <p className="text-sm italic leading-relaxed text-foreground/80">"{couple.notes}"</p>
                </div>
             )}
           </div>
        </div>

        {/* People Cards */}
        <div className="space-y-3">
           <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Partners</h3>
           
           <PersonCard
            name={couple.male_name}
            nickname={couple.male_nickname}
            birth={couple.male_birth_date}
            city={couple.male_city}
            hobby={couple.male_hobby}
            showAge={couple.show_age}
            showZodiac={couple.show_zodiac}
            gradient="from-blue-500/10 to-cyan-500/10"
            iconColor="text-blue-500"
          />

          <PersonCard
            name={couple.female_name}
            nickname={couple.female_nickname}
            birth={couple.female_birth_date}
            city={couple.female_city}
            hobby={couple.female_hobby}
            showAge={couple.show_age}
            showZodiac={couple.show_zodiac}
            gradient="from-pink-500/10 to-rose-500/10"
            iconColor="text-pink-500"
          />
        </div>
      </section>

      {/* ================= ACTIONS ================= */}
      <section className="grid grid-cols-1 gap-3 pt-4">
        {locked ? (
          <Button disabled size="lg" className="w-full h-14 rounded-2xl bg-muted/50 text-muted-foreground">
            <Lock className="w-4 h-4 mr-2" />
            Edit Relationship (Premium)
          </Button>
        ) : (
          <Button asChild size="lg" className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-xl shadow-indigo-500/20 text-white font-semibold text-base">
            <Link href="/couple/edit">Edit Details</Link>
          </Button>
        )}

        <Button asChild variant="ghost" className="w-full h-12 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground">
          <Link href="/couple/settings">
             <Settings className="w-4 h-4 mr-2" />
             Settings
          </Link>
        </Button>
      </section>
    </div>
  );
}

/* ================= PERSON CARD ================= */
function PersonCard({
  name,
  nickname,
  birth,
  city,
  hobby,
  showAge,
  showZodiac,
  gradient,
  iconColor
}: {
  name: string;
  nickname?: string | null;
  birth?: string | null;
  city?: string | null;
  hobby?: string | null;
  showAge: boolean;
  showZodiac: boolean;
  gradient: string;
  iconColor: string;
}) {
  return (
    <div className={cn("rounded-[24px] p-5 backdrop-blur-md border border-white/10 bg-gradient-to-br", gradient)}>
      <div className="flex items-start justify-between mb-4">
        <div>
           <p className="text-lg font-bold leading-tight">{name}</p>
           {nickname && <p className="text-sm text-muted-foreground">"{nickname}"</p>}
        </div>
        
        {birth && (showAge || showZodiac) && (
          <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm border-0 font-normal">
             {showAge && calculateAge(birth) !== null ? `${calculateAge(birth)} th` : null}
             {showAge && showZodiac && calculateAge(birth) !== null && " • "}
             {showZodiac ? getZodiac(birth) : null}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
         {birth && (
           <div className="space-y-1">
             <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Born</p>
             <p className="text-sm font-medium">{new Date(birth).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}</p>
           </div>
         )}
         
         {city && (
           <div className="space-y-1">
             <p className="text-[10px] uppercase tracking-wider text-muted-foreground">City</p>
             <div className="flex items-center gap-1">
                <MapPin className={cn("w-3 h-3", iconColor)} />
                <p className="text-sm font-medium">{city}</p>
             </div>
           </div>
         )}
         
         {hobby && (
           <div className="col-span-2 space-y-1 pt-2 border-t border-black/5 dark:border-white/5">
             <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hobby</p>
             <p className="text-sm font-medium">{hobby}</p>
           </div>
         )}
      </div>
    </div>
  );
}

type Props = {
  maleName: string;
  femaleName: string;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export function CoupleAvatar({ maleName, femaleName }: Props) {
  return (
    <div className="flex justify-center py-2">
      <div className="relative flex items-center">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150" />

        {/* Avatar 1 */}
        <div
          className="
            relative z-10
            h-14 w-14
            rounded-full
            flex items-center justify-center
            text-lg font-bold
            bg-gradient-to-br
            from-indigo-400 to-cyan-400
            text-white
            ring-4 ring-white/20
            shadow-lg
          "
        >
          {getInitial(maleName)}
        </div>

        {/* Avatar 2 */}
        <div
          className="
            relative z-20
            -ml-4
            h-14 w-14
            rounded-full
            flex items-center justify-center
            text-lg font-bold
            bg-gradient-to-br
            from-pink-400 to-rose-400
            text-white
            ring-4 ring-white/20
            shadow-lg
          "
        >
          {getInitial(femaleName)}
        </div>
      </div>
    </div>
  );
}

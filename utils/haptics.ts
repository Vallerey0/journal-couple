export function lightHaptic() {
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;

  navigator.vibrate(10);
}

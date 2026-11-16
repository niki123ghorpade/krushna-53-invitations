// Reads a song time typed as 1:07, 1.07 (minutes.seconds) or 67 (seconds) and returns seconds.
export function parseSongTime(value) {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const parts = text.match(/^(\d+)[:.](\d{2})$/);
  if (parts && Number(parts[2]) < 60) return Number(parts[1]) * 60 + Number(parts[2]);
  const seconds = Number(text);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}
export function formatSongTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

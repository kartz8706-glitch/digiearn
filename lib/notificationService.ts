let audioContext: AudioContext | null = null;

export async function enableNotifications() {
  if (typeof window === "undefined") return;

  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }

  try {
    audioContext = audioContext || new AudioContext();
    if (audioContext.state === "suspended") await audioContext.resume();
  } catch {
    audioContext = null;
  }
}

function playNotificationSound() {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(980, audioContext.currentTime + 0.12);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.24);
}

export function showNotification(title: string, body: string) {
  if (typeof window === "undefined") return;

  playNotificationSound();
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/digiearn-logo.svg", tag: "digi-earn-update" });
  }
}
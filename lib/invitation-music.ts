export type InvitationMusicPlayer = {
  provider: "Spotify" | "YouTube" | "Apple Music" | "SoundCloud";
  src: string;
  href: string;
  height: number;
};

/** Extract only the source URL. Pasted HTML and attributes are never rendered. */
function musicSource(value: string): string | null {
  const input = value.trim();
  if (!input.startsWith("<")) return input;
  const tag = input.match(/^<iframe\b[^>]*>/i)?.[0];
  return tag?.match(/\ssrc\s*=\s*(["'])(.*?)\1/i)?.[2].replace(/&amp;/gi, "&") ?? null;
}

export function invitationMusicPlayer(value: string): InvitationMusicPlayer | null {
  const source = musicSource(value);
  if (!source) return null;
  let url: URL;
  try { url = new URL(source); } catch { return null; }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return null;
  const host = url.hostname;
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "open.spotify.com") {
    const path = parts.filter(part => part !== "embed" && !/^intl-[a-z-]+$/i.test(part));
    if (path.length !== 2 || !["playlist", "track", "album", "artist", "episode", "show"].includes(path[0]) || !/^[a-z\d]+$/i.test(path[1])) return null;
    return { provider: "Spotify", src: `https://open.spotify.com/embed/${path.join("/")}`, href: `https://open.spotify.com/${path.join("/")}`, height: 352 };
  }
  if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"].includes(host)) {
    const list = url.searchParams.get("list");
    const video = host === "youtu.be" ? parts[0] : ["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : url.searchParams.get("v");
    if (list && /^[a-z\d_-]+$/i.test(list)) {
      return { provider: "YouTube", src: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`, href: `https://www.youtube.com/playlist?list=${list}`, height: 315 };
    }
    if (!video || !/^[a-z\d_-]{11}$/i.test(video)) return null;
    return { provider: "YouTube", src: `https://www.youtube-nocookie.com/embed/${video}`, href: `https://www.youtube.com/watch?v=${video}`, height: 315 };
  }
  if (["music.apple.com", "embed.music.apple.com"].includes(host)) {
    if (!/^[a-z]{2}$/i.test(parts[0] ?? "") || !["playlist", "album", "song"].includes(parts[1]) || parts.length < 3) return null;
    const song = url.searchParams.get("i");
    const query = song && /^\d+$/.test(song) ? `?i=${song}` : "";
    return { provider: "Apple Music", src: `https://embed.music.apple.com${url.pathname}${query}`, href: `https://music.apple.com${url.pathname}${query}`, height: 450 };
  }
  if (host === "w.soundcloud.com" && url.pathname === "/player/") {
    // The widget wraps a track or playlist URL; validate both hosts.
    return invitationSoundCloudPlayer(url.searchParams.get("url") ?? "");
  }
  return invitationSoundCloudPlayer(url.href);
}

function invitationSoundCloudPlayer(value: string): InvitationMusicPlayer | null {
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return null;
  if (!["soundcloud.com", "www.soundcloud.com", "api.soundcloud.com"].includes(url.hostname) || url.pathname.split("/").filter(Boolean).length < 2) return null;
  url.protocol = "https:";
  url.hash = "";
  return { provider: "SoundCloud", src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&auto_play=false`, href: url.href, height: 450 };
}

export function normalizeInvitationMusicInput(value: string): string {
  return value.trim().startsWith("<") ? invitationMusicPlayer(value)?.src ?? value : value;
}

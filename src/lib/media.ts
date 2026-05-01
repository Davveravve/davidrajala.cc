export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

export function isVideoMime(type: string): boolean {
  return type.startsWith("video/");
}

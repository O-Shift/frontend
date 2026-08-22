export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return hash;
}

export function stringToHue(str: string): number {
  return Math.abs(hashString(str) % 360);
}

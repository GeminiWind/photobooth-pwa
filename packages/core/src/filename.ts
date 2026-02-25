export function buildPhotoFilename(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}${m}${d}_${hh}${mm}${ss}.png`;
}

export function resolveCollision(baseName: string, existingNames: Set<string>): string {
  if (!existingNames.has(baseName)) {
    return baseName;
  }

  const extIndex = baseName.lastIndexOf(".");
  const hasExt = extIndex > 0;
  const root = hasExt ? baseName.slice(0, extIndex) : baseName;
  const ext = hasExt ? baseName.slice(extIndex) : "";

  let index = 1;
  while (true) {
    const candidate = `${root}_${index}${ext}`;
    if (!existingNames.has(candidate)) {
      return candidate;
    }
    index += 1;
  }
}

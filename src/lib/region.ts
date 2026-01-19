const REGION_SUFFIX_RE =
  /(特别行政区|壮族自治区|回族自治区|维吾尔自治区|自治区|省|市|县|区)$/u

export function normalizeRegionName(name?: string) {
  if (!name) return ''
  return name.replace(REGION_SUFFIX_RE, '')
}

export function getCityFromRegion(region?: string) {
  if (!region) return ''
  const parts = region.split('/').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) return normalizeRegionName(parts[1])
  return ''
}

export function getApiUrl(): string {
  const hostport = process.env.NEXT_PUBLIC_API_HOSTPORT
  if (hostport) return `https://${hostport}`
  const host = process.env.NEXT_PUBLIC_API_HOST
  if (host) return `https://${host}`
  return process.env.NEXT_PUBLIC_API_URL || ''
}

export function getWsUrl(path: string = ''): string {
  const base = getApiUrl().replace(/^http/, 'ws')
  return `${base}${path}`
}

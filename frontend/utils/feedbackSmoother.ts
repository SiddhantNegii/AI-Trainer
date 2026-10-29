/**
 * Filters noisy per-frame feedback into a stable list. A message is only
 * returned if it has appeared in more than `minFraction` of the most recent
 * frames in the buffer (default: 50% of ~1 second of frames).
 *
 * This eliminates the "flashes for 1 ms then disappears" jitter that came
 * from MediaPipe occasionally producing a noisy landmark in a single frame.
 */
export class FeedbackSmoother {
  private buffer: string[][] = []

  constructor(
    private readonly maxFrames: number = 30,
    private readonly minFraction: number = 0.5,
  ) {}

  push(currentFrame: string[]): string[] {
    this.buffer.push(currentFrame)
    if (this.buffer.length > this.maxFrames) this.buffer.shift()

    const counts = new Map<string, number>()
    for (const frame of this.buffer) {
      // De-duplicate within a single frame so a single noisy frame doesn't double-count.
      const seen = new Set<string>()
      for (const msg of frame) {
        if (seen.has(msg)) continue
        seen.add(msg)
        counts.set(msg, (counts.get(msg) ?? 0) + 1)
      }
    }

    const threshold = Math.max(1, Math.ceil(this.buffer.length * this.minFraction))
    return Array.from(counts.entries())
      .filter(([, count]) => count >= threshold)
      // Stable, deterministic order: most-frequent first.
      .sort(([, a], [, b]) => b - a)
      .map(([msg]) => msg)
  }

  reset() {
    this.buffer = []
  }
}

export function secureShuffle<T>(values: readonly T[]): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const range = index + 1;
    const limit = Math.floor(0x1_0000_0000 / range) * range;
    const random = new Uint32Array(1);

    do {
      crypto.getRandomValues(random);
    } while (random[0] >= limit);

    const selectedIndex = random[0] % range;
    [shuffled[index], shuffled[selectedIndex]] = [shuffled[selectedIndex], shuffled[index]];
  }

  return shuffled;
}

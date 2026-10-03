const createRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const getAviatorCrashPoint = (roundNumber: number) => {
  const cycleNumber = Math.floor((roundNumber - 1) / 10);
  const cycleRandom = createRandom(cycleNumber + 1);
  const outcomeSlots = ["zero", "below-two", "two-to-five", "two-to-five", "two-to-five", "two-to-five", "five-plus", "five-plus", "one", "one"];

  for (let index = outcomeSlots.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(cycleRandom() * (index + 1));
    [outcomeSlots[index], outcomeSlots[swapIndex]] = [outcomeSlots[swapIndex], outcomeSlots[index]];
  }

  const outcomeRandom = createRandom(roundNumber + 0x9e3779b9);
  const outcomeSlot = outcomeSlots[(roundNumber - 1) % 10];
  const crashAt = outcomeSlot === "zero"
    ? 0
    : outcomeSlot === "below-two"
      ? 1.01 + outcomeRandom() * 0.98
      : outcomeSlot === "two-to-five"
        ? 2.01 + outcomeRandom() * 2.98
        : outcomeSlot === "five-plus"
          ? 5.01 + outcomeRandom() * 2.29
          : 1;

  return Number(crashAt.toFixed(2));
};

export const createAviatorRoundState = (roundNumber: number) => {
  const startedAt = Date.now();
  return {
    roundId: `${roundNumber}-${startedAt}`,
    roundNumber,
    status: "flying" as const,
    startedAt,
    crashAt: getAviatorCrashPoint(roundNumber),
    nextRoundAt: startedAt + 7000,
  };
};
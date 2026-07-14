const EMPTY_SKIPPED_RUN = Object.freeze({
  processed: 0,
  rejected: 0,
  skipped: 0,
  candidates: 0,
  errors: [],
  skipReason: "already_running",
});

function msUntilNextRun(nowDate, runHourLocal = 7) {
  const hour = Math.max(0, Math.min(23, Number(runHourLocal) || 7));
  const next = new Date(nowDate);
  next.setHours(hour, 0, 0, 0);
  if (next <= nowDate) {
    next.setDate(next.getDate() + 1);
  }
  return Math.max(1, next.getTime() - nowDate.getTime());
}

function createSeoYoutubeRadarScheduler({
  store,
  runNow,
  setTimeoutImpl = setTimeout,
  clearTimeoutImpl = clearTimeout,
  now = () => new Date(),
  onError,
}) {
  let timer = null;
  let activeRun = null;
  let stopped = true;

  const clear = () => {
    if (timer) clearTimeoutImpl(timer);
    timer = null;
  };

  const scheduleNext = () => {
    clear();
    if (stopped) return;
    const config = store.getConfig();
    if (!config.enabled) return;
    timer = setTimeoutImpl(async () => {
      try {
        await scheduler.runNow();
      } catch (error) {
        onError?.(error);
      } finally {
        scheduleNext();
      }
    }, msUntilNextRun(now(), config.runHourLocal));
    timer?.unref?.();
  };

  const scheduler = {
    start() {
      stopped = false;
      scheduleNext();
    },

    stop() {
      stopped = true;
      clear();
    },

    async runNow() {
      if (activeRun) return { ...EMPTY_SKIPPED_RUN };
      activeRun = Promise.resolve().then(() => runNow());
      try {
        return await activeRun;
      } finally {
        activeRun = null;
      }
    },

    reschedule() {
      scheduleNext();
    },
  };

  return scheduler;
}

module.exports = {
  createSeoYoutubeRadarScheduler,
  msUntilNextRun,
};

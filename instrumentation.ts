export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSlaScheduler } = await import("@/lib/sla/scheduler");
    startSlaScheduler();
  }
}

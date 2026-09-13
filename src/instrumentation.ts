export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { processDueFollowups } = await import("@/lib/followup");

  const tick = () => {
    processDueFollowups(20).catch((error) => {
      console.error("follow-up tick failed", error);
    });
  };

  setTimeout(tick, 2500);
  setInterval(tick, 20000);
}

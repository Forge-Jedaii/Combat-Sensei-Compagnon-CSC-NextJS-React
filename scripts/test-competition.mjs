import assert from "node:assert/strict";
import test from "node:test";

function recalculate(activities) {
  const calculated = new Map();
  return [...activities].sort((a, b) => a.position - b.position).map((activity) => {
    const previous = activity.previousActivityId ? calculated.get(activity.previousActivityId) : null;
    const estimatedStart = activity.mode === "fixed"
      ? new Date(activity.plannedStart)
      : new Date(previous.actualEnd ?? previous.estimatedStart.getTime() + previous.durationMinutes * 60_000);
    const result = { ...activity, estimatedStart };
    calculated.set(activity.id, result);
    return result;
  });
}

const fixture = {
  event: { id: crypto.randomUUID(), tournaments: [crypto.randomUUID(), crypto.randomUUID()] },
  activities: [
    { id: "weigh-in", position: 1, mode: "fixed", plannedStart: "2026-08-01T08:00:00Z", previousActivityId: null, durationMinutes: 30, actualEnd: null },
    { id: "tatami-1", position: 2, mode: "after_previous", plannedStart: null, previousActivityId: "weigh-in", durationMinutes: 60, actualEnd: null },
    { id: "finals", position: 3, mode: "after_previous", plannedStart: null, previousActivityId: "tatami-1", durationMinutes: 30, actualEnd: null },
  ],
};

test("supports several tournaments and dependent activities", () => {
  assert.equal(fixture.event.tournaments.length, 2);
  const schedule = recalculate(fixture.activities);
  assert.equal(schedule[1].estimatedStart.toISOString(), "2026-08-01T08:30:00.000Z");
  assert.equal(schedule[2].estimatedStart.toISOString(), "2026-08-01T09:30:00.000Z");
});

test("propagates an actual delay to every dependent activity", () => {
  const delayed = structuredClone(fixture.activities);
  delayed[0].actualEnd = "2026-08-01T08:50:00Z";
  const schedule = recalculate(delayed);
  assert.equal(schedule[1].estimatedStart.toISOString(), "2026-08-01T08:50:00.000Z");
  assert.equal(schedule[2].estimatedStart.toISOString(), "2026-08-01T09:50:00.000Z");
});

test("survives serialization and reload without losing state", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(fixture)), fixture);
});

test("generates a unique QR payload URL", () => {
  const one = crypto.randomUUID();
  const two = crypto.randomUUID();
  assert.notEqual(one, two);
  const target = `https://csc.example/competition/p/${one}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(target)}`;
  assert.equal(new URL(qr).searchParams.get("data"), target);
});

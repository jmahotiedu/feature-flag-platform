import type { DistributionEvent } from "./eventBus.js";

function eventKey(event: Pick<DistributionEvent, "tenantId" | "flagKey">): string {
  return `${event.tenantId}:${event.flagKey}`;
}

export class FlagVersionTracker {
  private readonly latestVersion = new Map<string, number>();

  shouldApply(event: DistributionEvent): boolean {
    const current = this.latestVersion.get(eventKey(event)) ?? 0;
    return event.version > current;
  }

  markApplied(event: DistributionEvent): void {
    const key = eventKey(event);
    const current = this.latestVersion.get(key) ?? 0;
    if (event.version > current) {
      this.latestVersion.set(key, event.version);
    }
  }

  getLatestVersion(tenantId: string, flagKey: string): number {
    return this.latestVersion.get(`${tenantId}:${flagKey}`) ?? 0;
  }
}

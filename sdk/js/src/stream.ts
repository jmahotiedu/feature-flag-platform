import type { FeatureFlag } from "@ff/shared";

export interface FlagPublishedEvent {
  tenantId: string;
  flagKey: string;
  version: number;
  publishedAt: string;
}

export class MonotonicFlagCache {
  private readonly latestVersionByFlag = new Map<string, number>();
  private readonly flags = new Map<string, FeatureFlag>();

  apply(flag: FeatureFlag): boolean {
    const current = this.latestVersionByFlag.get(flag.key) ?? 0;
    if (flag.version <= current) {
      return false;
    }
    this.latestVersionByFlag.set(flag.key, flag.version);
    this.flags.set(flag.key, flag);
    return true;
  }

  applyEvent(event: FlagPublishedEvent): boolean {
    const current = this.latestVersionByFlag.get(event.flagKey) ?? 0;
    if (event.version <= current) {
      return false;
    }
    this.latestVersionByFlag.set(event.flagKey, event.version);
    return true;
  }

  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  getVersion(key: string): number {
    return this.latestVersionByFlag.get(key) ?? 0;
  }
}

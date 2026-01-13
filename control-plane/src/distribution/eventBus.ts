import { EventEmitter } from "node:events";

export interface DistributionEvent {
  type: "flag.published";
  tenantId: string;
  flagKey: string;
  version: number;
  publishedAt: string;
}

class DistributionBus extends EventEmitter {
  emitEvent(event: DistributionEvent): void {
    this.emit("distribution-event", event);
  }

  onEvent(listener: (event: DistributionEvent) => void): void {
    this.on("distribution-event", listener);
  }

  offEvent(listener: (event: DistributionEvent) => void): void {
    this.off("distribution-event", listener);
  }
}

export const distributionBus = new DistributionBus();

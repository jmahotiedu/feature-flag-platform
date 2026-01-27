import { mkdir, writeFile } from "node:fs/promises";
import { evaluateForSdk } from "@ff/sdk-js";
import { percentile } from "./percentile.js";

const flag = {
  tenantId: "tenant-a",
  key: "sdk-latency",
  name: "SDK latency",
  enabled: true,
  variants: { on: true, off: false },
  fallthroughVariant: "off",
  rules: [
    {
      id: "all-users",
      name: "all users",
      conditions: [],
      variant: "on",
      rolloutPercentage: 50
    }
  ],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

async function run(): Promise<void> {
  const iterations = Number(process.env.SDK_BENCH_ITERATIONS ?? 10_000);
  const samples: number[] = [];

  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    evaluateForSdk(flag, { key: `user-${i}`, attributes: { plan: "pro" } });
    samples.push(performance.now() - start);
  }

  const report = {
    iterations,
    p50Ms: percentile(samples, 50),
    p95Ms: percentile(samples, 95),
    p99Ms: percentile(samples, 99),
    timestamp: new Date().toISOString()
  };

  const targetDir = new URL("../../docs/benchmarks/", import.meta.url);
  await mkdir(targetDir, { recursive: true });
  await writeFile(new URL("sdk-eval-report.json", targetDir), JSON.stringify(report, null, 2));

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
}

void run();

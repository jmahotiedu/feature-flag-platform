import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const baseUrl = "http://127.0.0.1:8080";

async function killProcessTree(child) {
  if (!child || child.pid === undefined) {
    return;
  }
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore"
      });
      killer.on("close", () => resolve());
      killer.on("error", () => resolve());
    });
    return;
  }
  child.kill("SIGTERM");
}

function startControlPlane() {
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "npm run -w @ff/control-plane start"], {
          cwd: repoRoot,
          env: {
            ...process.env,
            PORT: "8080"
          },
          stdio: ["ignore", "pipe", "pipe"]
        })
      : spawn("npm", ["run", "-w", "@ff/control-plane", "start"], {
          cwd: repoRoot,
          env: {
            ...process.env,
            PORT: "8080"
          },
          stdio: ["ignore", "pipe", "pipe"]
        });

  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(`[stdout] ${chunk.toString().trimEnd()}`));
  child.stderr.on("data", (chunk) => logs.push(`[stderr] ${chunk.toString().trimEnd()}`));
  return { child, logs };
}

async function waitForHealth(timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // keep waiting
    }
    await sleep(300);
  }
  return false;
}

async function api(method, endpoint, { token, tenantId, body, headers = {} }) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-id": tenantId,
      "Content-Type": "application/json",
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  return {
    status: response.status,
    body: payload,
    headers: Object.fromEntries(response.headers.entries())
  };
}

async function runDrill() {
  const tenantId = "tenant-drill";
  const timeline = [];
  const startedAt = new Date().toISOString();
  let runtime = null;

  try {
    runtime = startControlPlane();
    if (!(await waitForHealth())) {
      throw new Error("control-plane did not become healthy for drill");
    }
    timeline.push({ at: new Date().toISOString(), step: "control-plane started" });

    await api("POST", "/api/flags", {
      token: "admin-token",
      tenantId,
      body: {
        tenantId,
        key: "drill-flag",
        name: "Drill Flag",
        enabled: true,
        variants: { on: true, off: false },
        fallthroughVariant: "off",
        rules: [
          {
            id: "all-users",
            name: "All users",
            conditions: [],
            variant: "on",
            rolloutPercentage: 100
          }
        ]
      }
    });

    const preOutagePublish = await api("POST", "/api/flags/drill-flag/publish", {
      token: "operator-token",
      tenantId,
      body: { tenantId }
    });
    timeline.push({
      at: new Date().toISOString(),
      step: "seeded and published drill flag",
      status: preOutagePublish.status
    });

    await killProcessTree(runtime.child);
    timeline.push({ at: new Date().toISOString(), step: "control-plane intentionally stopped" });
    await sleep(2_000);

    let outageError = "none";
    try {
      await api("GET", "/api/flags", {
        token: "viewer-token",
        tenantId
      });
    } catch (error) {
      outageError = error instanceof Error ? error.message : "unknown outage error";
    }
    timeline.push({ at: new Date().toISOString(), step: "confirmed outage window", detail: outageError });

    runtime = startControlPlane();
    if (!(await waitForHealth())) {
      throw new Error("control-plane did not recover in drill");
    }
    timeline.push({ at: new Date().toISOString(), step: "control-plane restarted" });

    const recreate = await api("POST", "/api/flags", {
      token: "admin-token",
      tenantId,
      body: {
        tenantId,
        key: "drill-flag",
        name: "Drill Flag",
        enabled: true,
        variants: { on: true, off: false },
        fallthroughVariant: "off",
        rules: [
          {
            id: "all-users-recovery",
            name: "Recovery users",
            conditions: [],
            variant: "off",
            rolloutPercentage: 100
          }
        ]
      }
    });

    const recoveryPublish = await api("POST", "/api/flags/drill-flag/publish", {
      token: "operator-token",
      tenantId,
      body: { tenantId },
      headers: { "Idempotency-Key": "drill-recovery-publish" }
    });

    const evalAfterRecovery = await api("POST", "/api/evaluate", {
      token: "viewer-token",
      tenantId,
      body: {
        tenantId,
        flagKey: "drill-flag",
        context: { key: "user-after-recovery", attributes: {} }
      }
    });

    const audit = await api("GET", "/api/audit", {
      token: "viewer-token",
      tenantId
    });

    const assertions = {
      recreateStatus: recreate.status,
      recoveryPublishStatus: recoveryPublish.status,
      recoveryVariant: evalAfterRecovery.body?.result?.variantKey,
      auditCount: (audit.body?.events ?? []).length
    };

    if (recreate.status !== 201 || recoveryPublish.status !== 201) {
      throw new Error("recovery publish flow failed during drill");
    }
    if (assertions.recoveryVariant !== "off") {
      throw new Error("recovered state did not reflect latest publish");
    }

    const endedAt = new Date().toISOString();
    const report = `# 2026-02-12 Incident Drill Postmortem\n\n- **Started**: ${startedAt}\n- **Ended**: ${endedAt}\n- **Environment**: local single-node control-plane\n\n## Summary\n\nA controlled control-plane outage was introduced and recovered. After restart, a new publish was applied and evaluation reflected the latest state.\n\n## Timeline\n\n${timeline.map((item) => `- ${item.at}: ${item.step}${item.status ? ` (status ${item.status})` : ""}${item.detail ? ` (${item.detail})` : ""}`).join("\n")}\n\n## Assertions\n\n- Recreate status: ${assertions.recreateStatus}\n- Recovery publish status: ${assertions.recoveryPublishStatus}\n- Post-recovery variant: ${assertions.recoveryVariant}\n- Audit events captured: ${assertions.auditCount}\n\n## Corrective Actions\n\n1. Replace in-memory store with durable Postgres-backed repository so outage drills preserve pre-outage state.
2. Add automated process-restart chaos test in CI for publish/read consistency.
3. Add dashboard screenshots and alert timestamps in follow-up drill with Docker observability stack.
`;

    await mkdir(path.join(repoRoot, "docs", "postmortems"), { recursive: true });
    await writeFile(path.join(repoRoot, "docs", "postmortems", "2026-02-12-incident-drill.md"), report, "utf8");

    console.log("Incident drill completed and postmortem written.");
  } finally {
    if (runtime) {
      await killProcessTree(runtime.child);
      await sleep(500);
    }
  }
}

runDrill().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

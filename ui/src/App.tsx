import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DEFAULT_API_TOKEN,
  DEFAULT_TENANT_ID,
  createFlag,
  getTenantQuotas,
  listFlags,
  publishFlag,
  rollbackFlag,
  type ApiSession,
  type TenantQuotaSummary,
  type UiFlag
} from "./api";

function formatError(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export default function App() {
  const [flags, setFlags] = useState<UiFlag[]>([]);
  const [tokenInput, setTokenInput] = useState(DEFAULT_API_TOKEN);
  const [tenantInput, setTenantInput] = useState(DEFAULT_TENANT_ID);
  const [keyInput, setKeyInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [quota, setQuota] = useState<TenantQuotaSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const session = useMemo<ApiSession>(
    () => ({
      token: tokenInput.trim(),
      tenantId: tenantInput.trim()
    }),
    [tenantInput, tokenInput]
  );

  const canQuery = session.token.length > 0 && session.tenantId.length > 0;
  const canCreate = useMemo(
    () => canQuery && keyInput.trim().length > 0 && nameInput.trim().length > 0,
    [canQuery, keyInput, nameInput]
  );

  async function refreshFlags(): Promise<void> {
    if (!canQuery) {
      setFlags([]);
      setQuota(null);
      setError("Enter API token and tenant ID to load data.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextFlags, nextQuota] = await Promise.all([listFlags(session), getTenantQuotas(session)]);
      setFlags(nextFlags);
      setQuota(nextQuota);
    } catch (err) {
      setError(formatError(err, "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshFlags();
  }, [canQuery, session]);

  async function onCreate(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canCreate) {
      return;
    }
    try {
      await createFlag(session, { key: keyInput.trim(), name: nameInput.trim() });
      setKeyInput("");
      setNameInput("");
      await refreshFlags();
    } catch (err) {
      setError(formatError(err, "Failed to create flag"));
    }
  }

  async function onPublish(flagKey: string): Promise<void> {
    try {
      await publishFlag(session, flagKey);
      await refreshFlags();
    } catch (err) {
      setError(formatError(err, "Failed to publish"));
    }
  }

  async function onRollback(flag: UiFlag): Promise<void> {
    if (flag.version <= 1) {
      return;
    }
    try {
      await rollbackFlag(session, flag.key, flag.version - 1);
      await refreshFlags();
    } catch (err) {
      setError(formatError(err, "Failed to rollback"));
    }
  }

  async function onSeedDemoData(): Promise<void> {
    const seedFlags = [
      { key: "demo-new-homepage", name: "Demo New Homepage" },
      { key: "demo-checkout-flow", name: "Demo Checkout Flow" }
    ];

    setLoading(true);
    setError(null);
    try {
      for (const seed of seedFlags) {
        try {
          await createFlag(session, seed);
        } catch (err) {
          const message = formatError(err, "Seed failed");
          if (!message.includes("(409)")) {
            throw err;
          }
        }
      }
      await refreshFlags();
    } catch (err) {
      setError(formatError(err, "Failed to seed demo flags"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="panel hero-panel">
        <h1>Feature Flag Admin</h1>
        <p>Manage flag lifecycles for a tenant, then publish and rollback safely.</p>
        <div className="toolbar">
          <label className="field">
            API Token
            <input
              aria-label="API Token"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="admin-token"
            />
          </label>
          <label className="field">
            Tenant ID
            <input
              aria-label="Tenant ID"
              value={tenantInput}
              onChange={(event) => setTenantInput(event.target.value)}
              placeholder="tenant-a"
            />
          </label>
          <div className="toolbar-actions">
            <button type="button" onClick={() => void refreshFlags()} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button type="button" onClick={() => void onSeedDemoData()} disabled={!canQuery || loading}>
              Seed Demo Flags
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Tenant Summary</h2>
        {quota ? (
          <p className="muted">
            {session.tenantId}: {quota.usedFlags}/{quota.maxFlags} flags used ({quota.remainingFlags} remaining)
          </p>
        ) : (
          <p className="muted">No quota data loaded.</p>
        )}
      </section>

      <section aria-label="create-flag" className="panel">
        <h2>Create Flag</h2>
        <form className="create-form" onSubmit={(event) => void onCreate(event)}>
          <label htmlFor="flag-key">Flag key</label>
          <input
            id="flag-key"
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            placeholder="new-homepage"
          />
          <label htmlFor="flag-name">Flag name</label>
          <input
            id="flag-name"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder="New Homepage"
          />
          <button type="submit" disabled={!canCreate}>
            Create
          </button>
        </form>
      </section>

      <section aria-label="flags" className="panel">
        <h2>Flags</h2>
        {loading ? <p className="muted">Loading...</p> : null}
        {error ? <p role="alert" className="error">{error}</p> : null}
        {!loading && !error && flags.length === 0 ? (
          <p className="muted">
            No flags yet for tenant <code>{session.tenantId || "-"}</code>. Create one or use "Seed Demo Flags".
          </p>
        ) : null}
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Name</th>
              <th>Version</th>
              <th>Enabled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.key}>
                <td>{flag.key}</td>
                <td>{flag.name}</td>
                <td>{flag.version}</td>
                <td>{flag.enabled ? "yes" : "no"}</td>
                <td className="actions">
                  <button onClick={() => void onPublish(flag.key)}>Publish</button>
                  <button onClick={() => void onRollback(flag)} disabled={flag.version <= 1}>
                    Rollback
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

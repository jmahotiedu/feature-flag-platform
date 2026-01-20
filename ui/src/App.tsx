import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createFlag,
  getTenantQuotas,
  listFlags,
  publishFlag,
  rollbackFlag,
  type TenantQuotaSummary,
  type UiFlag
} from "./api";

export default function App() {
  const [flags, setFlags] = useState<UiFlag[]>([]);
  const [keyInput, setKeyInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [quota, setQuota] = useState<TenantQuotaSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refreshFlags(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [nextFlags, nextQuota] = await Promise.all([listFlags(), getTenantQuotas()]);
      setFlags(nextFlags);
      setQuota(nextQuota);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshFlags();
  }, []);

  const canCreate = useMemo(() => keyInput.trim().length > 0 && nameInput.trim().length > 0, [keyInput, nameInput]);

  async function onCreate(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canCreate) {
      return;
    }
    try {
      await createFlag({ key: keyInput.trim(), name: nameInput.trim() });
      setKeyInput("");
      setNameInput("");
      await refreshFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flag");
    }
  }

  async function onPublish(flagKey: string): Promise<void> {
    try {
      await publishFlag(flagKey);
      await refreshFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    }
  }

  async function onRollback(flag: UiFlag): Promise<void> {
    if (flag.version <= 1) {
      return;
    }
    try {
      await rollbackFlag(flag.key, flag.version - 1);
      await refreshFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rollback");
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "2rem auto", fontFamily: "Segoe UI, sans-serif", padding: "0 1rem" }}>
      <h1>Feature Flag Admin</h1>
      <p>Manage flags, publish versions, and monitor rollout readiness.</p>
      {quota ? (
        <p>
          Tenant quota: {quota.usedFlags}/{quota.maxFlags} flags used ({quota.remainingFlags} remaining)
        </p>
      ) : null}

      <section aria-label="create-flag" style={{ marginBottom: "1.5rem" }}>
        <h2>Create Flag</h2>
        <form onSubmit={(event) => void onCreate(event)}>
          <label htmlFor="flag-key">Flag key</label>
          <input
            id="flag-key"
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            placeholder="new-homepage"
            style={{ display: "block", width: "100%", marginBottom: "0.5rem" }}
          />
          <label htmlFor="flag-name">Flag name</label>
          <input
            id="flag-name"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder="New Homepage"
            style={{ display: "block", width: "100%", marginBottom: "0.5rem" }}
          />
          <button type="submit" disabled={!canCreate}>
            Create
          </button>
        </form>
      </section>

      <section aria-label="flags">
        <h2>Flags</h2>
        {loading ? <p>Loading...</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Key</th>
              <th align="left">Name</th>
              <th align="left">Version</th>
              <th align="left">Enabled</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.key}>
                <td>{flag.key}</td>
                <td>{flag.name}</td>
                <td>{flag.version}</td>
                <td>{flag.enabled ? "yes" : "no"}</td>
                <td>
                  <button onClick={() => void onPublish(flag.key)}>Publish</button>
                  <button
                    onClick={() => void onRollback(flag)}
                    disabled={flag.version <= 1}
                    style={{ marginLeft: "0.5rem" }}
                  >
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

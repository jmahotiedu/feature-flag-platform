import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

const initialFlags = {
  flags: [
    {
      tenantId: "tenant-a",
      key: "new-homepage",
      name: "New Homepage",
      enabled: true,
      version: 1
    }
  ]
};

describe("App", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("renders list and publishes flag", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(initialFlags), { status: 200, headers: { "Content-Type": "application/json" } })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ quotas: { maxFlags: 50, usedFlags: 1, remainingFlags: 49 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ published: { version: 2 } }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ flags: [{ ...initialFlags.flags[0], version: 2 }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ quotas: { maxFlags: 50, usedFlags: 1, remainingFlags: 49 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );

    render(<App />);

    await screen.findByText("new-homepage");
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(5);
    });
    expect(screen.getByText(/Tenant quota:/)).toBeInTheDocument();
  });

  it("creates a flag", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ flags: [] }), { status: 200, headers: { "Content-Type": "application/json" } })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ quotas: { maxFlags: 50, usedFlags: 0, remainingFlags: 50 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ flag: { tenantId: "tenant-a", key: "checkout", name: "Checkout", enabled: true, version: 1 } }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ flags: [{ tenantId: "tenant-a", key: "checkout", name: "Checkout", enabled: true, version: 1 }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ quotas: { maxFlags: 50, usedFlags: 1, remainingFlags: 49 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );

    render(<App />);
    await screen.findByRole("heading", { name: "Create Flag" });

    fireEvent.change(screen.getByLabelText("Flag key"), { target: { value: "checkout" } });
    fireEvent.change(screen.getByLabelText("Flag name"), { target: { value: "Checkout" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("checkout");
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("rolls back to previous version", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            flags: [
              {
                tenantId: "tenant-a",
                key: "new-homepage",
                name: "New Homepage",
                enabled: true,
                version: 3
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ quotas: { maxFlags: 50, usedFlags: 1, remainingFlags: 49 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rolledBack: { version: 4 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            flags: [
              {
                tenantId: "tenant-a",
                key: "new-homepage",
                name: "New Homepage",
                enabled: true,
                version: 4
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ quotas: { maxFlags: 50, usedFlags: 1, remainingFlags: 49 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );

    render(<App />);
    await screen.findByText("new-homepage");
    fireEvent.click(screen.getByRole("button", { name: "Rollback" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(5);
    });
  });
});

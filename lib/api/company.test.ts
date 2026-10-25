import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDepartmentMetrics } from "./company"

const client = vi.hoisted(() => ({ api: { get: vi.fn() } }))

vi.mock("./client", () => client)

function requestedUrl() {
  return String(client.api.get.mock.calls[0][0])
}

describe("getDepartmentMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.api.get.mockResolvedValue([])
  })

  it("requests the latest snapshot without query string when no dates are sent", async () => {
    const controller = new AbortController()

    await getDepartmentMetrics({}, controller.signal)

    expect(client.api.get).toHaveBeenCalledTimes(1)
    expect(client.api.get).toHaveBeenCalledWith("/api/company/metrics/departments", { signal: controller.signal })
  })

  it("sends fromDate and toDate when both are given", async () => {
    await getDepartmentMetrics({ fromDate: "2026-01-01", toDate: "2026-09-01" })

    expect(requestedUrl()).toBe("/api/company/metrics/departments?fromDate=2026-01-01&toDate=2026-09-01")
  })

  it("never uses the old routes nor per-department requests", async () => {
    await getDepartmentMetrics({ fromDate: "2026-01-01", toDate: "2026-09-01" })

    expect(client.api.get).toHaveBeenCalledTimes(1)
    expect(requestedUrl()).not.toContain("overview")
    expect(requestedUrl()).not.toContain("/api/company/departments/metrics")
    expect(requestedUrl()).not.toMatch(/departments\/[^/?]+\/metrics/)
  })
})

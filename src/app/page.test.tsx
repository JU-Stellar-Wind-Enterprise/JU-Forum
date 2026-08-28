import { describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/lib/session";
import Home from "./page";

vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("Home Page", () => {
  it("renders for an authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "1", name: "Test Student", email: "student@juniv.edu", role: "STUDENT", status: "ACTIVE" });
    const page = await Home();
    expect(page).toBeDefined();
  });
});

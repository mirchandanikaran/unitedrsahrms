import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "@/components/layout/TopBar";
import { PORTAL_NAME } from "@/lib/brand";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();

const { logoutMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/store/auth", () => ({
  useAuthStore: () => ({
    user: { email: "test@example.com", role: "employee" },
    logout: logoutMock,
  }),
}));

describe("TopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows app title and user email", () => {
    render(<TopBar />);
    expect(screen.getByRole("heading", { name: PORTAL_NAME })).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("employee")).toBeInTheDocument();
  });

  it("logout triggers store logout and navigates to login", async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    await user.click(screen.getByRole("button", { name: /logout/i }));
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button type="button">Save</Button>);
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button type="button" onClick={onClick}>
        Click me
      </Button>
    );
    await user.click(screen.getByRole("button", { name: /click me/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is set", () => {
    render(
      <Button type="button" disabled>
        Off
      </Button>
    );
    expect(screen.getByRole("button", { name: /off/i })).toBeDisabled();
  });
});

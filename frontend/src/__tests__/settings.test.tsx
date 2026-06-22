import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Toggle } from "../components/Toggle";
import SettingsPage from "../app/settings/page";

describe("Settings", () => {
  test("Toggle flips its checked state", () => {
    render(<Toggle label="Deadline reminders" />);
    const sw = screen.getByRole("switch", { name: /Deadline reminders/i });
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  test("page renders the core sections", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /^Settings$/i })).toBeInTheDocument();
    expect(screen.getByText(/Account/)).toBeInTheDocument();
    expect(screen.getByText(/Notifications/)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { SovereignToggle } from "../components/SovereignToggle";

describe("SovereignToggle", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SOVEREIGN;
  });

  test("shows the sovereign badge when enabled", () => {
    process.env.NEXT_PUBLIC_SOVEREIGN = "1";
    render(<SovereignToggle />);
    expect(screen.getByText(/Sovereign/i)).toBeInTheDocument();
  });

  test("shows the default-model badge otherwise", () => {
    render(<SovereignToggle />);
    expect(screen.getByText(/Default model/i)).toBeInTheDocument();
  });
});

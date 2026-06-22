import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DefensePackView } from "../components/DefensePackView";
import { acmeDefense, fabricatedDefense } from "../lib/fixtures";

describe("DefensePackView", () => {
  test("shows a verified citation + penalty exposure", () => {
    render(<DefensePackView pack={acmeDefense} />);
    expect(screen.getByText("ITA-1967-s33(1)")).toBeInTheDocument();
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
    expect(screen.getByText(/s\.113/)).toBeInTheDocument();
  });

  test("marks a fabricated citation as blocked", () => {
    render(<DefensePackView pack={fabricatedDefense} />);
    expect(screen.getByText(/✕ Unverified/)).toBeInTheDocument();
  });
});

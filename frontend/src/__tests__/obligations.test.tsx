import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ObligationTable } from "../components/ObligationTable";
import { acmeCalendar } from "../lib/fixtures";

describe("ObligationTable", () => {
  test("renders the Form C deadline and CP204 row", () => {
    render(<ObligationTable calendar={acmeCalendar} />);
    expect(screen.getByText("2026-07-31")).toBeInTheDocument();
    expect(screen.getByText("CP204")).toBeInTheDocument();
  });
});

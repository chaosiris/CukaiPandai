import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EntitiesGrid } from "../components/EntitiesGrid";
import { ENTITIES } from "../lib/entities";

describe("EntitiesGrid", () => {
  test("renders all entities by default", () => {
    render(<EntitiesGrid entities={ENTITIES} />);
    expect(screen.getByText("Acme Sdn Bhd")).toBeInTheDocument();
    expect(screen.getByText("Bumi Steel Bhd")).toBeInTheDocument();
  });

  test("search narrows the grid by name", () => {
    render(<EntitiesGrid entities={ENTITIES} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "bumi" } });
    expect(screen.getByText("Bumi Steel Bhd")).toBeInTheDocument();
    expect(screen.queryByText("Acme Sdn Bhd")).not.toBeInTheDocument();
  });

  test("status filter shows only matching entities", () => {
    render(<EntitiesGrid entities={ENTITIES} />);
    fireEvent.click(screen.getByRole("button", { name: /^Draft$/i }));
    expect(screen.getByText("Delima Retail Sdn Bhd")).toBeInTheDocument();
    expect(screen.queryByText("Acme Sdn Bhd")).not.toBeInTheDocument();
  });

  test("status and search compose with AND (both must hold)", () => {
    render(<EntitiesGrid entities={ENTITIES} />);
    // Delima is Draft, so requiring In Review AND name 'delima' must match nothing.
    fireEvent.click(screen.getByRole("button", { name: /^In Review$/i }));
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "delima" } });
    expect(screen.queryByText("Delima Retail Sdn Bhd")).not.toBeInTheDocument();
    expect(screen.getByText(/No matching entities/i)).toBeInTheDocument();
  });

  test("shows the empty state when nothing matches", () => {
    render(<EntitiesGrid entities={ENTITIES} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "zzzzz" } });
    expect(screen.getByText(/No matching entities/i)).toBeInTheDocument();
    expect(screen.queryByText("Acme Sdn Bhd")).not.toBeInTheDocument();
  });
});

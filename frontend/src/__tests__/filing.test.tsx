import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { CitedComputation } from "../components/CitedComputation";
import { acmeFormC } from "../lib/fixtures";

describe("CitedComputation", () => {
  test("shows the cited tax_payable and fires approve", () => {
    let approved = false;
    render(<CitedComputation computation={acmeFormC} onApprove={() => (approved = true)} />);

    expect(screen.getByText(/31,000/)).toBeInTheDocument();
    expect(screen.getByText(/cit\.rate\.sme/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    expect(approved).toBe(true);
  });
});

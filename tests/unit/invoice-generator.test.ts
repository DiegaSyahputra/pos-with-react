import { describe, expect, it } from "bun:test";
import {
  generateInvoiceNumber,
  isValidInvoiceFormat,
} from "../../src/lib/invoice-generator";

describe("Invoice Generator Unit Tests", () => {
  it("should generate sequential invoice numbers with correct date prefix", () => {
    const inv = generateInvoiceNumber(1);
    expect(inv).toMatch(/^INV-\d{8}-0001$/);
  });

  it("should generate valid random invoice number when no sequence provided", () => {
    const inv = generateInvoiceNumber();
    expect(inv).toMatch(/^INV-\d{8}-[A-Z0-9]{4}$/);
    expect(isValidInvoiceFormat(inv)).toBe(true);
  });

  it("should validate invalid invoice strings", () => {
    expect(isValidInvoiceFormat("INVALID-123")).toBe(false);
    expect(isValidInvoiceFormat("")).toBe(false);
  });
});

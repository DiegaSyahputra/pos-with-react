/**
 * Generates unique invoice codes for POS transactions
 */

export function generateInvoiceNumber(sequenceNumber?: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  if (sequenceNumber !== undefined && sequenceNumber > 0) {
    const seqStr = String(sequenceNumber).padStart(4, '0');
    return `INV-${datePrefix}-${seqStr}`;
  }

  // Generate 4-digit hex random suffix (0x1000 to 0xFFFF)
  const randomSuffix = Math.floor(4096 + Math.random() * 61439).toString(16).toUpperCase();
  return `INV-${datePrefix}-${randomSuffix}`;
}

export function isValidInvoiceFormat(invoiceNo: string): boolean {
  if (!invoiceNo) return false;
  const regex = /^INV-\d{8}-[A-Z0-9]{4}$/;
  return regex.test(invoiceNo);
}

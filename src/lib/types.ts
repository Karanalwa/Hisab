export type Shop = {
  id: string;
  name: string;
  address: string;
  pin: string;
  gstin: string;
  state: string;
  phone: string;
  invoice_prefix: string;
  next_invoice_no: number;
  logo_url: string | null;
  upi_qr_url: string | null;
  upi_id: string;
  terms: string;
  signature_url: string | null;
};

export type Product = {
  id: string;
  shop_id: string;
  name: string;
  hsn: string;
  unit: string;
  price: number;
  gst: number;
  stock: number;
  low: number;
  cost: number;
};

export type Customer = {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  gstin: string;
  state: string;
  address: string;
};

export type InvoiceItem = {
  productId?: string;
  name: string;
  hsn: string;
  price: number;
  gst: number;
  qty: number;
  disc?: number;
  taxable?: number;
  gstAmt?: number;
  amount?: number;
};

export type Payment = { date: string; amount: number; mode: string };

export type Invoice = {
  id: string;
  shop_id: string;
  no: string;
  date: string;
  customer_id: string | null;
  customer_name: string;
  customer_gstin: string;
  customer_state: string;
  customer_phone: string;
  customer_address: string;
  items: InvoiceItem[];
  inter_state: boolean;
  no_tax: boolean;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  round: number;
  total: number;
  pay_mode: string;
  paid: number;
  payments: Payment[];
};

export type Purchase = {
  id: string;
  shop_id: string;
  date: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  cost: number;
  supplier: string;
  note: string;
};

export type CreditNote = {
  id: string;
  shop_id: string;
  invoice_id: string;
  no: string;
  date: string;
  items: InvoiceItem[];
  total: number;
  reason: string;
  note: string;
};

export type CashRegister = {
  id: string;
  shop_id: string;
  date: string;
  opening: number;
  expenses: number;
  closing: number;
  notes: string;
};

export type StockAdjustment = {
  id: string;
  shop_id: string;
  date: string;
  product_id: string | null;
  product_name: string;
  qty_change: number;
  reason: string;
  note: string;
};

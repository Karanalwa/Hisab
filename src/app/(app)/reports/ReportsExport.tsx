"use client";
import * as XLSX from "xlsx";
import { money } from "@/lib/gst";
import type { Invoice } from "@/lib/types";

export default function ReportsExport({ invoices, from, to }: { invoices: Invoice[]; from: string; to: string }) {
  function exportExcel() {
    const rows = invoices.map((i) => ({
      "Invoice No": i.no,
      Date: i.date,
      Customer: i.customer_name,
      GSTIN: i.customer_gstin || "",
      State: i.customer_state || "",
      Taxable: i.taxable || 0,
      CGST: i.cgst || 0,
      SGST: i.sgst || 0,
      IGST: i.igst || 0,
      "Round Off": i.round || 0,
      Total: i.total || 0,
      Paid: i.paid || 0,
      Mode: i.pay_mode,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");

    // auto-width
    const colWidths = [
      { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 14 },
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 10 },
    ];
    ws["!cols"] = colWidths;

    const fileName = `Hisab_Report_${from || "all"}_to_${to || "all"}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  function openPrint() {
    const url = `/reports/print?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    window.open(url, "_blank");
  }

  return (
    <div style={{ display: "flex", gap: 10 }}>
      <button className="btn" onClick={exportExcel}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Excel
      </button>
      <button className="btn" onClick={openPrint}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 6 }}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print / PDF
      </button>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Printer, Download, FileText, TrendingUp,
  ShoppingBag, Users, DollarSign, Filter, FileSpreadsheet
} from "lucide-react";
import * as XLSX from "xlsx";

const AdminReportsPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo)   query = query.lte("created_at", dateTo + "T23:59:59");
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  };

  // ── Stats ──
  const totalRevenue    = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders     = orders.length;
  const avgOrder        = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingCount    = orders.filter((o) => o.status === "pending").length;
  const completedCount  = orders.filter((o) => o.status === "completed").length;
  const shippedCount    = orders.filter((o) => o.status === "shipped").length;
  const cancelledCount  = orders.filter((o) => o.status === "cancelled").length;

  // ── Excel Export ──
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Summary ──
    const summaryData = [
      ["RaidKhalid & Co. — Orders Report"],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Date Range: ${dateFrom || "All"} to ${dateTo || "All"}`],
      [`Status Filter: ${statusFilter === "all" ? "All Statuses" : statusFilter}`],
      [],
      ["SUMMARY"],
      ["Metric", "Value"],
      ["Total Revenue",    `₱${totalRevenue.toLocaleString()}`],
      ["Total Orders",     totalOrders],
      ["Average Order Value", `₱${Math.round(avgOrder).toLocaleString()}`],
      ["Pending Orders",   pendingCount],
      ["Completed Orders", completedCount],
      ["Shipped Orders",   shippedCount],
      ["Cancelled Orders", cancelledCount],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Column widths for summary
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];

    // Style the title row (bold, merged)
    wsSummary["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // ── Sheet 2: Orders ──
    const orderHeaders = [
      "Order ID",
      "Customer Name",
      "Email",
      "Phone",
      "Shipping Address",
      "Subtotal (₱)",
      "Discount (₱)",
      "Shipping Fee (₱)",
      "Total (₱)",
      "Status",
      "Payment Method",
      "Payment Reference",
      "Order Type",
      "Date",
      "Time",
    ];

    const orderRows = orders.map((o) => {
      const date = new Date(o.created_at);
      return [
        o.id?.slice(0, 8).toUpperCase(),
        o.customer_name || "",
        o.customer_email || "",
        o.shipping_phone || "",
        o.shipping_address || "",
        o.subtotal ?? o.total ?? 0,
        o.discount ?? 0,
        o.shipping_fee ?? 0,
        o.total ?? 0,
        o.status || "",
        o.payment_method || "",
        o.payment_reference || "",
        o.order_type || "",
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
      ];
    });

    // Totals row
    const totalsRow = [
      "TOTAL", "", "", "", "",
      orders.reduce((s, o) => s + (o.subtotal ?? o.total ?? 0), 0),
      orders.reduce((s, o) => s + (o.discount ?? 0), 0),
      orders.reduce((s, o) => s + (o.shipping_fee ?? 0), 0),
      totalRevenue,
      "", "", "", "", "", "",
    ];

    const wsOrders = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows, [], totalsRow]);

    // Column widths for orders
    wsOrders["!cols"] = [
      { wch: 12 }, { wch: 22 }, { wch: 28 }, { wch: 15 },
      { wch: 35 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 20 },
      { wch: 12 }, { wch: 14 }, { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

    // ── Sheet 3: Payment Breakdown ──
    const paymentMap: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      const pm = o.payment_method || "unknown";
      if (!paymentMap[pm]) paymentMap[pm] = { count: 0, total: 0 };
      paymentMap[pm].count += 1;
      paymentMap[pm].total += o.total || 0;
    });

    const paymentData = [
      ["Payment Method Breakdown"],
      [],
      ["Payment Method", "Order Count", "Total Revenue (₱)", "% of Revenue"],
      ...Object.entries(paymentMap).map(([pm, { count, total }]) => [
        pm.toUpperCase(),
        count,
        total,
        totalRevenue > 0 ? `${((total / totalRevenue) * 100).toFixed(1)}%` : "0%",
      ]),
      [],
      ["TOTAL", totalOrders, totalRevenue, "100%"],
    ];

    const wsPayment = XLSX.utils.aoa_to_sheet(paymentData);
    wsPayment["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 15 }];
    wsPayment["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, wsPayment, "Payment Breakdown");

    // ── Sheet 4: Status Breakdown ──
    const statusData = [
      ["Order Status Breakdown"],
      [],
      ["Status", "Count", "% of Orders"],
      ["Pending",   pendingCount,   totalOrders > 0 ? `${((pendingCount / totalOrders) * 100).toFixed(1)}%` : "0%"],
      ["Completed", completedCount, totalOrders > 0 ? `${((completedCount / totalOrders) * 100).toFixed(1)}%` : "0%"],
      ["Shipped",   shippedCount,   totalOrders > 0 ? `${((shippedCount / totalOrders) * 100).toFixed(1)}%` : "0%"],
      ["Cancelled", cancelledCount, totalOrders > 0 ? `${((cancelledCount / totalOrders) * 100).toFixed(1)}%` : "0%"],
      [],
      ["TOTAL", totalOrders, "100%"],
    ];

    const wsStatus = XLSX.utils.aoa_to_sheet(statusData);
    wsStatus["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 15 }];
    wsStatus["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    XLSX.utils.book_append_sheet(wb, wsStatus, "Status Breakdown");

    // ── Write file ──
    const fileName = `raidkhalid-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel report exported with 4 sheets!");
  };

  // ── CSV Export ──
  const exportCSV = () => {
    const headers = ["Order ID", "Customer", "Email", "Phone", "Address", "Subtotal", "Discount", "Shipping Fee", "Total", "Status", "Payment", "Reference", "Date"];
    const rows = orders.map((o) => [
      o.id?.slice(0, 8).toUpperCase(),
      o.customer_name, o.customer_email, o.shipping_phone || "",
      o.shipping_address || "",
      o.subtotal ?? o.total ?? 0,
      o.discount ?? 0, o.shipping_fee ?? 0, o.total ?? 0,
      o.status, o.payment_method, o.payment_reference || "",
      new Date(o.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `raidkhalid-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  // ── Print ──
  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head>
        <title>Orders Report — RaidKhalid & Co.</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
          h1 { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
          .meta { font-size: 11px; color: #666; margin-bottom: 20px; }
          .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat { border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
          .stat .label { font-size: 9px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
          .stat .value { font-size: 16px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #111; color: #fff; text-align: left; padding: 7px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
          td { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 10px; }
          tr:nth-child(even) td { background: #f9f9f9; }
          tfoot td { background: #f0f0f0; font-weight: bold; border-top: 2px solid #111; }
          .badge { display:inline-block; padding:2px 7px; border-radius:20px; font-size:9px; font-weight:bold; text-transform:uppercase; }
          .pending   { background:#fef3c7; color:#92400e; }
          .completed { background:#d1fae5; color:#065f46; }
          .shipped   { background:#dbeafe; color:#1e40af; }
          .cancelled { background:#fee2e2; color:#991b1b; }
          .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
        </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-green-100 text-green-700";
    if (s === "cancelled") return "bg-red-100 text-red-700";
    if (s === "shipped")   return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const stats = [
    { label: "Total Revenue",    value: `₱${totalRevenue.toLocaleString()}`,           icon: <DollarSign size={16} className="text-green-500" /> },
    { label: "Total Orders",     value: totalOrders,                                    icon: <ShoppingBag size={16} className="text-blue-500" /> },
    { label: "Avg. Order",       value: `₱${Math.round(avgOrder).toLocaleString()}`,   icon: <TrendingUp size={16} className="text-purple-500" /> },
    { label: "Pending",          value: pendingCount,                                   icon: <Users size={16} className="text-orange-500" /> },
    { label: "Completed",        value: completedCount,                                 icon: <Users size={16} className="text-green-500" /> },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl uppercase tracking-wider text-foreground text-white">Reports</h1>
            <p className="text-sm text-muted-foreground">Orders summary and export</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={exportCSV} variant="outline" className="gap-2 font-heading uppercase tracking-wider text-xs">
            <Download size={14} /> CSV
          </Button>
          <Button onClick={exportExcel} variant="outline" className="gap-2 font-heading uppercase tracking-wider text-xs border-green-500 text-green-600 hover:bg-green-50">
            <FileSpreadsheet size={14} /> Excel
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider text-xs">
            <Printer size={14} /> Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-sm uppercase tracking-wider flex items-center gap-2">
            <Filter size={15} /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button onClick={fetchOrders} className="bg-primary text-primary-foreground font-heading uppercase tracking-wider text-xs">
              Apply
            </Button>
            <Button variant="ghost" onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter("all"); setTimeout(fetchOrders, 0); }}
              className="text-xs text-muted-foreground">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Printable section */}
      <div ref={printRef}>
        {/* Print-only header */}
        <div className="hidden print:block mb-4">
          <h1>RaidKhalid & Co. — Orders Report</h1>
          <p className="meta">
            Generated: {new Date().toLocaleString()} &nbsp;|&nbsp;
            Range: {dateFrom || "All"} – {dateTo || "All"} &nbsp;|&nbsp;
            Status: {statusFilter === "all" ? "All" : statusFilter}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stats">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 stat">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider label">{s.label}</p>
                  {s.icon}
                </div>
                <p className="text-2xl font-heading font-bold text-foreground value">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="font-heading text-sm uppercase tracking-wider">
              Orders ({totalOrders})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No orders found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Order ID", "Customer", "Email", "Subtotal", "Discount", "Shipping", "Total", "Status", "Payment", "Date"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.id?.slice(0, 8).toUpperCase()}</td>
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{o.customer_name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{o.customer_email}</td>
                        <td className="px-4 py-3 text-foreground">₱{(o.subtotal ?? o.total ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-600">-₱{(o.discount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground">₱{(o.shipping_fee ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-heading font-bold text-foreground">₱{(o.total ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize badge ${statusColor(o.status)} ${o.status}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground capitalize text-xs">{o.payment_method}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50 border-t-2 border-border font-heading">
                      <td colSpan={3} className="px-4 py-3 text-sm uppercase tracking-wider text-foreground font-bold">Totals</td>
                      <td className="px-4 py-3 text-foreground font-bold">₱{orders.reduce((s, o) => s + (o.subtotal ?? o.total ?? 0), 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600 font-bold">-₱{orders.reduce((s, o) => s + (o.discount ?? 0), 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-foreground font-bold">₱{orders.reduce((s, o) => s + (o.shipping_fee ?? 0), 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-primary font-bold text-base">₱{totalRevenue.toLocaleString()}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print footer */}
        <div className="hidden print:block footer mt-6 text-center text-xs text-gray-400">
          RaidKhalid & Co. · Confidential · {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
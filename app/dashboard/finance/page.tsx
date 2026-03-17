"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";

export default function FinancePage() {
    const { data: invoicesData } = trpc.finance.getInvoices.useQuery({ limit: 10 });
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const { data: summary } = trpc.finance.getFinancialSummary.useQuery({
        startDate: startOfMonth,
        endDate: endOfMonth,
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Finance & Accounting</h1>
                    <p className="text-secondary-600 mt-1">Manage invoices, payments, and financial reports</p>
                </div>
                <Link href="/dashboard/finance/invoices/new" className="btn-primary">
                    + New Invoice
                </Link>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Total Revenue</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        ₹{(summary?.totalRevenue || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">This month</p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Received</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        ₹{(summary?.totalReceived || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">Payments received</p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Outstanding</h3>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                        ₹{(summary?.outstandingReceivables || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">Receivables</p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Net Profit</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                        ₹{(summary?.netProfit || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">This month</p>
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-900">Recent Invoices</h2>
                    <Link href="/dashboard/finance/invoices" className="text-primary-600 hover:text-primary-700">
                        View All →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th>Amount</th>
                                <th>Paid</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoicesData?.invoices.map((invoice: any) => (
                                <tr key={invoice.id}>
                                    <td className="font-mono text-sm">{invoice.invoiceNumber}</td>
                                    <td>{invoice.customer.name}</td>
                                    <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                                    <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                    <td className="font-semibold">
                                        ₹{Number(invoice.totalAmount).toLocaleString("en-IN")}
                                    </td>
                                    <td>₹{Number(invoice.paidAmount).toLocaleString("en-IN")}</td>
                                    <td>
                                        <span
                                            className={
                                                invoice.status === "paid"
                                                    ? "badge-success"
                                                    : invoice.status === "overdue"
                                                        ? "badge-danger"
                                                        : invoice.status === "sent"
                                                            ? "badge-info"
                                                            : "badge-secondary"
                                            }
                                        >
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="text-primary-600 hover:text-primary-700 text-sm">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="font-semibold text-secondary-900">Record Payment</h3>
                    <p className="text-sm text-secondary-600 mt-1">Record customer or vendor payment</p>
                </div>
                <div className="card hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="font-semibold text-secondary-900">Generate Reports</h3>
                    <p className="text-sm text-secondary-600 mt-1">P&L, Balance Sheet, GST Returns</p>
                </div>
                <div className="card hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="font-semibold text-secondary-900">E-Invoice</h3>
                    <p className="text-sm text-secondary-600 mt-1">Generate e-invoices with IRN</p>
                </div>
            </div>
        </div>
    );
}

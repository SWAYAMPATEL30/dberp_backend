"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";

export default function CRMPage() {
    const { data: customersData } = trpc.crm.getCustomers.useQuery({ limit: 10 });
    const { data: quotationsData } = trpc.crm.getQuotations.useQuery({ limit: 10 });
    const { data: ordersData } = trpc.crm.getSalesOrders.useQuery({ limit: 10 });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">CRM & Sales</h1>
                    <p className="text-secondary-600 mt-1">Manage customers, quotations, and sales orders</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/crm/customers/new" className="btn-primary">
                        + New Customer
                    </Link>
                    <Link href="/dashboard/crm/quotations/new" className="btn-primary">
                        + New Quotation
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Total Customers</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                        {customersData?.total || 0}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Active Quotations</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                        {quotationsData?.total || 0}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Sales Orders</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                        {ordersData?.total || 0}
                    </p>
                </div>
            </div>

            {/* Recent Customers */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-900">Recent Customers</h2>
                    <Link href="/dashboard/crm/customers" className="text-primary-600 hover:text-primary-700">
                        View All →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>Orders</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customersData?.customers.map((customer: any) => (
                                <tr key={customer.id}>
                                    <td className="font-mono text-sm">{customer.code}</td>
                                    <td className="font-medium">{customer.name}</td>
                                    <td>{customer.email || "-"}</td>
                                    <td>{customer.phone || "-"}</td>
                                    <td>{customer.city || "-"}</td>
                                    <td>
                                        <span className="badge-info">{customer._count?.salesOrders || 0}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Quotations */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-900">Recent Quotations</h2>
                    <Link href="/dashboard/crm/quotations" className="text-primary-600 hover:text-primary-700">
                        View All →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Quote #</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotationsData?.quotations.map((quote: any) => (
                                <tr key={quote.id}>
                                    <td className="font-mono text-sm">{quote.quotationNumber}</td>
                                    <td>{quote.customer.name}</td>
                                    <td>{new Date(quote.quotationDate).toLocaleDateString()}</td>
                                    <td className="font-semibold">₹{Number(quote.totalAmount).toLocaleString("en-IN")}</td>
                                    <td>
                                        <span
                                            className={
                                                quote.status === "converted"
                                                    ? "badge-success"
                                                    : quote.status === "approved"
                                                        ? "badge-info"
                                                        : "badge-secondary"
                                            }
                                        >
                                            {quote.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

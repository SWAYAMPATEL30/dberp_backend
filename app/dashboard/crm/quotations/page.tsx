"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useState } from "react";

export default function QuotationsPage() {
    const [page, setPage] = useState(0);
    const { data, isLoading } = trpc.crm.getQuotations.useQuery({
        limit: 10,
        offset: page * 10,
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Quotations</h1>
                    <p className="text-secondary-600 mt-1">Manage sales quotations</p>
                </div>
                <Link href="/dashboard/crm/quotations/new" className="btn-primary">
                    + New Quotation
                </Link>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Quote #</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Valid Until</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8">
                                        Loading...
                                    </td>
                                </tr>
                            ) : data?.quotations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-secondary-500">
                                        No quotations found. Create your first one!
                                    </td>
                                </tr>
                            ) : (
                                data?.quotations.map((quote: any) => (
                                    <tr key={quote.id}>
                                        <td className="font-mono text-sm">{quote.quotationNumber}</td>
                                        <td className="font-medium">{quote.customer?.name || "Unknown"}</td>
                                        <td>{new Date(quote.quotationDate).toLocaleDateString()}</td>
                                        <td>{new Date(quote.validUntil).toLocaleDateString()}</td>
                                        <td className="font-semibold">
                                            ₹{Number(quote.totalAmount).toLocaleString("en-IN")}
                                        </td>
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
                                        <td>
                                            <Link
                                                href={`/dashboard/crm/quotations/${quote.id}`}
                                                className="text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-secondary-200">
                    <div className="text-sm text-secondary-600">
                        Showing {data?.quotations.length || 0} of {data?.total || 0} quotations
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn-secondary text-sm px-3 py-1"
                            disabled={page === 0}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </button>
                        <button
                            className="btn-secondary text-sm px-3 py-1"
                            disabled={!data || (page + 1) * 10 >= data.total}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

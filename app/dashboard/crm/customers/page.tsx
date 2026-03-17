"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useState } from "react";

export default function CustomersPage() {
    const [page, setPage] = useState(0);
    const { data, isLoading } = trpc.crm.getCustomers.useQuery({
        limit: 10,
        offset: page * 10,
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Customers</h1>
                    <p className="text-secondary-600 mt-1">Manage your customer base</p>
                </div>
                <Link href="/dashboard/crm/customers/new" className="btn-primary">
                    + Add Customer
                </Link>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>GSTIN</th>
                                <th>City</th>
                                <th>Orders</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-8">
                                        Loading...
                                    </td>
                                </tr>
                            ) : data?.customers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-secondary-500">
                                        No customers found. Add your first one!
                                    </td>
                                </tr>
                            ) : (
                                data?.customers.map((customer: any) => (
                                    <tr key={customer.id}>
                                        <td className="font-mono text-sm">{customer.code}</td>
                                        <td className="font-medium">{customer.name}</td>
                                        <td>{customer.email || "-"}</td>
                                        <td>{customer.phone || "-"}</td>
                                        <td>{customer.gstin || "-"}</td>
                                        <td>{customer.city || "-"}</td>
                                        <td>
                                            <span className="badge-info">
                                                {customer._count?.salesOrders || 0} Orders
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/dashboard/crm/customers/${customer.id}`}
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
                        Showing {data?.customers.length || 0} of {data?.total || 0} customers
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

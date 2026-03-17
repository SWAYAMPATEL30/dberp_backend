"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function AnalyticsPage() {
    const [dateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
    });

    const { data: metrics, isLoading: metricsLoading } = trpc.analytics.getDashboardMetrics.useQuery();
    const { data: salesAnalytics, isLoading: salesLoading } = trpc.analytics.getSalesAnalytics.useQuery({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Analytics</h1>
                    <p className="text-secondary-600 mt-1">Business insights and performance metrics</p>
                </div>
            </div>

            {/* Key Metrics */}
            {metricsLoading ? (
                <p className="text-secondary-500">Loading metrics...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card">
                        <h3 className="text-sm font-medium text-secondary-600">Total Customers</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{metrics?.totalCustomers || 0}</p>
                    </div>
                    <div className="card">
                        <h3 className="text-sm font-medium text-secondary-600">Monthly Revenue</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            ₹{(metrics?.totalRevenue || 0).toLocaleString("en-IN")}
                        </p>
                    </div>
                    <div className="card">
                        <h3 className="text-sm font-medium text-secondary-600">Outstanding Amount</h3>
                        <p className="text-3xl font-bold text-orange-600 mt-2">
                            ₹{(metrics?.outstandingAmount || 0).toLocaleString("en-IN")}
                        </p>
                    </div>
                    <div className="card">
                        <h3 className="text-sm font-medium text-secondary-600">Overdue Invoices</h3>
                        <p className="text-3xl font-bold text-red-600 mt-2">{metrics?.overdueInvoices || 0}</p>
                    </div>
                </div>
            )}

            {/* Sales Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Sales Summary</h3>
                    {salesLoading ? (
                        <p className="text-secondary-500">Loading sales data...</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm text-secondary-700">Total Orders</span>
                                <span className="text-lg font-bold text-blue-600">{salesAnalytics?.totalOrders || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="text-sm text-secondary-700">Order Value</span>
                                <span className="text-lg font-bold text-green-600">
                                    ₹{(salesAnalytics?.totalOrderValue || 0).toLocaleString("en-IN")}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                <span className="text-sm text-secondary-700">Total Quotations</span>
                                <span className="text-lg font-bold text-purple-600">{salesAnalytics?.totalQuotations || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                <span className="text-sm text-secondary-700">Quotation Value</span>
                                <span className="text-lg font-bold text-yellow-600">
                                    ₹{(salesAnalytics?.totalQuotationValue || 0).toLocaleString("en-IN")}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Conversion Metrics</h3>
                    {salesLoading ? (
                        <p className="text-secondary-500">Loading conversion data...</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
                                <p className="text-sm text-secondary-600">Quotation → Order Conversion Rate</p>
                                <p className="text-5xl font-bold text-primary-600 mt-2">
                                    {(salesAnalytics?.conversionRate || 0).toFixed(1)}%
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-secondary-50 rounded-lg text-center">
                                    <p className="text-xs text-secondary-500">Active Jobs</p>
                                    <p className="text-2xl font-bold text-secondary-900">{metrics?.activeJobs || 0}</p>
                                </div>
                                <div className="p-3 bg-secondary-50 rounded-lg text-center">
                                    <p className="text-xs text-secondary-500">Pending Orders</p>
                                    <p className="text-2xl font-bold text-secondary-900">{metrics?.pendingOrders || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Customers */}
            <div className="card">
                <h2 className="text-xl font-semibold text-secondary-900 mb-4">Top Customers by Revenue</h2>
                {salesLoading ? (
                    <p className="text-secondary-500">Loading customer data...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Customer</th>
                                    <th>Total Orders</th>
                                    <th>Total Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesAnalytics?.topCustomers?.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td className="font-bold text-secondary-500">{index + 1}</td>
                                        <td className="font-medium">{item.customer?.name || "Unknown"}</td>
                                        <td>{item.totalOrders}</td>
                                        <td className="font-semibold">₹{Number(item.totalValue).toLocaleString("en-IN")}</td>
                                    </tr>
                                ))}
                                {(!salesAnalytics?.topCustomers || salesAnalytics.topCustomers.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="text-center text-secondary-500 py-8">
                                            No sales data for the selected period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Operations Overview */}
            <div className="card">
                <h2 className="text-xl font-semibold text-secondary-900 mb-4">Operations Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-xs text-secondary-500 mb-1">Orders This Month</p>
                        <p className="text-2xl font-bold text-blue-600">{metrics?.totalOrders || 0}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="text-xs text-secondary-500 mb-1">Jobs This Month</p>
                        <p className="text-2xl font-bold text-purple-600">{metrics?.totalJobs || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-xs text-secondary-500 mb-1">Invoices Generated</p>
                        <p className="text-2xl font-bold text-green-600">{metrics?.totalInvoices || 0}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg text-center">
                        <p className="text-xs text-secondary-500 mb-1">Amount Received</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            ₹{(metrics?.totalReceived || 0).toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { trpc } from "@/lib/trpc";

export default function DashboardPage() {
    const { data: metrics, isLoading } = trpc.analytics.getDashboardMetrics.useQuery();

    if (isLoading) {
        return <div>Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
                <p className="text-secondary-600 mt-1">Welcome to Skyprint ERP</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Customers"
                    value={metrics?.totalCustomers || 0}
                    icon="👥"
                    color="blue"
                />
                <MetricCard
                    title="Orders This Month"
                    value={metrics?.totalOrders || 0}
                    icon="📋"
                    color="green"
                />
                <MetricCard
                    title="Active Jobs"
                    value={metrics?.activeJobs || 0}
                    icon="🏭"
                    color="purple"
                />
                <MetricCard
                    title="Total Revenue"
                    value={`₹${(metrics?.totalRevenue || 0).toLocaleString("en-IN")}`}
                    icon="💰"
                    color="yellow"
                />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                        Orders Status
                    </h3>
                    <div className="space-y-3">
                        <StatusRow
                            label="Pending Orders"
                            value={metrics?.pendingOrders || 0}
                            color="yellow"
                        />
                        <StatusRow
                            label="Jobs This Month"
                            value={metrics?.totalJobs || 0}
                            color="blue"
                        />
                        <StatusRow
                            label="Invoices Generated"
                            value={metrics?.totalInvoices || 0}
                            color="green"
                        />
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                        Financial Summary
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-secondary-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600">
                                ₹{(metrics?.totalRevenue || 0).toLocaleString("en-IN")}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-secondary-600">Received</p>
                            <p className="text-xl font-semibold text-secondary-900">
                                ₹{(metrics?.totalReceived || 0).toLocaleString("en-IN")}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-secondary-600">Outstanding</p>
                            <p className="text-xl font-semibold text-orange-600">
                                ₹{(metrics?.outstandingAmount || 0).toLocaleString("en-IN")}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                        Alerts & Notifications
                    </h3>
                    <div className="space-y-3">
                        {metrics?.overdueInvoices ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-medium text-red-800">
                                    {metrics.overdueInvoices} Overdue Invoices
                                </p>
                            </div>
                        ) : null}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-800">
                                {metrics?.activeJobs || 0} Jobs in Progress
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickAction href="/dashboard/crm/customers/new" icon="➕" label="Add Customer" />
                    <QuickAction href="/dashboard/crm/quotations/new" icon="📝" label="New Quotation" />
                    <QuickAction href="/dashboard/production/jobs/new" icon="🏭" label="Create Job" />
                    <QuickAction href="/dashboard/finance/invoices/new" icon="💳" label="New Invoice" />
                </div>
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
}) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
        yellow: "bg-yellow-50 text-yellow-600",
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-secondary-600">{title}</p>
                    <p className="text-2xl font-bold text-secondary-900 mt-1">{value}</p>
                </div>
                <div className={`text-4xl ${colorClasses[color as keyof typeof colorClasses]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function StatusRow({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-800",
        green: "bg-green-100 text-green-800",
        yellow: "bg-yellow-100 text-yellow-800",
    };

    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-700">{label}</span>
            <span
                className={`px-2 py-1 rounded-full text-sm font-medium ${colorClasses[color as keyof typeof colorClasses]
                    }`}
            >
                {value}
            </span>
        </div>
    );
}

function QuickAction({
    href,
    icon,
    label,
}: {
    href: string;
    icon: string;
    label: string;
}) {
    return (
        <a
            href={href}
            className="flex flex-col items-center justify-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
        >
            <span className="text-3xl mb-2">{icon}</span>
            <span className="text-sm font-medium text-secondary-700">{label}</span>
        </a>
    );
}

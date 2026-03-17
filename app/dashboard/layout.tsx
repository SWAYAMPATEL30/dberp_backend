"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const navItems = [
    { href: "/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/dashboard/crm", icon: "👥", label: "CRM & Sales" },
    { href: "/dashboard/production", icon: "🏭", label: "Production" },
    { href: "/dashboard/inventory", icon: "📦", label: "Inventory" },
    { href: "/dashboard/finance", icon: "💰", label: "Finance" },
    { href: "/dashboard/logistics", icon: "🚚", label: "Logistics" },
    { href: "/dashboard/hr", icon: "👤", label: "HR & Payroll" },
    { href: "/dashboard/analytics", icon: "📈", label: "Analytics" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-secondary-600">Loading Skyprint ERP...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Light Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"
                    } bg-white border-r border-secondary-200 text-secondary-900 flex flex-col`}
            >
                {/* Logo Area */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                S
                            </div>
                            <span className="font-bold text-lg text-secondary-900">Skyprint ERP</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-secondary-100 transition-colors text-secondary-400 hover:text-secondary-700"
                    >
                        {sidebarOpen ? "◀" : "▶"}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                    ? "bg-primary-50 text-primary-700 font-semibold border border-primary-200"
                                    : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                                    }`}
                                title={!sidebarOpen ? item.label : undefined}
                            >
                                <span className="text-lg flex-shrink-0">{item.icon}</span>
                                {sidebarOpen && (
                                    <span className="font-medium text-sm">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Area */}
                {sidebarOpen && (
                    <div className="p-4 border-t border-secondary-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                                {session.user.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-secondary-900 truncate">
                                    {session.user.name}
                                </p>
                                <p className="text-xs text-secondary-500 truncate">
                                    {session.user.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-secondary-500 hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                        >
                            🚪 <span>Sign Out</span>
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <div
                className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"
                    }`}
            >
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-secondary-200">
                    <div className="flex items-center justify-between h-14 px-6">
                        <div className="flex items-center gap-2 text-sm text-secondary-500">
                            <Link href="/dashboard" className="hover:text-primary-600">
                                Dashboard
                            </Link>
                            {pathname !== "/dashboard" && (
                                <>
                                    <span>/</span>
                                    <span className="text-secondary-900 font-medium capitalize">
                                        {pathname.split("/").slice(2).join(" / ")}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-secondary-500">
                                {new Date().toLocaleDateString("en-IN", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}

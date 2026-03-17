"use client";

import { trpc } from "@/lib/trpc";

export default function InventoryPage() {
    const { data: materialsData, isLoading: materialsLoading } = trpc.inventory.getMaterials.useQuery({ limit: 20 });
    const { data: posData, isLoading: posLoading } = trpc.inventory.getPurchaseOrders.useQuery({ limit: 10 });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Inventory</h1>
                    <p className="text-secondary-600 mt-1">Manage materials, purchase orders, and stock levels</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Total Materials</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                        {materialsData?.total || 0}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Purchase Orders</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                        {posData?.total || 0}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Low Stock Items</h3>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                        {materialsData?.materials?.filter((m: any) => {
                            const stock = m.stock?.[0]?.quantity || 0;
                            return stock <= m.reorderPoint;
                        }).length || 0}
                    </p>
                </div>
            </div>

            {/* Materials List */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-900">Materials</h2>
                </div>
                {materialsLoading ? (
                    <p className="text-secondary-500">Loading materials...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Unit</th>
                                    <th>Stock Qty</th>
                                    <th>Stock Value</th>
                                    <th>Reorder Point</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materialsData?.materials?.map((material: any) => {
                                    const stockQty = material.stock?.[0]?.quantity || 0;
                                    const stockValue = material.stock?.[0]?.value || 0;
                                    const isLow = stockQty <= material.reorderPoint;
                                    return (
                                        <tr key={material.id}>
                                            <td className="font-mono text-sm">{material.code}</td>
                                            <td className="font-medium">{material.name}</td>
                                            <td>
                                                <span className="badge-info">{material.category}</span>
                                            </td>
                                            <td>{material.unit}</td>
                                            <td className="font-semibold">{Number(stockQty).toLocaleString()}</td>
                                            <td>₹{Number(stockValue).toLocaleString("en-IN")}</td>
                                            <td>{Number(material.reorderPoint).toLocaleString()}</td>
                                            <td>
                                                <span className={isLow ? "badge-danger" : "badge-success"}>
                                                    {isLow ? "Low Stock" : "In Stock"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!materialsData?.materials || materialsData.materials.length === 0) && (
                                    <tr>
                                        <td colSpan={8} className="text-center text-secondary-500 py-8">
                                            No materials found. Add materials to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Purchase Orders */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-900">Recent Purchase Orders</h2>
                </div>
                {posLoading ? (
                    <p className="text-secondary-500">Loading purchase orders...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Vendor</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posData?.purchaseOrders?.map((po: any) => (
                                    <tr key={po.id}>
                                        <td className="font-mono text-sm">{po.poNumber}</td>
                                        <td className="font-medium">{po.vendor?.name || "-"}</td>
                                        <td>{new Date(po.poDate).toLocaleDateString()}</td>
                                        <td className="font-semibold">₹{Number(po.totalAmount).toLocaleString("en-IN")}</td>
                                        <td>
                                            <span
                                                className={
                                                    po.status === "received"
                                                        ? "badge-success"
                                                        : po.status === "approved"
                                                            ? "badge-info"
                                                            : "badge-secondary"
                                                }
                                            >
                                                {po.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!posData?.purchaseOrders || posData.purchaseOrders.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="text-center text-secondary-500 py-8">
                                            No purchase orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

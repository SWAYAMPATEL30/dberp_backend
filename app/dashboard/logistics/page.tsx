"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function LogisticsPage() {
    const [activeTab, setActiveTab] = useState<"shipments" | "eway">("shipments");
    const [showShipmentForm, setShowShipmentForm] = useState(false);
    const [showEWayForm, setShowEWayForm] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const { data: shipmentsData, isLoading, refetch } = trpc.logistics.getShipments.useQuery({ limit: 50 });
    const { data: ordersData } = trpc.crm.getSalesOrders.useQuery({ limit: 100 });

    const createShipment = trpc.logistics.createShipment.useMutation({
        onSuccess: () => {
            setSuccess("Shipment created successfully!");
            setShowShipmentForm(false);
            refetch();
            setTimeout(() => setSuccess(""), 3000);
        },
        onError: (err) => setError(err.message),
    });

    const generateEWayBill = trpc.logistics.generateEWayBill.useMutation({
        onSuccess: () => {
            setSuccess("E-Way Bill generated successfully!");
            setShowEWayForm(false);
            refetch();
            setTimeout(() => setSuccess(""), 3000);
        },
        onError: (err) => setError(err.message),
    });

    const handleCreateShipment = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const form = new FormData(e.currentTarget);
        createShipment.mutate({
            salesOrderId: form.get("salesOrderId") as string,
            shipmentDate: new Date(form.get("shipmentDate") as string),
            courierName: (form.get("courierName") as string) || undefined,
            trackingNumber: (form.get("trackingNumber") as string) || undefined,
            vehicleNumber: (form.get("vehicleNumber") as string) || undefined,
            driverName: (form.get("driverName") as string) || undefined,
            driverPhone: (form.get("driverPhone") as string) || undefined,
            notes: (form.get("notes") as string) || undefined,
        });
    };

    const handleGenerateEWayBill = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const form = new FormData(e.currentTarget);
        generateEWayBill.mutate({
            shipmentId: form.get("shipmentId") as string,
            docType: form.get("docType") as "invoice" | "challan",
            docNumber: form.get("docNumber") as string,
            docDate: new Date(form.get("docDate") as string),
            transporterId: (form.get("transporterId") as string) || undefined,
            transporterName: (form.get("transporterName") as string) || undefined,
            vehicleNumber: form.get("vehicleNumber") as string,
            vehicleType: (form.get("vehicleType") as string) || undefined,
            distance: form.get("distance") ? Number(form.get("distance")) : undefined,
        });
    };

    const shipments = shipmentsData?.shipments || [];
    const shipmentsWithoutEWayBill = shipments.filter((s: any) => !s.eWayBill);
    const eWayBills = shipments.filter((s: any) => s.eWayBill).map((s: any) => ({ ...s.eWayBill, shipment: s }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Logistics & Dispatch</h1>
                    <p className="text-secondary-600 mt-1">Manage shipments and e-way bill generation</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setShowShipmentForm(true); setShowEWayForm(false); }} className="btn-primary">
                        + New Shipment
                    </button>
                    <button onClick={() => { setShowEWayForm(true); setShowShipmentForm(false); }} className="btn-success">
                        📄 Generate E-Way Bill
                    </button>
                </div>
            </div>

            {error && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Total Shipments</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">{shipments.length}</p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Pending</h3>
                    <p className="text-3xl font-bold text-amber-600 mt-2">
                        {shipments.filter((s: any) => s.status === "pending").length}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">In Transit</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        {shipments.filter((s: any) => s.status === "in_transit").length}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">E-Way Bills Generated</h3>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{eWayBills.length}</p>
                </div>
            </div>

            {/* Create Shipment Form Modal */}
            {showShipmentForm && (
                <div className="card border-primary-200 bg-primary-50/30">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-secondary-900">Create New Shipment</h2>
                        <button onClick={() => setShowShipmentForm(false)} className="text-secondary-500 hover:text-secondary-700 text-xl">✕</button>
                    </div>
                    <form onSubmit={handleCreateShipment}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-group">
                                <label className="label">Sales Order <span className="text-red-500">*</span></label>
                                <select name="salesOrderId" className="select" required>
                                    <option value="">Select Order</option>
                                    {ordersData?.orders?.map((o: any) => (
                                        <option key={o.id} value={o.id}>{o.orderNumber} - {o.customer?.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Shipment Date <span className="text-red-500">*</span></label>
                                <input name="shipmentDate" type="date" className="input" required defaultValue={new Date().toISOString().split("T")[0]} />
                            </div>
                            <div className="form-group">
                                <label className="label">Courier / Transport</label>
                                <input name="courierName" className="input" placeholder="e.g. Blue Dart, Own Vehicle" />
                            </div>
                            <div className="form-group">
                                <label className="label">Tracking Number</label>
                                <input name="trackingNumber" className="input" placeholder="Tracking / LR number" />
                            </div>
                            <div className="form-group">
                                <label className="label">Vehicle Number</label>
                                <input name="vehicleNumber" className="input" placeholder="MH 01 AB 1234" />
                            </div>
                            <div className="form-group">
                                <label className="label">Driver Name</label>
                                <input name="driverName" className="input" placeholder="Driver name" />
                            </div>
                            <div className="form-group">
                                <label className="label">Driver Phone</label>
                                <input name="driverPhone" className="input" placeholder="+91 9876543210" />
                            </div>
                            <div className="form-group md:col-span-2">
                                <label className="label">Notes</label>
                                <input name="notes" className="input" placeholder="Delivery instructions..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowShipmentForm(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={createShipment.isPending} className="btn-primary">
                                {createShipment.isPending ? "Creating..." : "Create Shipment"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* E-Way Bill Generation Form */}
            {showEWayForm && (
                <div className="card border-emerald-200 bg-emerald-50/30">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-secondary-900">Generate E-Way Bill</h2>
                            <p className="text-sm text-secondary-500 mt-1">Required for goods movement exceeding ₹50,000 under GST</p>
                        </div>
                        <button onClick={() => setShowEWayForm(false)} className="text-secondary-500 hover:text-secondary-700 text-xl">✕</button>
                    </div>
                    <form onSubmit={handleGenerateEWayBill}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-group">
                                <label className="label">Shipment <span className="text-red-500">*</span></label>
                                <select name="shipmentId" className="select" required>
                                    <option value="">Select Shipment</option>
                                    {shipmentsWithoutEWayBill.map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.shipmentNumber} - {s.salesOrder?.customer?.name}
                                        </option>
                                    ))}
                                </select>
                                {shipmentsWithoutEWayBill.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No shipments without e-way bills. Create a shipment first.</p>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="label">Document Type <span className="text-red-500">*</span></label>
                                <select name="docType" className="select" required>
                                    <option value="invoice">Tax Invoice</option>
                                    <option value="challan">Delivery Challan</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Document Number <span className="text-red-500">*</span></label>
                                <input name="docNumber" className="input" required placeholder="INV-2024-001" />
                            </div>
                            <div className="form-group">
                                <label className="label">Document Date <span className="text-red-500">*</span></label>
                                <input name="docDate" type="date" className="input" required defaultValue={new Date().toISOString().split("T")[0]} />
                            </div>
                            <div className="form-group">
                                <label className="label">Transporter ID (GSTIN)</label>
                                <input name="transporterId" className="input" placeholder="22AAAAA0000A1Z5" />
                            </div>
                            <div className="form-group">
                                <label className="label">Transporter Name</label>
                                <input name="transporterName" className="input" placeholder="ABC Logistics" />
                            </div>
                            <div className="form-group">
                                <label className="label">Vehicle Number <span className="text-red-500">*</span></label>
                                <input name="vehicleNumber" className="input" required placeholder="MH 01 AB 1234" />
                            </div>
                            <div className="form-group">
                                <label className="label">Vehicle Type</label>
                                <select name="vehicleType" className="select">
                                    <option value="regular">Regular</option>
                                    <option value="over_dimensional">Over Dimensional Cargo</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Distance (km)</label>
                                <input name="distance" type="number" className="input" min="0" placeholder="150" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowEWayForm(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={generateEWayBill.isPending} className="btn-success">
                                {generateEWayBill.isPending ? "Generating..." : "📄 Generate E-Way Bill"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b border-secondary-200">
                <button
                    onClick={() => setActiveTab("shipments")}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "shipments"
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-secondary-500 hover:text-secondary-700"
                        }`}
                >
                    Shipments ({shipments.length})
                </button>
                <button
                    onClick={() => setActiveTab("eway")}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "eway"
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-secondary-500 hover:text-secondary-700"
                        }`}
                >
                    E-Way Bills ({eWayBills.length})
                </button>
            </div>

            {/* Shipments Tab */}
            {activeTab === "shipments" && (
                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Shipment #</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Courier</th>
                                    <th>Vehicle</th>
                                    <th>Status</th>
                                    <th>E-Way Bill</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-secondary-500">Loading...</td></tr>
                                ) : shipments.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-secondary-500">No shipments yet. Click &ldquo;+ New Shipment&rdquo; to create one.</td></tr>
                                ) : (
                                    shipments.map((shipment: any) => (
                                        <tr key={shipment.id}>
                                            <td className="font-mono text-sm">{shipment.shipmentNumber}</td>
                                            <td>{shipment.salesOrder?.customer?.name || "-"}</td>
                                            <td>{new Date(shipment.shipmentDate).toLocaleDateString("en-IN")}</td>
                                            <td>{shipment.courierName || "-"}</td>
                                            <td>{shipment.vehicleNumber || "-"}</td>
                                            <td>
                                                <span className={
                                                    shipment.status === "delivered" ? "badge-success" :
                                                        shipment.status === "in_transit" ? "badge-info" :
                                                            shipment.status === "pending" ? "badge-warning" :
                                                                "badge-secondary"
                                                }>
                                                    {shipment.status}
                                                </span>
                                            </td>
                                            <td>
                                                {shipment.eWayBill ? (
                                                    <span className="badge-success">✓ {shipment.eWayBill.eWayBillNo}</span>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowEWayForm(true)}
                                                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                                    >
                                                        Generate
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* E-Way Bills Tab */}
            {activeTab === "eway" && (
                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>E-Way Bill No.</th>
                                    <th>Shipment</th>
                                    <th>Doc Type</th>
                                    <th>Doc Number</th>
                                    <th>Vehicle</th>
                                    <th>Distance</th>
                                    <th>Generated</th>
                                    <th>Valid Until</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eWayBills.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-8 text-secondary-500">No e-way bills generated yet. Create a shipment first, then generate an e-way bill.</td></tr>
                                ) : (
                                    eWayBills.map((bill: any) => {
                                        const isExpired = new Date(bill.validUntil) < new Date();
                                        return (
                                            <tr key={bill.id}>
                                                <td className="font-mono text-sm font-semibold">{bill.eWayBillNo}</td>
                                                <td>{bill.shipment?.shipmentNumber}</td>
                                                <td className="capitalize">{bill.docType}</td>
                                                <td className="font-mono text-sm">{bill.docNumber}</td>
                                                <td>{bill.vehicleNumber}</td>
                                                <td>{bill.distance ? `${bill.distance} km` : "-"}</td>
                                                <td>{new Date(bill.generatedAt).toLocaleDateString("en-IN")}</td>
                                                <td>
                                                    <span className={isExpired ? "text-red-600 font-semibold" : ""}>
                                                        {new Date(bill.validUntil).toLocaleDateString("en-IN")}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={
                                                        isExpired ? "badge-danger" :
                                                            bill.status === "generated" ? "badge-success" :
                                                                "badge-secondary"
                                                    }>
                                                        {isExpired ? "Expired" : bill.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

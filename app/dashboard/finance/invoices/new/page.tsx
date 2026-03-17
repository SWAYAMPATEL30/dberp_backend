"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface InvoiceItem {
    description: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [items, setItems] = useState<InvoiceItem[]>([
        { description: "", hsnCode: "", quantity: 1, unitPrice: 0, taxRate: 18 },
    ]);
    const [discount, setDiscount] = useState(0);

    const { data: customersData } = trpc.crm.getCustomers.useQuery({ limit: 100 });

    const createInvoice = trpc.finance.createInvoice.useMutation({
        onSuccess: () => {
            setSuccess("Invoice created successfully!");
            setTimeout(() => router.push("/dashboard/finance"), 1500);
        },
        onError: (err) => setError(err.message),
    });

    const addItem = () => {
        setItems([...items, { description: "", hsnCode: "", quantity: 1, unitPrice: 0, taxRate: 18 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const updated = [...items];
        (updated[index] as any)[field] = value;
        setItems(updated);
    };

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalTax = items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100,
        0
    );
    const total = subtotal + totalTax - discount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!customerId) {
            setError("Please select a customer");
            return;
        }

        const form = e.target as HTMLFormElement;
        const invoiceDate = new Date((form.elements.namedItem("invoiceDate") as HTMLInputElement).value);
        const dueDate = new Date((form.elements.namedItem("dueDate") as HTMLInputElement).value);

        createInvoice.mutate({
            customerId,
            invoiceDate,
            dueDate,
            items: items.map((item) => ({
                description: item.description,
                hsnCode: item.hsnCode || undefined,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
            })),
            discount,
            notes: (form.elements.namedItem("notes") as HTMLTextAreaElement)?.value || undefined,
            terms: (form.elements.namedItem("terms") as HTMLTextAreaElement)?.value || undefined,
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <button onClick={() => router.back()} className="text-sm text-secondary-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
                    ← Back to Finance
                </button>
                <h1 className="text-3xl font-bold text-secondary-900">Create Invoice</h1>
                <p className="text-secondary-600 mt-1">Generate a GST-compliant invoice</p>
            </div>

            {error && <div className="alert-error mb-4">{error}</div>}
            {success && <div className="alert-success mb-4">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Invoice Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-group">
                            <label className="label">Customer <span className="text-red-500">*</span></label>
                            <select className="select" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                                <option value="">Select Customer</option>
                                {customersData?.customers?.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Invoice Date <span className="text-red-500">*</span></label>
                            <input name="invoiceDate" type="date" className="input" required defaultValue={new Date().toISOString().split("T")[0]} />
                        </div>
                        <div className="form-group">
                            <label className="label">Due Date <span className="text-red-500">*</span></label>
                            <input name="dueDate" type="date" className="input" required
                                defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                            />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-secondary-900">Line Items</h3>
                        <button type="button" onClick={addItem} className="btn-outline text-sm">+ Add Item</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="min-w-[180px]">Description</th>
                                    <th className="w-28">HSN Code</th>
                                    <th className="w-20">Qty</th>
                                    <th className="w-28">Rate (₹)</th>
                                    <th className="w-24">Tax %</th>
                                    <th className="w-28">Amount</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <input className="input" placeholder="Item description" value={item.description}
                                                onChange={(e) => updateItem(idx, "description", e.target.value)} required />
                                        </td>
                                        <td>
                                            <input className="input" placeholder="4901" value={item.hsnCode}
                                                onChange={(e) => updateItem(idx, "hsnCode", e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="number" className="input" min="1" value={item.quantity}
                                                onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                                        </td>
                                        <td>
                                            <input type="number" className="input" min="0" step="0.01" value={item.unitPrice}
                                                onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))} />
                                        </td>
                                        <td>
                                            <select className="select" value={item.taxRate}
                                                onChange={(e) => updateItem(idx, "taxRate", Number(e.target.value))}>
                                                <option value={0}>0%</option>
                                                <option value={5}>5%</option>
                                                <option value={12}>12%</option>
                                                <option value={18}>18%</option>
                                                <option value={28}>28%</option>
                                            </select>
                                        </td>
                                        <td className="font-semibold">₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}</td>
                                        <td>
                                            {items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">✕</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <div className="w-72 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary-600">Subtotal:</span>
                                <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary-600">GST:</span>
                                <span className="font-medium">₹{totalTax.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-secondary-600">Discount (₹):</span>
                                <input type="number" className="input w-28 text-right" value={discount}
                                    onChange={(e) => setDiscount(Number(e.target.value))} min="0" />
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-secondary-200">
                                <span>Total:</span>
                                <span className="text-primary-600">₹{total.toLocaleString("en-IN")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Notes</label>
                            <textarea name="notes" className="textarea" placeholder="Internal notes..." />
                        </div>
                        <div className="form-group">
                            <label className="label">Terms & Conditions</label>
                            <textarea name="terms" className="textarea" defaultValue="Payment due within 30 days" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={createInvoice.isPending} className="btn-primary">
                        {createInvoice.isPending ? "Creating..." : "Create Invoice"}
                    </button>
                </div>
            </form>
        </div>
    );
}

"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewJobPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const { data: ordersData } = trpc.crm.getSalesOrders.useQuery({ limit: 100 });

    const createJob = trpc.production.createJob.useMutation({
        onSuccess: () => {
            setSuccess("Job created successfully!");
            setTimeout(() => router.push("/dashboard/production"), 1500);
        },
        onError: (err) => setError(err.message),
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const form = new FormData(e.currentTarget);

        createJob.mutate({
            salesOrderId: form.get("salesOrderId") as string,
            description: form.get("description") as string,
            specifications: (form.get("specifications") as string) || undefined,
            quantity: Number(form.get("quantity")),
            dueDate: new Date(form.get("dueDate") as string),
            priority: (form.get("priority") as "low" | "normal" | "high" | "urgent") || "normal",
            estimatedCost: Number(form.get("estimatedCost")),
        });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <button onClick={() => router.back()} className="text-sm text-secondary-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
                    ← Back to Production
                </button>
                <h1 className="text-3xl font-bold text-secondary-900">Create Production Job</h1>
                <p className="text-secondary-600 mt-1">Create a new job from a sales order</p>
            </div>

            {error && <div className="alert-error mb-4">{error}</div>}
            {success && <div className="alert-success mb-4">{success}</div>}

            <form onSubmit={handleSubmit} className="card space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Job Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group md:col-span-2">
                            <label className="label">Sales Order <span className="text-red-500">*</span></label>
                            <select name="salesOrderId" className="select" required defaultValue="">
                                <option value="" disabled>Select Sales Order</option>
                                {ordersData?.orders?.map((order: any) => (
                                    <option key={order.id} value={order.id}>
                                        {order.orderNumber} - {order.customer?.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {ordersData?.orders?.length === 0 && (
                            <div className="form-group md:col-span-2">
                                <div className="text-sm text-amber-600">
                                    No sales orders found. <a href="/dashboard/crm/sales-orders/new" className="underline">Create a Sales Order</a> first.
                                </div>
                            </div>
                        )}

                        <div className="form-group md:col-span-2">
                            <label className="label">Job Description <span className="text-red-500">*</span></label>
                            <textarea name="description" className="textarea" required placeholder="Describe the printing job..." />
                        </div>
                        <div className="form-group md:col-span-2">
                            <label className="label">Specifications</label>
                            <textarea name="specifications" className="textarea" placeholder="Paper type, size, colors, finishing..." />
                        </div>
                        <div className="form-group">
                            <label className="label">Quantity <span className="text-red-500">*</span></label>
                            <input name="quantity" type="number" className="input" required min="1" placeholder="1000" />
                        </div>
                        <div className="form-group">
                            <label className="label">Due Date <span className="text-red-500">*</span></label>
                            <input name="dueDate" type="date" className="input" required />
                        </div>
                        <div className="form-group">
                            <label className="label">Priority</label>
                            <select name="priority" className="select" defaultValue="normal">
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Estimated Cost (₹) <span className="text-red-500">*</span></label>
                            <input name="estimatedCost" type="number" className="input" required min="0" step="0.01" placeholder="5000" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                    <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={createJob.isPending} className="btn-primary">
                        {createJob.isPending ? "Creating..." : "Create Job"}
                    </button>
                </div>
            </form>
        </div>
    );
}

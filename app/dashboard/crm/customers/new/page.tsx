"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const createCustomer = trpc.crm.createCustomer.useMutation({
        onSuccess: () => {
            setSuccess("Customer created successfully!");
            setTimeout(() => router.push("/dashboard/crm"), 1500);
        },
        onError: (err) => {
            setError(err.message);
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const form = new FormData(e.currentTarget);

        createCustomer.mutate({
            name: form.get("name") as string,
            email: (form.get("email") as string) || undefined,
            phone: (form.get("phone") as string) || undefined,
            gstin: (form.get("gstin") as string) || undefined,
            pan: (form.get("pan") as string) || undefined,
            billingAddress: (form.get("billingAddress") as string) || undefined,
            shippingAddress: (form.get("shippingAddress") as string) || undefined,
            city: (form.get("city") as string) || undefined,
            state: (form.get("state") as string) || undefined,
            pincode: (form.get("pincode") as string) || undefined,
            creditLimit: form.get("creditLimit") ? Number(form.get("creditLimit")) : undefined,
            creditDays: form.get("creditDays") ? Number(form.get("creditDays")) : undefined,
        });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-sm text-secondary-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1"
                >
                    ← Back to CRM
                </button>
                <h1 className="text-3xl font-bold text-secondary-900">Add New Customer</h1>
                <p className="text-secondary-600 mt-1">Fill in the customer details below</p>
            </div>

            {error && <div className="alert-error mb-4">{error}</div>}
            {success && <div className="alert-success mb-4">{success}</div>}

            <form onSubmit={handleSubmit} className="card space-y-6">
                {/* Basic Information */}
                <div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group md:col-span-2">
                            <label className="label">
                                Company / Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input name="name" type="text" className="input" required placeholder="Enter customer name" />
                        </div>
                        <div className="form-group">
                            <label className="label">Email</label>
                            <input name="email" type="email" className="input" placeholder="customer@example.com" />
                        </div>
                        <div className="form-group">
                            <label className="label">Phone</label>
                            <input name="phone" type="tel" className="input" placeholder="+91 9876543210" />
                        </div>
                    </div>
                </div>

                {/* Tax Details */}
                <div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Tax Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">GSTIN</label>
                            <input name="gstin" type="text" className="input" placeholder="22AAAAA0000A1Z5" maxLength={15} />
                        </div>
                        <div className="form-group">
                            <label className="label">PAN Number</label>
                            <input name="pan" type="text" className="input" placeholder="AAAAA0000A" maxLength={10} />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group md:col-span-2">
                            <label className="label">Billing Address</label>
                            <textarea name="billingAddress" className="textarea" placeholder="Full billing address" />
                        </div>
                        <div className="form-group md:col-span-2">
                            <label className="label">Shipping Address</label>
                            <textarea name="shippingAddress" className="textarea" placeholder="Full shipping address (leave empty if same as billing)" />
                        </div>
                        <div className="form-group">
                            <label className="label">City</label>
                            <input name="city" type="text" className="input" placeholder="Mumbai" />
                        </div>
                        <div className="form-group">
                            <label className="label">State</label>
                            <input name="state" type="text" className="input" placeholder="Maharashtra" />
                        </div>
                        <div className="form-group">
                            <label className="label">Pincode</label>
                            <input name="pincode" type="text" className="input" placeholder="400001" maxLength={6} />
                        </div>
                    </div>
                </div>

                {/* Credit Terms */}
                <div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Credit Terms</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Credit Limit (₹)</label>
                            <input name="creditLimit" type="number" className="input" placeholder="50000" min="0" />
                        </div>
                        <div className="form-group">
                            <label className="label">Credit Days</label>
                            <input name="creditDays" type="number" className="input" placeholder="30" min="0" max="365" />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                    <button type="button" onClick={() => router.back()} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={createCustomer.isPending} className="btn-primary">
                        {createCustomer.isPending ? "Creating..." : "Create Customer"}
                    </button>
                </div>
            </form>
        </div>
    );
}

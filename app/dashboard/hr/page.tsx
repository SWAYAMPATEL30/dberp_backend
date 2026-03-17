"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function HRPage() {
    const { data: employees, isLoading: employeesLoading } = trpc.hr.getEmployees.useQuery();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const currentDate = new Date();
    const [payrollMonth] = useState(currentDate.getMonth() + 1);
    const [payrollYear] = useState(currentDate.getFullYear());

    const { data: payrolls, isLoading: payrollsLoading, refetch } = trpc.hr.getPayrolls.useQuery({
        month: payrollMonth,
        year: payrollYear,
    });

    const processPayroll = trpc.hr.processPayroll.useMutation({
        onError: (err) => {
            setError(err.message);
            setTimeout(() => setError(""), 4000);
        },
    });

    const handleProcessPayroll = async () => {
        if (!employees || employees.length === 0) {
            setError("No employees found to process payroll for.");
            return;
        }

        const monthLabel = new Date(payrollYear, payrollMonth - 1).toLocaleString("default", { month: "long", year: "numeric" });
        if (!confirm(`Process payroll for ${monthLabel} for ${employees.length} employee(s)?`)) {
            return;
        }

        setIsProcessing(true);
        setError("");

        try {
            for (const emp of employees) {
                await processPayroll.mutateAsync({
                    employeeId: emp.id,
                    month: payrollMonth,
                    year: payrollYear,
                });
            }
            setSuccess(`Payroll processed successfully for ${employees.length} employee(s)!`);
            refetch();
            setTimeout(() => setSuccess(""), 4000);
        } catch {
            // Error handled by mutation onError
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Human Resources</h1>
                    <p className="text-secondary-600 mt-1">Manage employees, attendance, and payroll</p>
                </div>
                <button
                    onClick={handleProcessPayroll}
                    disabled={isProcessing}
                    className="btn-primary"
                >
                    {isProcessing ? "Processing..." : "💰 Process Payroll"}
                </button>
            </div>

            {error && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Total Employees</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                        {employees?.length || 0}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Departments</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                        {employees ? new Set(employees.map((e: any) => e.department)).size : 0}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Payrolls Processed</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">
                        {payrolls?.length || 0}
                        <span className="text-sm font-normal text-secondary-500 ml-2">
                            ({new Date(payrollYear, payrollMonth - 1).toLocaleString("default", { month: "long", year: "numeric" })})
                        </span>
                    </p>
                </div>
            </div>

            {/* Employee Directory */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-900">Employee Directory</h2>
                </div>
                {employeesLoading ? (
                    <p className="text-secondary-500">Loading employees...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Department</th>
                                    <th>Designation</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees?.map((emp: any) => (
                                    <tr key={emp.id}>
                                        <td className="font-mono text-sm">{emp.employeeCode}</td>
                                        <td className="font-medium">{emp.firstName} {emp.lastName}</td>
                                        <td>{emp.email || "-"}</td>
                                        <td>{emp.phone || "-"}</td>
                                        <td>
                                            <span className="badge-info">{emp.department}</span>
                                        </td>
                                        <td>{emp.designation || "-"}</td>
                                        <td>{new Date(emp.dateOfJoining).toLocaleDateString()}</td>
                                        <td>
                                            <span className={emp.isActive ? "badge-success" : "badge-danger"}>
                                                {emp.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!employees || employees.length === 0) && (
                                    <tr>
                                        <td colSpan={8} className="text-center text-secondary-500 py-8">
                                            No employees found. Add employees to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payroll */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-900">
                        Payroll - {new Date(payrollYear, payrollMonth - 1).toLocaleString("default", { month: "long", year: "numeric" })}
                    </h2>
                </div>
                {payrollsLoading ? (
                    <p className="text-secondary-500">Loading payroll data...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Basic Salary</th>
                                    <th>PF (Employee)</th>
                                    <th>ESI</th>
                                    <th>TDS</th>
                                    <th>Deductions</th>
                                    <th>Net Salary</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrolls?.map((payroll: any) => (
                                    <tr key={payroll.id}>
                                        <td className="font-medium">
                                            {payroll.employee?.firstName} {payroll.employee?.lastName}
                                        </td>
                                        <td>₹{Number(payroll.basicSalary).toLocaleString("en-IN")}</td>
                                        <td>₹{Number(payroll.pfEmployee).toLocaleString("en-IN")}</td>
                                        <td>₹{Number(payroll.esiEmployee).toLocaleString("en-IN")}</td>
                                        <td>₹{Number(payroll.tds).toLocaleString("en-IN")}</td>
                                        <td className="text-red-600">₹{Number(payroll.totalDeductions).toLocaleString("en-IN")}</td>
                                        <td className="font-bold text-green-600">₹{Number(payroll.netSalary).toLocaleString("en-IN")}</td>
                                        <td>
                                            <span
                                                className={
                                                    payroll.status === "paid"
                                                        ? "badge-success"
                                                        : payroll.status === "approved"
                                                            ? "badge-info"
                                                            : "badge-secondary"
                                                }
                                            >
                                                {payroll.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!payrolls || payrolls.length === 0) && (
                                    <tr>
                                        <td colSpan={8} className="text-center text-secondary-500 py-8">
                                            No payroll records for this month. Process payroll to generate records.
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

"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";

export default function ProductionPage() {
    const { data: jobsData } = trpc.production.getJobs.useQuery({ limit: 10 });
    const { data: machines } = trpc.production.getMachines.useQuery();

    const pendingJobs = jobsData?.jobs.filter((j: any) => j.status === "pending").length || 0;
    const activeJobs = jobsData?.jobs.filter((j: any) => j.status === "in_progress").length || 0;
    const completedJobs = jobsData?.jobs.filter((j: any) => j.status === "completed").length || 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Production Management</h1>
                    <p className="text-secondary-600 mt-1">Manage jobs, scheduling, and production workflow</p>
                </div>
                <Link href="/dashboard/production/jobs/new" className="btn-primary">
                    + Create Job
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Pending Jobs</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingJobs}</p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">In Progress</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{activeJobs}</p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Completed</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{completedJobs}</p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-secondary-600">Active Machines</h3>
                    <p className="text-3xl font-bold text-secondary-900 mt-2">{machines?.length || 0}</p>
                </div>
            </div>

            {/* Jobs List */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-900">Production Jobs</h2>
                    <Link href="/dashboard/production/schedule" className="text-primary-600 hover:text-primary-700">
                        View Schedule →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Job #</th>
                                <th>Customer</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Due Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobsData?.jobs.map((job: any) => (
                                <tr key={job.id}>
                                    <td className="font-mono text-sm">{job.jobNumber}</td>
                                    <td>{job.salesOrder.customer.name}</td>
                                    <td className="max-w-xs truncate">{job.description}</td>
                                    <td>{Number(job.quantity)}</td>
                                    <td>{new Date(job.dueDate).toLocaleDateString()}</td>
                                    <td>
                                        <span
                                            className={
                                                job.priority === "urgent"
                                                    ? "badge-danger"
                                                    : job.priority === "high"
                                                        ? "badge-warning"
                                                        : "badge-secondary"
                                            }
                                        >
                                            {job.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={
                                                job.status === "completed"
                                                    ? "badge-success"
                                                    : job.status === "in_progress"
                                                        ? "badge-info"
                                                        : "badge-secondary"
                                            }
                                        >
                                            {job.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Machines Status */}
            <div className="card">
                <h2 className="text-xl font-semibold text-secondary-900 mb-4">Machine Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {machines?.map((machine: any) => (
                        <div key={machine.id} className="border border-secondary-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-secondary-900">{machine.name}</h3>
                                    <p className="text-sm text-secondary-600">{machine.type}</p>
                                </div>
                                <span className="badge-success">Active</span>
                            </div>
                            <div className="mt-3">
                                <p className="text-xs text-secondary-600">Upcoming Jobs</p>
                                <p className="text-lg font-semibold text-secondary-900">
                                    {machine.schedules.length}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

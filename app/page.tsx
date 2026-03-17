import { redirect } from "next/navigation";

export default function HomePage() {
    redirect("/dashboard");
    return null; // This line will never be reached, but TypeScript requires it
}

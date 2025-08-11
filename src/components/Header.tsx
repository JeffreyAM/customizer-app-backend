"use client"

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";

export default function Header() {
    const { user, signOut } = useAuth();

    const pathname = usePathname();

    const titles: Record<string, string> = {
        "/dashboard": "Template Dashboard",
        "/syncedProducts": "Synced Products",
    }
    const linkClass = (path: string) =>
        `text-md font-medium ${pathname === path
            ? "text-blue-600 underline"
            : "text-gray-700 hover:text-blue-500 transition-colors"
        }`;
    const headerTitle = titles[pathname] || "Dashboard";
    return (
        <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                    <h1 className="text-3xl font-bold text-gray-900">{headerTitle}</h1>
                    <div className="flex space-x-8">
                        <p className={linkClass("/dashboard")}><Link href="/dashboard" >Dashboard</Link></p>
                        <p className={linkClass("/syncedProducts")}><Link href="/syncedProducts">Synced Products</Link></p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Welcome, Admin</span>
                        <button
                            onClick={signOut}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
"use client";
import React, { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
    HiLogout,
    HiMenu,
    HiX,
    HiChevronDown,
    HiChevronUp,
} from "react-icons/hi";
import { auth } from "@/lib/firebase";
import NavigationItem, { NavigationItemProps } from "./NavigationItem";
import { useNavStore } from "@/store/navStore";
import { useAccountStore } from "@/store/accountStore";
import Image from "next/image";
import type { Account, BHW } from "@/interface/user";

// Types and Interfaces
interface NavLayoutProps {
    children: ReactNode;
    primaryNavItems: NavigationItemProps[];
    secondaryNavItems: NavigationItemProps[];
}


/**
 * AdminLayout Component
 * Provides the main layout structure for admin pages including:
 * - Sidebar navigation
 * - Header with admin portal branding
 * - Navigation menu with active state handling
 * - Logout functionality
 * - Content area for child components
 * - Responsive mobile menu
 * - Notifications for pending item requests
 */
const NavLayout: React.FC<NavLayoutProps> = ({ children, primaryNavItems, secondaryNavItems }) => {
    const router = useRouter();
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useNavStore();
    const [showSecondary, setShowSecondary] = useState(false);
    const { account } = useAccountStore();

    const bhwAccount = account?.role === "bhw" ? (account as unknown as BHW) : undefined;
    const bhwProfilePictureUrl = bhwAccount?.profilePicture;
    const adminAccount = account?.role === "admin" ? (account as unknown as Account) : undefined;
    const adminProfilePictureUrl = adminAccount?.profilePicture;
    /**
     * Handles user logout
     * Signs out the user and redirects to home page
     */
    const handleLogout = async (): Promise<void> => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="flex h-screen bg-base-100">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-primary text-white"
            >
                {isMobileMenuOpen ? (
                    <HiX className="w-6 h-6" />
                ) : (
                    <HiMenu className="w-6 h-6" />
                )}
            </button>

            {/* Sidebar */}
            <div
                className={`fixed lg:static w-80 bg-gradient-to-t from-primary to-secondary shadow-xl flex flex-col h-full z-40 border-r border-primary-content/20 transition-transform duration-300 ${
                    isMobileMenuOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Header Section */}
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Image
                            src="/img/logo.png"
                            alt="Barangay Health Connect"
                            width={80}
                            height={80}
                            className="object-contain border-4 shadow-lg border-white rounded-full"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Barangay Health Connect
                            </h2>
                            <p className="text-xs text-white">Stay Connected, Stay Healthy</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto p-4 text-white">
                    <ul className="menu p-0 w-full space-y-2">
                        {primaryNavItems.map((item) => (
                            <NavigationItem key={item.href} {...item} />
                        ))}
                        {secondaryNavItems.length > 0 && (
                            <>
                                <li>
                                    <button
                                        className="btn btn-ghost w-full mt-2"
                                        onClick={() =>
                                            setShowSecondary((prev) => !prev)
                                        }
                                    >
                                        {showSecondary ? "Hide More" : "Show More"}
                                        {showSecondary ? (
                                            <HiChevronUp className="w-5 h-5" />
                                        ) : (
                                            <HiChevronDown className="w-5 h-5" />
                                        )}
                                    </button>
                                </li>
                                {showSecondary &&
                                    secondaryNavItems.map((item) => (
                                        <NavigationItem key={item.href} {...item} />
                                    ))}
                            </>
                        )}
                    </ul>
                </div>

                {/* Footer Section with Logout */}
                <div className="p-4 border-t border-primary-content/20 space-y-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 p-4 rounded-xl text-white hover:bg-white/20 transition-all duration-200 group w-full"
                    >
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <HiLogout className="w-5 h-5" />
                        </div>
                        <span className="truncate font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden bg-base-50">
                {/* Top Header */}
                <header className="sticky top-0 z-20 bg-secondary text-white shadow">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
                        <div className="items-center gap-3 md:mr-0 md:ml-auto  flex flex-row-reverse md:flex-row">
                            <div className="text-left md:text-right leading-tight">
                                <div className="text-sm sm:text-base font-extrabold uppercase">
                                    {account?.role === "bhw" && account?.name}
                                    {account?.role === "admin" && account?.name}
                                    {account?.role === "household" && account?.headOfHousehold}
                                </div>
                                <div className="text-[10px] sm:text-xs opacity-90">
                                    {account?.role === "bhw" ? "Barangay Health Worker" : account?.role === "admin" ? "Administrator" : "Household"}
                                </div>
                            </div>
                            {bhwProfilePictureUrl || adminProfilePictureUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={bhwProfilePictureUrl || adminProfilePictureUrl}
                                    alt="User Badge"
                                    width={36}
                                    height={36}
                                    className="h-10 w-10 object-cover border-2 shadow border-white bg-white rounded-full"
                                />
                            ) : (
                                <Image
                                    src="/img/logo.png"
                                    alt="User Badge"
                                    width={36}
                                    height={36}
                                    className="object-cover border-2 shadow border-white rounded-full"
                                />
                            )}
                        </div>
                    </div>
                </header>

                <div className="h-full overflow-y-auto">
                    <div className="p-4 lg:p-8">
                        <div className="max-w-7xl mx-auto martian-mono">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavLayout;
"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { 
    FaCalendarAlt, 
    FaArrowRight,
    FaChevronLeft,
    FaLayerGroup,
    FaCalendarWeek
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface MenuItem {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    gradientFrom: string;
    gradientTo: string;
    bgGradient: string;
}

const ReportsPage = () => {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const menuItems: MenuItem[] = [
        {
            href: "/admin/reports/monthly",
            icon: FaCalendarAlt,
            label: "Monthly Reports",
            description: "View monthly reports submitted by Barangay Health Workers",
            gradientFrom: "from-secondary",
            gradientTo: "to-secondary/80",
            bgGradient: "bg-gradient-to-br from-secondary/10 to-secondary/5"  
        },
        {
            href: "/admin/reports/weekly",
            icon: FaCalendarWeek,
            label: "Weekly Reports",
            description: "View weekly reports submitted by Barangay Health Workers",
            gradientFrom: "from-secondary",
            gradientTo: "to-secondary/80",
            bgGradient: "bg-gradient-to-br from-secondary/10 to-secondary/5"  
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200/50 to-base-100 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section with Animation */}
                <div 
                    className={`mb-8 md:mb-12 transition-all duration-700 ${
                        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg">
                            <FaLayerGroup className="text-xl text-white" />
                        </div>
                        <h1 className="text-2xl group-hover:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                            Reports Management
                        </h1>
                    </div>
                    <p className="text-xs font-semibold group-hover:text-sm text-zinc-500 max-w-2xl leading-relaxed">
                        Access comprehensive reports, summaries, and analytics for reports management
                    </p>
                </div>

                {/* Cards Grid with Staggered Animation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        const delay = index * 150;
                        
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-500 border border-zinc-200/50 hover:border-primary/30 ${
                                    mounted 
                                        ? 'opacity-100 translate-y-0' 
                                        : 'opacity-0 translate-y-8'
                                }`}
                                style={{
                                    transitionDelay: `${delay}ms`
                                }}
                            >
                                {/* Gradient Background Overlay */}
                                <div className={`absolute inset-0 ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                
                                {/* Content */}
                                <div className="relative p-6 md:p-8">
                                    {/* Icon Container with Animation */}
                                    <div className="mb-6 relative">
                                        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} shadow-lg group-hover:scale-110 group-hover:rotate-8 transition-all duration-500`}>
                                            <Icon className="text-3xl text-white group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        {/* Decorative Circle */}
                                        <div className={`absolute -top-2 -right-2 w-16 h-16 rounded-full bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} opacity-20 blur-xl group-hover:opacity-30 group-hover:scale-150 transition-all duration-700`} />
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-lg group-hover:text-xl font-bold text-zinc-600 mb-3 group-hover:text-primary transition-all duration-300">
                                        {item.label}
                                    </h2>

                                    {/* Description */}
                                    <p className="text-xs text-zinc-500 mb-6 leading-relaxed line-clamp-3">
                                        {item.description}
                                    </p>

                                    {/* Action Button */}
                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-200 group-hover:border-primary/30 transition-colors duration-300">
                                        <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            View Details
                                        </span>
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} text-white shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                                            <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform duration-300" />
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Effect Border */}
                                <div className={`absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-gradient-to-br ${item.gradientFrom} ${item.gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} 
                                    style={{
                                        background: `linear-gradient(${item.gradientFrom}, ${item.gradientTo}) padding-box, linear-gradient(${item.gradientFrom}, ${item.gradientTo}) border-box`,
                                        borderImage: `linear-gradient(135deg, var(--color-primary), var(--color-secondary)) 1`
                                    }}
                                />
                            </Link>
                        );
                    })}
                </div>

                {/* Back Button with Animation */}
                <div 
                    className={`mt-8 md:mt-12 transition-all duration-700 ${
                        mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}
                    style={{ transitionDelay: '450ms' }}
                >
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-primary bg-white border hover:shadow-lg hover:shadow-primary/50 border-zinc-300 hover:border-primary/50 shadow-sm transition-all duration-300"
                    >
                        <FaChevronLeft className="text-xs group-hover:-translate-x-1 transition-transform duration-300" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
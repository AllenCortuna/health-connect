// Use client directive for interactivity
"use client";

import React from "react";
// Import necessary icons from React Icons (e.g., Ant Design Icons - Ai)
import { 
    AiOutlineUser, 
    AiOutlineSafety, 
    AiOutlineArrowRight, 
    AiOutlineHeart, 
    AiOutlineTeam 
} from "react-icons/ai"; // Using Ai (Ant Design Icons) for a modern look
import Image from "next/image";
import Link from "next/link"; 

// Define the component using a clear type annotation
const LoginPage: React.FC = () => {

    // Define the options as an array of objects for easier mapping and maintenance
    const loginOptions = [
        {
            href: "/login/resident",
            title: "Household Login",
            subtitle: "Access your health records and services.",
            // Used AiOutlineUser for resident
            icon: AiOutlineUser,
            color: "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20",
        },
        {
            href: "/login/bhw-admin",
            title: "BHW / Admin Login",
            subtitle: "Manage patient data and community health programs.",
            // Used AiOutlineSafety for admin/security
            icon: AiOutlineSafety,
            color: "text-purple-400 bg-purple-400/10 hover:bg-purple-400/20",
        },
    ];

    const signUpOptions = [
        {
            href: "/sign-up/resident",
            title: "Household Sign Up",
            // Used AiOutlineHeart for health/resident
            icon: AiOutlineHeart,
            color: "text-teal-400 bg-teal-400/10 hover:bg-teal-400/20",
        },
        {
            href: "/sign-up/bhw",
            title: "BHW Sign Up",
            // Used AiOutlineTeam for community/BHW role
            icon: AiOutlineTeam,
            color: "text-pink-400 bg-pink-400/10 hover:bg-pink-400/20",
        },
    ];

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="min-h-screen bg-primary flex flex-col lg:flex-row">
            
            {/* LEFT SIDE: Promotional/Aesthetic Panel (Inspired by the grid squares) */}
            <div className="lg:w-1/2 p-8 lg:p-12 text-white flex flex-col justify-between bg-primary-darker"> 
                
                {/* Header/Logo Section */}
                <header className="flex items-center space-x-3">
                    <div className="relative w-10 h-10 animate-spin-slow">
                        {/* Placeholder for a logo/icon inspired by the central square */}
                        <div className="w-full h-full rounded-full bg-accent flex items-center justify-center shadow-2xl">
                            <Image src="/img/logo.png" alt="Barangay Health Connect" width={100} height={100} className="object-contain" />
                        </div>
                    </div>
                    <h1 className="text-xl font-bold tracking-wider martian-mono">
                        Barangay Health Connect
                    </h1>
                </header>

                {/* Core Messaging / Feature Cards (Inspired by the yellow/purple blocks) */}
                <div className="space-y-6 my-10 lg:my-0">
                    <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                        Your Digital Gateway to <span className="text-accent-light">Community Wellness</span>.
                    </h2>
                    
                    {/* Feature Highlight 1 (Yellow Block) */}
                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-yellow-400/20 border-l-4 border-yellow-400 shadow-xl transition-all duration-500 hover:shadow-2xl">
                        {/* Feature Icon using React Icons */}
                        <AiOutlineHeart className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" /> 
                        <div>
                            <p className="font-semibold text-lg">Total Care.</p>
                            <p className="text-zinc-300">Secure, confidential, and comprehensive health management for every resident.</p>
                        </div>
                    </div>

                    {/* Feature Highlight 2 (Purple Block) */}
                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-purple-400/20 border-l-4 border-purple-400 shadow-xl transition-all duration-500 hover:shadow-2xl">
                        {/* Feature Icon using React Icons */}
                        <AiOutlineSafety className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" /> 
                        <div>
                            <p className="font-semibold text-lg">Building Trust.</p>
                            <p className="text-zinc-300">Empowering health workers with reliable tools and real-time data.</p>
                        </div>
                    </div>
                </div>

                {/* Footer/Slogan */}
                <footer className="text-sm text-zinc-500 hidden lg:block">
                    &copy; 2025 Barangay Health Connect. Connecting communities, empowering health.
                </footer>
            </div>

            {/* RIGHT SIDE: Login/Sign Up Options (The main action area) */}
            <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                <div className="w-full max-w-lg space-y-12">
                    
                    {/* Main Title Section */}
                    <section className="text-center lg:text-left">
                        <p className="text-accent font-semibold uppercase tracking-widest text-sm mb-2">
                            Welcome
                        </p>
                        <h2 className="text-4xl font-extrabold text-white">
                            How will you connect today?
                        </h2>
                    </section>

                    {/* Login Options Section */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
                            Access Your Account
                        </h3>
                        {loginOptions.map((option) => {
                            const IconComponent = option.icon; // Assign the React Icon component
                            return (
                                <Link key={option.title} href={option.href}
                                    className={`flex items-center p-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${option.color} group`}>
                                    {/* Render the React Icon */}
                                    <IconComponent className="w-8 h-8 mr-4 flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className="text-lg font-bold text-white">{option.title}</p>
                                        <p className="text-sm text-zinc-300 group-hover:text-white transition-colors duration-300">{option.subtitle}</p>
                                    </div>
                                    {/* Arrow Icon using React Icons */}
                                    <AiOutlineArrowRight className="w-5 h-5 ml-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                                </Link>
                            );
                        })}
                    </section>
                    
                    {/* Divider and Sign Up Options */}
                    <div className="relative flex justify-center py-4">
                        <div className="w-full border-t border-zinc-700"></div>
                        <span className="absolute top-1/2 transform -translate-y-1/2 px-4 text-sm text-zinc-500 bg-primary">
                            Need an Account?
                        </span>
                    </div>

                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {signUpOptions.map((option) => {
                            const IconComponent = option.icon; // Assign the React Icon component
                            return (
                                <Link key={option.title} href={option.href}
                                    className={`text-center p-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.05] ${option.color} group`}>
                                    {/* Render the React Icon */}
                                    <IconComponent className="w-8 h-8 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                                    <p className="font-semibold text-white">{option.title}</p>
                                </Link>
                            );
                        })}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/dist/client/link";

const LoginPage: React.FC = () => {

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="min-h-screen bg-gradient-to-bl from-primary to-accent flex items-center justify-center p-4 animate-gradient-x">
            <div className="w-full max-w-md space-y-8 transform hover:scale-[1.01] transition-transform duration-300">
                {/* Header Section */}
                <section className="text-center space-y-4">
                    <div className="relative mx-auto w-20 h-20">
                        <Image
                            src="/img/logo.png"
                            alt="Barangay Health Connect"
                            width={100}
                            height={100}
                            className="object-contain border-4 shadow-lg border-white rounded-full"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white martian-mono">
                            Barangay Health Connect
                        </h1>
                    </div>
                </section>

                <section className="flex flex-col gap-4 text-center text-zinc-300"> 
                    <Link href="/login/resident" className="hover:text-white transition-all duration-300 hover:underline hover:font-semibold">Login as Resident</Link>
                    <Link href="/login/bhw-admin" className="hover:text-white transition-all duration-300 hover:underline hover:font-semibold">Login as BHW/Admin</Link>
                    <Link href="/sign-up/resident" className="hover:text-white transition-all duration-300 hover:underline hover:font-semibold">Sign Up as Resident</Link>
                    <Link href="/sign-up/bhw" className="hover:text-white transition-all duration-300 hover:underline hover:font-semibold">Sign Up as BHW</Link>
                </section>
            </div>
        </div>
    );
};

export default LoginPage;

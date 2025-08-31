"use client";

import React, { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { successToast, errorToast } from "@/lib/toast";
import { MdEmail, MdRefresh } from "react-icons/md";

interface EmailVerificationPromptProps {
    userEmail: string;
}

const EmailVerificationPrompt: React.FC<EmailVerificationPromptProps> = ({ userEmail }) => {
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleResendVerification = async () => {
        if (countdown > 0) return;
        
        setIsResending(true);
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                successToast("Verification email sent! Please check your inbox.");
                setCountdown(60); // Start 60 second countdown
                
                // Countdown timer
                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } catch (error) {
            console.error("Error sending verification email:", error);
            errorToast("Failed to send verification email. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary/5 to-secondary/10">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
                            <MdEmail className="text-3xl text-secondary" />
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-extrabold text-secondary mb-2">
                        Verify Your Email
                    </h2>
                    
                    <p className="text-base-content/70 text-xs font-semibold mb-4">
                        We&apos;ve sent a verification email to:
                    </p>
                    
                    <div className="bg-base-200 rounded-lg p-3 mb-6">
                        <p className="font-medium text-secondary">{userEmail}</p>
                    </div>
                    
                    <p className="text-base-content/60 text-xs mb-6">
                        Please check your email and click the verification link to continue.
                        If you don&apos;t see the email, check your spam folder.
                    </p>
                    
                    <button
                        onClick={handleResendVerification}
                        disabled={isResending || countdown > 0}
                        className="btn btn-secondary w-full"
                    >
                        {isResending ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : countdown > 0 ? (
                            `Resend in ${countdown}s`
                        ) : (
                            <>
                                <MdRefresh className="mr-2" />
                                Resend Verification Email
                            </>
                        )}
                    </button>
                    
                    <div className="divider mt-6 mb-2"></div>
                    
                    <p className="text-xs text-base-content/50">
                        After verifying your email, please refresh the page or sign in again.
                    </p>
                    <button onClick={() => window.location.reload()} className="btn btn-xs btn-secondary mx-auto">
                        refresh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPrompt;

"use client";

import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
    HiUser,
    HiLockClosed,
    HiEye,
    HiEyeOff,
    HiShieldCheck,
} from "react-icons/hi";
import { MdError } from "react-icons/md";
import { auth, db } from "@/lib/firebase";
import { Account } from "@/interface/user";
import { useAccountStore } from "@/store/accountStore";
import Image from "next/image";
import Link from "next/link";
// import Link from "next/link";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Form data structure for admin login
 */
interface FormData {
    username: string;
    password: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of failed login attempts before lockout */
const MAX_ATTEMPTS = 5;

/** Lockout duration in milliseconds (30 seconds) */
const LOCKOUT_TIME = 30000;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * LoginPage Component
 *
 * Provides secure authentication for admin users with the following features:
 * - Username/password authentication via Firebase
 * - Rate limiting with temporary lockout after failed attempts
 * - Password visibility toggle
 * - Form validation and error handling
 * - Responsive design with loading states
 */
const LoginPage: React.FC = () => {
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================

    /** Form input data */
    const [formData, setFormData] = useState<FormData>({
        username: "",
        password: "",
    });

    /** Password visibility toggle state */
    const [showPassword, setShowPassword] = useState<boolean>(false);

    /** Error message display */
    const [error, setError] = useState<string>("");

    /** Loading state during authentication */
    const [loading, setLoading] = useState<boolean>(false);

    /** Failed login attempts counter */
    const [attempts, setAttempts] = useState<number>(0);

    /** Account lockout state */
    const [isLocked, setIsLocked] = useState<boolean>(false);

    // ========================================================================
    // HOOKS
    // ========================================================================

    const router = useRouter();
    const { setAccount } = useAccountStore();

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * Auto-unlock account after lockout period expires
     * Resets attempts counter and clears error messages
     */
    useEffect(() => {
        if (isLocked) {
            const timer = setTimeout(() => {
                setIsLocked(false);
                setAttempts(0);
                setError("");
            }, LOCKOUT_TIME);

            // Cleanup timer on component unmount or dependency change
            return () => clearTimeout(timer);
        }
    }, [isLocked]);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Handles input field changes with automatic error clearing
     * @param field - The form field being updated
     * @returns Event handler function
     */
    const handleInputChange =
        (field: keyof FormData) =>
        (e: React.ChangeEvent<HTMLInputElement>): void => {
            setFormData((prev) => ({
                ...prev,
                [field]: e.target.value.trim(),
            }));

            // Clear error when user starts typing
            if (error) setError("");
        };

    /**
     * Handles form submission and authentication process
     * @param e - Form submission event
     */
    const handleLogin = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();

        // ====================================================================
        // VALIDATION
        // ====================================================================

        // Check for empty fields
        if (!formData.username || !formData.password) {
            setError("Please enter both username and password");
            return;
        }

        // Check if account is locked
        if (isLocked) {
            setError(
                `Too many attempts. Please try again in ${
                    LOCKOUT_TIME / 1000
                } seconds.`
            );
            return;
        }

        // ====================================================================
        // AUTHENTICATION PROCESS
        // ====================================================================

        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(
                auth,
                formData.username,
                formData.password
            );

            const accountsRef = collection(db, "resident");
            const q = query(
                accountsRef,
                where("email", "==", formData.username),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("Account not found");
            }

            const doc = querySnapshot.docs[0];
            const accountData = {
                ...doc.data(),
                id: doc.id
            } as Account;

            if (!accountData.email) {
                throw new Error("Account not found");
            }


            console.log("accountData", accountData);
            setAccount(accountData);
            if (accountData.role === "resident") {
                router.push("/resident/dashboard");
            }
        } catch (err) {
            // ================================================================
            // ERROR HANDLING
            // ================================================================

            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            // Check if max attempts reached
            if (newAttempts >= MAX_ATTEMPTS) {
                setIsLocked(true);
                setError(
                    `Too many failed attempts. Please try again in ${
                        LOCKOUT_TIME / 1000
                    } seconds.`
                );
            } else {
                // Parse and display appropriate error message
                let errorMessage = "Login failed. Please try again.";

                if (err instanceof Error) {
                    // Handle Firebase Auth specific errors
                    if ((err as AuthError).code) {
                        switch ((err as AuthError).code) {
                            case "auth/wrong-password":
                                errorMessage =
                                    "Incorrect password. Please check your password and try again.";
                                break;
                            case "auth/user-not-found":
                                errorMessage =
                                    "Username not found. Please check your username and try again.";
                                break;
                            case "auth/invalid-email":
                                errorMessage =
                                    "Invalid email format. Please contact administrator.";
                                break;
                            case "auth/user-disabled":
                                errorMessage =
                                    "This account has been disabled. Please contact administrator.";
                                break;
                            case "auth/too-many-requests":
                                errorMessage =
                                    "Too many failed attempts. Please try again later.";
                                setIsLocked(true);
                                break;
                            case "auth/network-request-failed":
                                errorMessage =
                                    "Network error. Please check your internet connection and try again.";
                                break;
                            case "auth/operation-not-allowed":
                                errorMessage =
                                    "Email/password sign-in is not enabled. Please contact administrator.";
                                break;
                            case "auth/invalid-credential":
                                errorMessage =
                                    "Invalid credentials. Please check your username and password.";
                                break;
                            case "auth/account-exists-with-different-credential":
                                errorMessage =
                                    "An account already exists with this email using a different sign-in method.";
                                break;
                            case "auth/requires-recent-login":
                                errorMessage =
                                    "Please log in again to continue. This is required for security.";
                                break;
                            case "auth/user-token-expired":
                                errorMessage =
                                    "Your session has expired. Please log in again.";
                                break;
                            case "auth/invalid-user-token":
                                errorMessage =
                                    "Invalid session. Please log in again.";
                                break;
                            case "auth/weak-password":
                                errorMessage =
                                    "Password is too weak. Please contact administrator.";
                                break;
                            default:
                                // For unknown Firebase errors, show a generic but helpful message
                                if (err.message.includes("Account not found")) {
                                    errorMessage =
                                        "Email not found. Please check your email and try again.";
                                } else {
                                    errorMessage =
                                        "Authentication failed. Please check your credentials and try again.";
                                }
                        }
                    } else {
                        // Handle general errors (non-Firebase Auth errors)
                        if (err.message.includes("Account not found")) {
                            errorMessage =
                                "Email not found. Please check your email and try again.";
                        } else if (
                            err.message.includes("network") ||
                            err.message.includes("fetch")
                        ) {
                            errorMessage =
                                "Network error. Please check your internet connection and try again.";
                        } else if (err.message.includes("timeout")) {
                            errorMessage =
                                "Request timed out. Please try again.";
                        } else {
                            errorMessage =
                                "Login failed. Please check your credentials and try again.";
                        }
                    }
                }

                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="min-h-screen bg-gradient-to-bl from-primary to-accent flex items-center justify-center p-4 animate-gradient-x">
            <Link href="/sign-up/resident" className="btn btn-xs btn-secondary absolute top-10 right-4">
                    Sign Up as Resident
            </Link>
            <div className="w-full max-w-md space-y-8 transform hover:scale-[1.01] transition-transform duration-300">
                {/* Header Section */}
                <div className="text-center space-y-4">
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
                        <p className="text-xs text-gray-200 mt-2 martian-mono">
                            Login Page
                        </p>
                    </div>
                </div>

                {/* Login Form Card */}
                <div className="card w-80 rounded-none bg-white mx-auto shadow-lg martian-mono text-xs border border-base-300">
                    <div className="card-body p-8">
                        <form onSubmit={handleLogin} className="space-y-10">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-zinc-500 font-medium text-xs mb-2">
                                        Username
                                    </span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Enter your username"
                                        className="input input-bordered w-full pl-12 focus:input-primary transition-all duration-300 bg-base-100 text-xs font-semibold text-primary"
                                        value={formData.username}
                                        onChange={handleInputChange("username")}
                                        required
                                        autoComplete="username"
                                        disabled={isLocked}
                                    />
                                    <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50 group-focus-within:text-primary duration-300 z-10" />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-zinc-500 font-medium text-xs mb-2">
                                        Password
                                    </span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="Enter your password"
                                        className="input input-bordered w-full pl-12 pr-12 focus:input-primary transition-all duration-300 bg-base-100 font-semibold text-xs text-primary"
                                        value={formData.password}
                                        onChange={handleInputChange("password")}
                                        required
                                        autoComplete="current-password"
                                        disabled={isLocked}
                                    />
                                    <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50 duration-300 z-10 group-focus-within:text-primary" />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary transition-colors duration-300 z-10 group-focus-within:text-primary"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        disabled={isLocked}
                                    >
                                        {showPassword ? (
                                            <HiEyeOff className="w-5 h-5" />
                                        ) : (
                                            <HiEye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="alert alert-error shadow-lg text-error-content animate-shake">
                                    <MdError className="w-6 h-6" />
                                    <span className="text-xs font-medium text-white">
                                        {error}
                                    </span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary w-full normal-case text-xs font-semibold shadow-lg hover:shadow-primary/30 transition-all duration-300 min-h-12"
                                disabled={loading || isLocked}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="loading loading-spinner"></span>
                                        <span>Authenticating...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <HiShieldCheck className="w-5 h-5" />
                                        <span>Sign In</span>
                                    </div>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-xs text-zinc-200">
                        Secure login access • Protected by
                        authentication
                    </p>
                    <div className="flex justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-200"></div>
                        <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-400"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

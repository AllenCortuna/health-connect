"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { successToast, errorToast } from "@/lib/toast";
import {
    MdEmail,
    MdLock,
    MdVisibility,
    MdVisibilityOff,
} from "react-icons/md";
import Link from "next/link";

interface ResidentSignupFormData {
    email: string;
    password: string;
    confirmPassword: string;
}

const ResidentSignup: React.FC = () => {
    const router = useRouter();
    const [formData, setFormData] = useState<ResidentSignupFormData>({
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = (): boolean => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errorToast("Please enter a valid email address");
            return false;
        }

        if (!formData.email || !formData.password || !formData.confirmPassword) {
            errorToast("All fields are required");
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            errorToast("Passwords do not match");
            return false;
        }

        if (formData.password.length < 8) {
            errorToast("Password must be at least 8 characters long");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await sendEmailVerification(userCredential.user);
            successToast("Account created successfully! Please check your email for verification.");
            router.push("/resident/dashboard");
        } catch (error) {
            console.error("Error creating account:", error);
            let errorMessage = "Failed to create account. Please try again.";
            switch ((error as { code: string }).code) {
                case "auth/email-already-in-use":
                    errorMessage = "This email address is already registered.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "The email address is not valid.";
                    break;
                case "auth/weak-password":
                    errorMessage = "The password is too weak. Please choose a stronger password.";
                    break;
            }
            errorToast(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary/5 to-secondary/10">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-secondary">
                            Household Signup
                        </h1>
                        <p className="text-secondary/60 text-xs mt-2">
                            Create your household account to get started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label" htmlFor="email">
                                <span className="label-text text-xs font-medium">Email Address</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdEmail className="text-secondary" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email address"
                                    className="input input-bordered w-full pl-10"
                                    required
                                    disabled={loading}
                                />
                                    <span className="label-text-alt text-xs text-error my-3 text-[9px] font-semibold">
                                        Use the email you gave to the BHW
                                    </span>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label" htmlFor="password">
                                <span className="label-text text-xs font-medium">Password</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdLock className="text-secondary" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className="input input-bordered w-full pl-10 pr-12"
                                    required
                                    disabled={loading}
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary/40 hover:text-secondary/60"
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <MdVisibilityOff className="text-lg" />
                                    ) : (
                                        <MdVisibility className="text-lg" />
                                    )}
                                </button>
                            </div>
                            <label className="label">
                                <span className="label-text-alt text-xs text-secondary/60">
                                    Minimum 8 characters
                                </span>
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label" htmlFor="confirmPassword">
                                <span className="label-text text-xs font-medium">Confirm Password</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdLock className="text-secondary" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    className="input input-bordered w-full pl-10 pr-12"
                                    required
                                    disabled={loading}
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary/40 hover:text-secondary/60"
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? (
                                        <MdVisibilityOff className="text-lg" />
                                    ) : (
                                        <MdVisibility className="text-lg" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-control mt-6">
                            <button 
                                type="submit" 
                                className="btn btn-secondary w-full" 
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    "Sign Up"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="divider mt-6 mb-2"></div>
                    <div className="text-center">
                        <p className="text-xs text-base-content/60">
                            Already have an account?{" "}
                            <Link href="/" className="text-secondary hover:underline">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResidentSignup;
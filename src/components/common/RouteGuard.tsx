"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Account } from "@/interface/user";
import Loading from "./Loading";
import { useAccountStore } from "@/store/accountStore";
import { warningToast } from "@/lib/toast";
import EmailVerificationPrompt from "./EmailVerificationPrompt";

/**
 * Props for the RouteGuard component
 */
interface RouteGuardProps {
    /** Child components to render when authorized */
    children: React.ReactNode;
    /** Required role to access the route */
    role: string;
    /** Firestore collection name to validate against */
    collectionName: string;
}

/**
 * RouteGuard Component
 * 
 * A higher-order component that protects routes by:
 * 1. Verifying Firebase authentication status
 * 2. Validating user role against Firestore collection
 * 3. Managing loading states during validation
 * 4. Redirecting unauthorized users
 * 5. Loading user data into global state
 * 
 * @example
 * ```tsx
 * <RouteGuard role="admin" collectionName="admins">
 *   <AdminDashboard />
 * </RouteGuard>
 * ```
 */
const RouteGuard: React.FC<RouteGuardProps> = ({ children, role , collectionName}) => {
    // Component state
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    
    // Hooks
    const router = useRouter();
    const { setAccount } = useAccountStore();

    /**
     * Validates user authorization against Firestore
     * @param userEmail - Email of the authenticated user
     * @returns User account data if authorized, null otherwise
     */
    const validateAdminUser = async (userEmail: string): Promise<Account | null> => {
        try {
            const usersRef = collection(db, collectionName);
            const userQuery = query(usersRef, where("email", "==", userEmail));
            const querySnapshot = await getDocs(userQuery);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = {
                    ...userDoc.data(),
                    id: userDoc.id
                } as Account;
                if (userData.role !== role) {
                    return null;
                }
                return userData;
            }
            
            return null;
        } catch (error) {
            console.error("Error validating user:", error);
            return null;
        }
    };

    /**
     * Handles Firebase authentication state changes
     * - Validates user role on auth state change
     * - Updates global account state
     * - Manages loading states
     * - Handles redirects for unauthorized access
     */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user?.email) {
                    // Check if email is verified
                    if (!user.emailVerified) {
                        setEmailVerified(false);
                        setAuthenticated(true); // User is authenticated but email not verified
                        setAccount(null);
                        setLoading(false);
                        return;
                    }
                    
                    // User is authenticated and email is verified - check admin privileges
                    const userData = await validateAdminUser(user.email);
                    
                    if (userData) {
                        // User is a valid user
                        setAccount(userData);
                        setAuthenticated(true);
                        setEmailVerified(true);
                    } else {
                        // User exists but is not a valid user
                        warningToast("Authenticated user is not a valid " + role);
                        setAccount(null);
                        setAuthenticated(false);
                        setEmailVerified(false);
                        router.push("/");
                    }
                } else {
                    // User is not authenticated
                    setAccount(null);
                    setAuthenticated(false);
                    setEmailVerified(false);
                    router.push("/");
                }
            } catch (error) {
                // Handle any unexpected errors during authentication check
                console.error("Error during authentication check:", error);
                setAccount(null);
                router.push("/");
            } finally {
                setLoading(false);
            }
        });

        // Cleanup function to unsubscribe from auth state changes
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, setAccount, role, collectionName]);

    // Show loading spinner while checking authentication
    if (loading) {
        return <Loading />;
    }
    console.log('emailVerified', emailVerified);
    console.log('authenticated', authenticated);

    // Show email verification prompt if user is authenticated but email is not verified
    if (authenticated && !emailVerified) {
        return <EmailVerificationPrompt userEmail={auth.currentUser?.email || ""} />;
    }

    // Render protected content only if user is authenticated, authorized, and email is verified
    if (authenticated && emailVerified) {
        return <>{children}</>;
    }

    // User is not authenticated or not authorized
    return null;
};

export default RouteGuard;
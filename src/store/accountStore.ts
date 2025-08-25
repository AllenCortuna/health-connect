/**
 * Account Store
 * 
 * Manages global account state using Zustand.
 * Provides functionality to store, update and clear the logged-in user's account information.
 */

import { Account } from '@/interface/user';
import { create } from 'zustand';

/**
 * Interface defining the account store state and actions
 * @interface AccountState
 * @property {Account | null} account - The current user account or null if not logged in
 * @property {function} setAccount - Sets the account state
 * @property {function} clearAccount - Clears the account state
 */
interface AccountState {
    account: Account | null;
    setAccount: (account: Account | null) => void;
    clearAccount: () => void;
}

/**
 * Account store implementation using Zustand
 * Provides methods to manage account state globally
 */
export const useAccountStore = create<AccountState>((set) => ({
    // Initial state
    account: null,

    // Set account information
    setAccount: (account: Account | null) => 
        set({ account }),

    // Clear account information (logout)
    clearAccount: () => 
        set({ account: null })
}));
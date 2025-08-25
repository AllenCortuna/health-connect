import { create } from 'zustand';


interface NavState {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isMobileMenuOpen: boolean) => void;
}

export const useNavStore = create<NavState>((set) => ({
    // Initial state
    isMobileMenuOpen: false,

    // Set account information
    setIsMobileMenuOpen: (isMobileMenuOpen: boolean) => 
        set({ isMobileMenuOpen }),
}));
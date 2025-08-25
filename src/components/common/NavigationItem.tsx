    import { useNavStore } from "@/store/navStore";
import Link from "next/link";
    import { usePathname } from "next/navigation";
    /**
     * Renders a navigation item with consistent styling and optional notification badge
     */

    export interface NavigationItemProps {
        href: string;
        icon: React.ElementType;
        label: string;
        showNotification?: boolean;
        notificationCount?: number;
        loading?: boolean;
    }

    const NavigationItem = ({
        href,
        icon: Icon,
        label,
        showNotification = false,
        notificationCount = 0,
        loading = false,
    }: NavigationItemProps) => {
    const pathname = usePathname();
    const { setIsMobileMenuOpen } = useNavStore();
        const isActive = pathname === href;

        return (
            <li>
                <Link
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 p-4 rounded-xl text-white transition-all duration-200 group hover:bg-white/20 relative martian-mono ${
                        isActive
                            ? "bg-white/20 text-white focus:text-white focus:bg-white/20"
                            : ""
                    }`}
                >
                    <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors relative ${
                            isActive
                                ? "bg-white/20 text-white focus:text-white"
                                : "bg-white/10 group-hover:bg-white/20"
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        {/* Notification Badge */}
                        {showNotification &&
                            notificationCount > 0 &&
                            !loading && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px]">
                                    {notificationCount > 99
                                        ? "99+"
                                        : notificationCount}
                                </div>
                            )}
                    </div>
                    <span className="truncate font-normal text-xs">
                        {label}
                    </span>
                </Link>
            </li>
        );
    };

export default NavigationItem;
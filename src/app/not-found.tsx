"use client";
import { useRouter } from "next/navigation";
import "./globals.css";

export default function NotFound() {
    const router = useRouter();

    const handleGoBack = () => {
        router.back();
    };

    return (
        <div>
            <div className="flex flex-col items-center justify-center min-h-screen text-center ">
                <h1 className="text-6xl text-primary drop-shadow-sm font-bold">
                    404
                </h1>
                <h2 className="text-lg font-bold text-primary italic apercu-mono">
                    Page Not Found
                </h2>
                <p className="mt-8 text-zinc-500 text-sm mx-20 w-80 md:mx-auto">
                    The page your looking for does not exist, has been moved or
                    the{" "}
                    <b className="underline">Development is still ongoing.</b>
                </p>
                <div className="flex  gap-3 flex-col mt-10">
                    <button
                        onClick={handleGoBack}
                        className="px-4 py-2 bg-primary text-xs text-white rounded hover:bg-neutral"
                    >
                        Go back
                    </button>
                </div>
            </div>
        </div>
    );
}
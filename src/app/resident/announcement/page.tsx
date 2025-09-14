"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Announcement } from "@/interface/data";
import { FaCalendarAlt, FaUser, FaSearch, FaFilter } from "react-icons/fa";
import { errorToast } from "@/lib/toast";

const ResidentAnnouncementPage = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [importanceFilter, setImportanceFilter] = useState<string>("all");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setIsLoading(true);
            const announcementsRef = collection(db, "announcements");
            const q = query(announcementsRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const announcementsData: Announcement[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const announcement = {
                    id: doc.id,
                    ...data,
                    createdAt:
                        data.createdAt?.toDate?.()?.toISOString() ||
                        data.createdAt,
                    updatedAt:
                        data.updatedAt?.toDate?.()?.toISOString() ||
                        data.updatedAt,
                } as Announcement;

                announcementsData.push(announcement);
            });

            setAnnouncements(announcementsData);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            errorToast("Failed to fetch announcements");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter and search announcements
    const filteredAnnouncements = announcements.filter((announcement) => {
        const matchesSearch =
            searchTerm === "" ||
            announcement.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            announcement.content
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            announcement.createdBy
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesImportance =
            importanceFilter === "all" ||
            (importanceFilter === "important" && announcement.important) ||
            (importanceFilter === "normal" && !announcement.important);

        return matchesSearch && matchesImportance;
    });

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "Invalid Date";
        }
    };

    const formatDisplayDate = (dateString: string, timeString: string) => {
        try {
            const date = new Date(`${dateString}T${timeString}`);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "Invalid Date";
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-base-200 p-4">
                <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="p-4">
                    <h1 className="text-xl font-bold text-secondary mb-4">
                        Announcements
                    </h1>

                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search announcements..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input input-bordered w-full pl-10 pr-4 py-2 text-sm"
                        />
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn btn-outline btn-sm w-full mb-3"
                    >
                        <FaFilter className="mr-2" />
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </button>

                    {/* Filters */}
                    {showFilters && (
                        <div className="bg-base-100 p-3 rounded-lg mb-3">
                            <div className="form-control">
                                <label className="label py-2">
                                    <span className="label-text text-sm font-medium">
                                        Filter by Importance
                                    </span>
                                </label>
                                <select
                                    value={importanceFilter}
                                    onChange={(e) =>
                                        setImportanceFilter(e.target.value)
                                    }
                                    className="select select-bordered select-sm w-full"
                                >
                                    <option value="all">
                                        All Announcements
                                    </option>
                                    <option value="important">
                                        Important Only
                                    </option>
                                    <option value="normal">Normal Only</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Results Count */}
                    <div className="text-xs text-gray-500 text-center">
                        {filteredAnnouncements.length} of {announcements.length}{" "}
                        announcements
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-20">
                {filteredAnnouncements.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📢</div>
                        {announcements.length === 0 ? (
                            <>
                                <p className="text-gray-500 mb-2">
                                    No announcements available
                                </p>
                                <p className="text-sm text-gray-400">
                                    Check back later for updates
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-500 mb-2">
                                    No announcements match your search
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setImportanceFilter("all");
                                    }}
                                    className="btn btn-outline btn-sm"
                                >
                                    Clear Filters
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAnnouncements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className="card bg-white shadow-sm border border-gray-100"
                            >
                                <div className="card-body p-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="drop-shadow text-base font-bold text-secondary line-clamp-2">
                                                    {announcement.title}
                                                </h3>
                                            </div>

                                            <div className="flex flex-col items-start text-xs text-gray-500 mb-2">
                                                <div className="flex items-center gap-1">
                                                    <FaUser className="text-xs" />
                                                    <span className="font-medium">
                                                        {announcement.createdBy}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FaCalendarAlt className="text-xs" />
                                                    <span>
                                                        {formatDisplayDate(
                                                            announcement.date,
                                                            announcement.time
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="text-xs text-gray-600 leading-relaxed">
                                        <p className="line-clamp-4 whitespace-pre-wrap">
                                            {announcement.content}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                        <div className="text-[10px] text-gray-400">
                                            Posted{" "}
                                            {formatDate(announcement.createdAt)}
                                        </div>
                                        {announcement.important && (
                                            <div className="badge badge-error badge-xs text-[10px] font-bold flex-shrink-0">
                                                Important
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Spacing for Mobile */}
            <div className="h-4"></div>
        </div>
    );
};

export default ResidentAnnouncementPage;

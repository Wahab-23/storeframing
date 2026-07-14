"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HeaderNavCategory } from "./types";
import { NavigationBar } from "./NavigationBar";
import { MegaMenuPanel } from "./MegaMenuPanel";

interface Props {
    navigation: HeaderNavCategory[];
}

export function MegaMenuClient({
    navigation,
}: Props) {
    const [activeCategory, setActiveCategory] =
        useState<number | null>(null);

    const [activeSubcategory, setActiveSubcategory] =
        useState(0);

    const timer = useRef<NodeJS.Timeout | null>(null);

    const clearCloseTimer = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }, []);

    const scheduleClose = useCallback(() => {
        timer.current = setTimeout(() => {
            setActiveCategory(null);
            setActiveSubcategory(0);
        }, 150);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActiveCategory(null);
                setActiveSubcategory(0);
            }
        };

        document.addEventListener("keydown", handler);

        return () =>
            document.removeEventListener(
                "keydown",
                handler
            );
    }, []);

    const activeData =
        activeCategory !== null
            ? navigation[activeCategory]
            : null;

    return (
        <>
            <NavigationBar
                navigation={navigation}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                setActiveSubcategory={setActiveSubcategory}
                scheduleClose={scheduleClose}
                clearCloseTimer={clearCloseTimer}
            />

            {activeData && (
                <MegaMenuPanel
                    category={activeData}
                    activeSubcategory={activeSubcategory}
                    setActiveSubcategory={
                        setActiveSubcategory
                    }
                    scheduleClose={scheduleClose}
                    clearCloseTimer={clearCloseTimer}
                />
            )}
        </>
    );
}
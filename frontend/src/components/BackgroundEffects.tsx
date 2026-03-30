"use client";

import { motion } from "framer-motion";

export const BackgroundEffects = () => {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base Grid Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]" />
            
            {/* Top Center Glow (Hero Focus) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-50" />
            
            {/* Accent Glows */}
            <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-secondary/10 blur-[100px] rounded-full" />
            <div className="absolute top-[40%] -right-[10%] w-[600px] h-[600px] bg-purple/10 blur-[130px] rounded-full" />
            
            {/* Subtle Horizontal Lines */}
            <div className="absolute top-1/4 w-full h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
            <div className="absolute top-3/4 w-full h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
        </div>
    );
};

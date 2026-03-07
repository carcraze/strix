const stats = [
    { value: "< 60s", label: "Time to first finding" },
    { value: "0%", label: "False positive rate" },
    { value: "100%", label: "PoC-validated bugs" },
    { value: "24/7", label: "Continuous monitoring" },
];

export function Stats() {
    return (
        <section className="py-16 border-y border-white/5">
            <div className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map(s => (
                        <div key={s.label} className="text-center">
                            <div className="text-4xl font-syne font-black text-[var(--color-cyan)] mb-2">{s.value}</div>
                            <div className="text-sm text-[#555] font-mono">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

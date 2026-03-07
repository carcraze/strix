import { cn } from "@/lib/utils";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
    code: string;
    language?: string;
    showLineNumbers?: boolean;
}

export function CodeBlock({
    code,
    language = "bash",
    showLineNumbers = false,
    className,
    ...props
}: CodeBlockProps) {
    const lines = code.split('\n');

    return (
        <div className={cn("relative rounded-lg bg-[#0e131f] border border-[#1e293b] overflow-hidden", className)}>
            <div className="flex items-center px-4 py-2 bg-[#151b2b] border-b border-[#1e293b] text-xs text-[#7A9BB5]">
                <span className="font-mono">{language}</span>
            </div>
            <pre
                className="p-4 overflow-x-auto text-sm font-mono text-[#E8F4FF]"
                {...props}
            >
                <code className="block w-full">
                    {lines.map((line, i) => (
                        <div key={i} className="line flex">
                            {showLineNumbers && (
                                <span className="inline-block w-8 shrink-0 text-center text-[#3D5A73] select-none mr-4">
                                    {i + 1}
                                </span>
                            )}
                            <span className="break-all">{line || ' '}</span>
                        </div>
                    ))}
                </code>
            </pre>
        </div>
    );
}

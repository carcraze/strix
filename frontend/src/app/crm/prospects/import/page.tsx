"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Database,
    Table as TableIcon
} from "lucide-react";
import { Card } from "@/components/ui/zentinel-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ExcelJS from "exceljs";

interface ProspectImportRow {
    [key: string]: any;
}

const COLUMN_MAPPING: { [key: string]: string } = {
    'Founder/ Founders': 'founder_name',
    'Company': 'company_name',
    'Website link': 'website',
    'eName source Link': 'source',
    'Other Links': 'other_links',
    'X hundles': 'x_handle',
    'Email': 'email',
    'Revenue(TrustMRR)': 'revenue_mrr',
    'Growth %': 'growth_pct',
    'Product hunt launch Date': 'ph_launch_date',
    'TechStack': 'tech_stack',
    'Perceived Painpoints': 'painpoints',
    'Lead status': 'contact_status',
    'Outreach Status': 'outreach_status',
    'Last Contact Date': 'last_contact_date',
    'Next action': 'next_action',
    'Due Date': 'due_date',
    'POC sent (Yes or No)': 'poc_sent',
    'Notes (Resistant point or secific requests': 'notes',
    'Notes (Resistant point or specific requests': 'notes'
};

const parseRobustDate = (val: any) => {
    if (!val) return null;
    if (val instanceof Date) {
        if (isNaN(val.getTime())) return null;
        return val.toISOString().split('T')[0];
    }

    let str = String(val).trim();
    if (!str || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') return null;

    // Try native Date.parse
    const ts = Date.parse(str);
    if (!isNaN(ts)) {
        return new Date(ts).toISOString().split('T')[0];
    }

    // Custom handling for strings like "March 2nd, 2026, LATEST"
    const cleaned = str.replace(/(st|nd|rd|th)/gi, '') // remove ordinals
        .replace(/,/g, ' ')           // replace commas with space
        .split(' ')
        .filter(x => x && !x.toUpperCase().includes('LATEST'))
        .join(' ');

    const ts2 = Date.parse(cleaned);
    if (!isNaN(ts2)) {
        return new Date(ts2).toISOString().split('T')[0];
    }

    // Fallback regex for dates like 2024.03.02 or 02/03/2024
    const parts = str.match(/(\d{1,4})/g);
    if (parts && parts.length >= 3) {
        // Assume YYYY MM DD or DD MM YYYY
        // Simplistic but helpful for many common formats
        try {
            const d = new Date(str);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        } catch (e) { }
    }

    return null;
};

export default function ImportProspectsPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<ProspectImportRow[]>([]);
    const [fullData, setFullData] = useState<ProspectImportRow[]>([]);
    const [successCount, setSuccessCount] = useState<number | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            const jsonData: ProspectImportRow[] = [];

            // Get mapping based on first row headers
            const headers: (string | null)[] = [];
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                headers[colNumber] = cell.value ? String(cell.value).trim() : null;
            });

            // Extract rows
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // skip header

                const rowData: ProspectImportRow = {};
                let hasData = false;

                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const header = headers[colNumber];
                    if (header) {
                        let val = cell.value;
                        // Handle objects (formulas, rich text, etc)
                        if (val && typeof val === 'object') {
                            if ('result' in val) val = val.result as any;
                            else if ('richText' in val) val = (val as any).richText.map((rt: any) => rt.text).join('') as any;
                            else if ('text' in val) val = (val as any).text as any;
                        }

                        if (val !== null && val !== undefined && val !== '') {
                            rowData[header] = val;
                            hasData = true;
                        }
                    }
                });

                if (hasData) {
                    jsonData.push(rowData);
                }
            });

            if (jsonData.length === 0) {
                throw new Error("No readable data found in the first sheet.");
            }

            setFullData(jsonData);
            setPreviewData(jsonData.slice(0, 5));
            setLoading(false);
        } catch (err: any) {
            setError(err.message || "Failed to parse file. Ensure it's a valid .xlsx or .csv");
            setLoading(false);
        }
    };

    const processValue = (column: string, value: any) => {
        if (value === undefined || value === null) return null;

        if (column === 'poc_sent') {
            const str = String(value).toLowerCase().trim();
            return str === 'yes' || str === 'true' || str === '1';
        }

        if (column === 'ph_launch_date' || column === 'due_date' || column === 'last_contact_date') {
            return parseRobustDate(value);
        }

        if (column === 'growth_pct') {
            return parseFloat(value) || 0;
        }

        if (column === 'contact_status') {
            const statusMap: { [key: string]: string } = {
                'Identified': 'prospect_identified',
                'Prospect Identified': 'prospect_identified',
                'Contacted': 'contacted',
                'Engaged': 'engaged',
                'Signed up': 'signed_up',
                'Active user': 'active_user',
                'Paid customer': 'paid_customer'
            };
            const mapped = statusMap[String(value).trim()];
            return mapped || 'prospect_identified';
        }

        return String(value);
    };

    const handleImport = async () => {
        setImporting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const formattedRows = fullData.map(row => {
                const payload: any = {};

                Object.keys(COLUMN_MAPPING).forEach(excelHeader => {
                    const dbColumn = COLUMN_MAPPING[excelHeader];
                    if (row[excelHeader] !== undefined) {
                        payload[dbColumn] = processValue(dbColumn, row[excelHeader]);
                    }
                });

                // Populate founders JSONB array
                if (payload.founder_name) {
                    payload.founders = [{
                        name: payload.founder_name,
                        email: payload.email || null,
                        x_handle: payload.x_handle || null,
                        linkedin_profile: payload.linkedin_profile || null,
                        role: "Founder"
                    }];
                }

                return payload;
            }).filter(row => !!row.company_name); // CRITICAL: Filter out rows with missing required company_name

            if (formattedRows.length === 0) {
                throw new Error("No valid rows with 'Company' names were found in the file.");
            }

            // Bulk insert in chunks of 50
            const CHUNK_SIZE = 50;
            let count = 0;

            for (let i = 0; i < formattedRows.length; i += CHUNK_SIZE) {
                const chunk = formattedRows.slice(i, i + CHUNK_SIZE);
                const { error: insertError } = await supabase
                    .from('prospects')
                    .insert(chunk);

                if (insertError) throw insertError;
                count += chunk.length;
            }

            setSuccessCount(count);
            setTimeout(() => {
                router.push("/crm/prospects");
            }, 3000);

        } catch (err: any) {
            setError(err.message || "Bulk import failed. Please check the data format.");
        } finally {
            setImporting(false);
        }
    };

    if (successCount !== null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in-95 duration-500">
                <div className="h-20 w-20 bg-[var(--color-cyan)]/10 rounded-full flex items-center justify-center mb-6 border border-[var(--color-cyan)]/20 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                    <CheckCircle2 className="h-10 w-10 text-[var(--color-cyan)]" />
                </div>
                <h1 className="text-3xl font-syne font-bold text-white mb-2 uppercase tracking-tight">Import Successful</h1>
                <p className="text-[#666] font-mono text-xs uppercase tracking-widest">{successCount} Prospects Integrated into Pipeline</p>
                <Link href="/crm/prospects" className="mt-8 text-xs font-mono text-[var(--color-cyan)] hover:underline uppercase tracking-widest">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <Link
                href="/crm/prospects"
                className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-white transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Pipeline
            </Link>

            <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-4xl font-syne font-bold text-white uppercase tracking-tight">Bulk Data Intake</h1>
                    <p className="text-[#666] mt-2 italic font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                        "Scale is built on systemic ingestion. Feed the machine."
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-1">Upload Protocol</span>
                    <span className="text-xs font-bold text-white bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase font-mono tracking-tighter">EXCELJS_ROBUST_PARSER</span>
                </div>
            </div>

            {!fullData.length ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-3xl p-20 flex flex-col items-center justify-center gap-6 hover:border-[var(--color-cyan)]/30 hover:bg-white/[0.02] transition-all cursor-pointer group"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                            handleFileUpload(e);
                            if (e.target) e.target.value = ''; // Reset for same file re-upload
                        }}
                        accept=".xlsx"
                        className="hidden"
                    />
                    <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {loading ? (
                            <Loader2 className="h-8 w-8 text-[var(--color-cyan)] animate-spin" />
                        ) : (
                            <Upload className="h-8 w-8 text-[#444] group-hover:text-[var(--color-cyan)] transition-colors" />
                        )}
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white uppercase font-syne tracking-wide">Drop Excel File Here</h3>
                        <p className="text-[#666] text-sm font-mono mt-1 uppercase tracking-tighter">Optimized for .xlsx | Large Datasets</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <Card className="p-0 overflow-hidden border-white/5 bg-[#080808]">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TableIcon className="h-4 w-4 text-purple-400" />
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-syne">Preview: Ingestion Log (Top 5 Rows)</h2>
                            </div>
                            <span className="text-[10px] font-mono text-purple-400 uppercase">{fullData.length} Total Rows Detected</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-black/40">
                                        {Object.keys(COLUMN_MAPPING).slice(0, 6).map(header => (
                                            <th key={header} className="p-4 text-[9px] font-mono text-[#444] uppercase tracking-widest">{header}</th>
                                        ))}
                                        <th className="p-4 text-[9px] font-mono text-[#444] uppercase tracking-widest">...</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {previewData.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.01] transition-all">
                                            {Object.keys(COLUMN_MAPPING).slice(0, 6).map(header => (
                                                <td key={header} className="p-4 text-[10px] font-mono text-[#888]">{String(row[header] || '-')}</td>
                                            ))}
                                            <td className="p-4 text-[10px] font-mono text-[#333]">...</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <div className="flex flex-col gap-4">
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
                            <Database className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-blue-400 uppercase">Automated Mapping Active</h4>
                                <p className="text-[11px] text-[#888] leading-relaxed">
                                    Headers detected and mapped to Zentinel's schema. Robust date parsing enabled for strings like "March 2nd".
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs font-mono uppercase">
                                <AlertCircle className="h-5 w-5" />
                                {error}
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => { setFullData([]); setPreviewData([]); }}
                                className="border-white/10 text-[#666] font-mono text-[10px] h-12 uppercase tracking-widest hover:bg-white/5"
                            >
                                Clear Selection
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={importing}
                                className="flex-1 bg-[var(--color-cyan)] text-black font-bold h-12 uppercase tracking-tighter shadow-[0_4px_20px_rgba(0,212,255,0.2)] hover:shadow-[0_4px_40px_rgba(0,212,255,0.4)] transition-all"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Committing Data...
                                    </>
                                ) : (
                                    <>Commit {fullData.length} Rows to Database</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

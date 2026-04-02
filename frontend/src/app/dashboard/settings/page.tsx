"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronRight, Users, Search, ChevronDown, Plus, Edit2,
  Zap, UserPlus, X, Check, Info, Download, Settings as Cog,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ─── Org Avatar ───────────────────────────────────────────────────────────────
function OrgAvatar() {
  return (
    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 40 40" className="h-9 w-9">
        <rect x="4"  y="4"  width="13" height="13" rx="2.5" fill="#7c3aed" fillOpacity="0.8"/>
        <rect x="23" y="4"  width="13" height="13" rx="2.5" fill="#7c3aed" fillOpacity="0.5"/>
        <rect x="4"  y="23" width="13" height="13" rx="2.5" fill="#7c3aed" fillOpacity="0.5"/>
        <rect x="23" y="23" width="13" height="13" rx="2.5" fill="#7c3aed" fillOpacity="0.8"/>
      </svg>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0",
        checked ? "bg-green-500" : "bg-gray-200"
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, show }: { message: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-2">
      {message}
    </div>
  );
}

// ─── Purple gradient banner ───────────────────────────────────────────────────
function PurpleBanner({
  icon, title, subtitle, linkText, onLink,
}: { icon: React.ReactNode; title: string; subtitle: string; linkText: string; onLink?: () => void }) {
  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-100 rounded-xl p-5 mt-4">
      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      <button onClick={onLink} className="text-sm font-semibold text-blue-600 hover:text-blue-800 shrink-0 whitespace-nowrap">{linkText}</button>
    </div>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
const GRADIENTS = [
  "from-orange-400 to-pink-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-purple-500",
];
function UserAvatar({ name, idx }: { name: string; idx: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn(
      "h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0",
      GRADIENTS[idx % GRADIENTS.length]
    )}>
      <span className="text-white font-bold text-xs">{initials}</span>
    </div>
  );
}

// ─── Auth Provider Icons ──────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GithubProviderIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-gray-700">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-gray-400">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

function ProviderIcon({ email }: { email: string }) {
  if (email.includes("gmail.com")) return <GoogleIcon />;
  if (email.includes("github.com")) return <GithubProviderIcon />;
  return <EmailIcon />;
}

// ─── Brand logos ──────────────────────────────────────────────────────────────
const SlackLogo = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zm2.521-10.123a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
  </svg>
);
const MSTeamsLogo = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#5059C9">
    <path d="M20.625 7.594a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75zm0 1.125c-2.45 0-4.5 1.725-4.5 4.5v5.625c0 .623.502 1.125 1.125 1.125H24V13.22c0-2.775-1.5-4.5-3.375-4.5zM9 9.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm7.5 3.75C16.5 10.575 13.8 8.25 9 8.25S1.5 10.575 1.5 13.5v7.688c0 .62.505 1.124 1.125 1.124h12.75c.62 0 1.125-.504 1.125-1.124V13.5z"/>
  </svg>
);
const JiraLogo = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#2684FF">
    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.132v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.024-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.486V1.005A1.001 1.001 0 0 0 23.013 0z"/>
  </svg>
);
const LinearLogo = () => (
  <svg viewBox="0 0 100 100" className="h-8 w-8">
    <defs><linearGradient id="lin-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7B61FF"/><stop offset="100%" stopColor="#5E4DCA"/></linearGradient></defs>
    <circle cx="50" cy="50" r="50" fill="url(#lin-g)"/>
    <path d="M17 63.7L36.3 83c-11.1-4-19.9-12.3-19.3-19.3zM15 57.7l27.3 27.3c2-.4 4-.9 5.9-1.7L16.7 51.8c-.8 1.9-1.3 3.9-1.7 5.9zm4.5-11.6l34.4 34.4c1.5-.7 3-1.5 4.4-2.5L22 43.7c-1 1.4-1.8 2.9-2.5 4.4zm6.5-9.3l37 37c1.3-1.1 2.5-2.3 3.6-3.5L29.6 32.5c-1.3 1.1-2.5 2.3-3.6 3.6zm9.5-7.7L68 71.5c1.4-.9 2.8-2 4-3.1L38.6 25.9c-1.2 1.3-2.2 2.6-3.1 4.2zm10.5-6.1l31 31c1.2-1.5 2.3-3.1 3.2-4.8L49.2 23.5c-1.7.9-3.3 2-4.8 3.2zm11-5l23 23c.9-2 1.6-4 2.1-6.1L61 23.4c-2.1.5-4.1 1.2-6.1 2.1zm11-3.2l13.1 13.1c.3-2.1.3-4.3 0-6.5L72 14.5c-2.1-.3-4.3-.3-6.5.1z" fill="white"/>
  </svg>
);
const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-gray-900">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);
const GitLabLogo = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8">
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" fill="#FC6D26"/>
  </svg>
);
const BitbucketLogo = () => (
  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#2684FF">
    <path d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.52.873 1.027.873h15.386c.388 0 .72-.272.79-.655l3.263-20.03a.768.768 0 0 0-.768-.89H.778zM14.52 15.53H9.522L8.17 8.466h7.704l-1.354 7.064z"/>
  </svg>
);

// Cloud logos
const AwsLogo = () => (
  <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
    <span className="text-white font-bold text-xs">aws</span>
  </div>
);
const AzureLogo = () => (
  <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 18 18" className="h-5 w-5 fill-white"><path d="M9 1L1 15h5l3-5 3 5h5z"/></svg>
  </div>
);
const GcpLogo = () => (
  <div className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0z" fill="#4285F4"/>
      <path d="M12 4.8a7.2 7.2 0 1 1 0 14.4A7.2 7.2 0 0 1 12 4.8z" fill="white"/>
      <text x="6.5" y="16" fontSize="8" fontWeight="bold" fill="#4285F4">G</text>
    </svg>
  </div>
);
const DoLogo = () => (
  <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M12 0C5.37 0 0 5.37 0 12h4c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8v4c6.63 0 12-5.37 12-12S18.63 0 12 0zm0 16h-4v4h4v-4zm-4 0H4v-4h4v4z"/></svg>
  </div>
);
const K8sLogo = () => (
  <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
    <span className="text-white font-bold text-xs">K8s</span>
  </div>
);
const AlibabaLogo = () => (
  <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
    <span className="text-white font-bold text-xs">ALI</span>
  </div>
);
const DockerLogo = () => (
  <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.185.186v1.887c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/></svg>
  </div>
);

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "general",      label: "General" },
  { id: "users",        label: "Users" },
  { id: "teams",        label: "Teams" },
  { id: "repositories", label: "Repositories" },
  { id: "clouds",       label: "Clouds" },
  { id: "containers",   label: "Containers" },
  { id: "domains",      label: "Domains & APIs" },
  { id: "integrations", label: "Integrations" },
];

// ─── TAB 1: GENERAL ───────────────────────────────────────────────────────────
function GeneralTab({ wsName }: { wsName: string }) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(wsName);

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {/* Card 1 – Workspace Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="font-semibold text-gray-900 text-base mb-4">Workspace Info</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium mb-1">
              Name
              <button onClick={() => setEditingName(v => !v)} className="ml-1 text-gray-400 hover:text-gray-600 transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {editingName ? (
              <input
                autoFocus
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === "Enter" && setEditingName(false)}
                className="w-full px-3 py-1.5 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-500">{nameValue}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Account type</p>
            <p className="text-sm text-gray-500">GitHub</p>
          </div>
        </div>
      </div>

      {/* Card 2 – Workspace Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-900 text-base">Workspace Plan</p>
          <span className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            <Zap className="h-3 w-3 fill-white" /> Pro Trial
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-3 leading-relaxed">
          You have 1 day left on Zentinel&apos;s full featured free trial. If you want to extend your time please contact us through chat. If you&apos;re ready to upgrade please use the button below.
        </p>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Early-stage startup? We got you! Send us a quick chat to get started on a discounted plan.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            Upgrade Plan
          </button>
          <button className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors">
            Talk To A Human
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: USERS ─────────────────────────────────────────────────────────────
const LOGIN_OPTIONS = [
  { value: "github-org", label: "Users must login with a GitHub account that is a member of this organisation" },
  { value: "multi",      label: "Users can log in via GitHub, Google or Microsoft" },
];

type OrgMember = { id: string; role: string; full_name: string; email: string; isCurrentUser?: boolean };

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [emails, setEmails] = useState("");
  const [loginMethod, setLoginMethod] = useState(LOGIN_OPTIONS[0].value);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selectedLabel = LOGIN_OPTIONS.find(o => o.value === loginMethod)?.label ?? "Select...";

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Invite users</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <textarea
          value={emails}
          onChange={e => setEmails(e.target.value)}
          placeholder={"user1@company.com\nuser2@company.com"}
          className="w-full h-28 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50 placeholder:text-gray-400"
        />
        <div className="mt-4 mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Login Method</span>
          <a href="#" className="text-sm text-blue-600 hover:underline">More info</a>
        </div>
        <div className="relative mt-2">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors"
          >
            <span className="text-gray-700 text-left leading-snug pr-2">{selectedLabel}</span>
            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {LOGIN_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setLoginMethod(opt.value); setDropdownOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm transition-colors",
                    opt.value === loginMethod ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors">Cancel</button>
          <button className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors">Invite Users</button>
        </div>
      </div>
    </Modal>
  );
}

const ACCESS_DEFAULTS = {
  allow_auto_join: false,
  can_view_own_team_only: false,
  read_only: false,
  can_snooze_ignore: true,
  can_change_severity: true,
  can_export_data: false,
  can_manage_repos: false,
  can_manage_clouds: true,
  can_manage_containers: true,
  can_manage_domains: true,
  can_manage_pentests: true,
  can_manage_code_quality: false,
};
type AccessSettings = typeof ACCESS_DEFAULTS;

function UserAccessSettingsModal({ open, onClose, orgId }: { open: boolean; onClose: () => void; orgId: string }) {
  const [settings, setSettings] = useState<AccessSettings>(ACCESS_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!open || !orgId) return;
    supabase.from("org_access_settings").select("*").eq("organization_id", orgId).single()
      .then(({ data }) => {
        if (data) {
          setSettings({
            allow_auto_join: data.allow_auto_join ?? ACCESS_DEFAULTS.allow_auto_join,
            can_view_own_team_only: data.can_view_own_team_only ?? ACCESS_DEFAULTS.can_view_own_team_only,
            read_only: data.read_only ?? ACCESS_DEFAULTS.read_only,
            can_snooze_ignore: data.can_snooze_ignore ?? ACCESS_DEFAULTS.can_snooze_ignore,
            can_change_severity: data.can_change_severity ?? ACCESS_DEFAULTS.can_change_severity,
            can_export_data: data.can_export_data ?? ACCESS_DEFAULTS.can_export_data,
            can_manage_repos: data.can_manage_repos ?? ACCESS_DEFAULTS.can_manage_repos,
            can_manage_clouds: data.can_manage_clouds ?? ACCESS_DEFAULTS.can_manage_clouds,
            can_manage_containers: data.can_manage_containers ?? ACCESS_DEFAULTS.can_manage_containers,
            can_manage_domains: data.can_manage_domains ?? ACCESS_DEFAULTS.can_manage_domains,
            can_manage_pentests: data.can_manage_pentests ?? ACCESS_DEFAULTS.can_manage_pentests,
            can_manage_code_quality: data.can_manage_code_quality ?? ACCESS_DEFAULTS.can_manage_code_quality,
          });
        }
      });
  }, [open, orgId]);

  const toggle = (key: keyof AccessSettings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("org_access_settings").upsert(
      { organization_id: orgId, ...settings },
      { onConflict: "organization_id" }
    );
    setSaving(false);
    setToastMsg("Settings saved");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    onClose();
  };

  const checkboxRows: { key: keyof AccessSettings; label: string }[] = [
    { key: "can_view_own_team_only",  label: "New users can only view their own team's issues" },
    { key: "read_only",               label: "New users have read-only rights" },
    { key: "can_snooze_ignore",       label: "New users can snooze/ignore issues" },
    { key: "can_change_severity",     label: "New users can change severity" },
    { key: "can_export_data",         label: "New users can export data" },
    { key: "can_manage_repos",        label: "New users can manage repositories" },
    { key: "can_manage_clouds",       label: "New users can manage clouds" },
    { key: "can_manage_containers",   label: "New users can manage containers" },
    { key: "can_manage_domains",      label: "New users can manage domains" },
    { key: "can_manage_pentests",     label: "New users can manage pentests" },
    { key: "can_manage_code_quality", label: "New users can manage code quality rules" },
  ];

  return (
    <>
      <Toast message={toastMsg} show={showToast} />
      <Modal open={open} onClose={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-900">User Access Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            Set default rights for new users. Allow users to auto-access Zentinel through GitHub or require manual invites.
          </p>
          <div className="border-b border-gray-200 my-4" />
          <div className="flex items-center justify-between py-2 mb-2">
            <span className="font-medium text-gray-900 text-sm">Allow all users to auto-join via GitHub</span>
            <Toggle checked={settings.allow_auto_join} onChange={() => toggle("allow_auto_join")} />
          </div>
          <p className="font-semibold text-gray-900 text-sm mb-3">Default Rights for New Users</p>
          <div className="space-y-0.5">
            {checkboxRows.map(row => (
              <label key={row.key} className="flex items-center gap-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded cursor-pointer"
                  checked={settings[row.key]}
                  onChange={() => toggle(row.key)}
                />
                <span className="text-sm text-gray-700">{row.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Apply Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function UsersTab({ orgId }: { orgId: string }) {
  const [showInvite, setShowInvite] = useState(false);
  const [showAccessSettings, setShowAccessSettings] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<OrgMember[]>([]);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orgId) return;
    const loadMembers = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      const currentEmail = authData.user?.email ?? "";

      const { data } = await supabase
        .from("organization_members")
        .select("id, role, user_id, user_profiles(full_name, avatar_url)")
        .eq("organization_id", orgId);

      if (!data) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: OrgMember[] = (data as any[]).map((m: any) => {
        const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles;
        const isCurrentUser = m.user_id === currentUserId;
        return {
          id: m.id as string,
          role: m.role as string,
          full_name: (profile?.full_name as string) ?? (isCurrentUser ? "You" : "Unknown User"),
          email: isCurrentUser ? currentEmail : `${((profile?.full_name as string) ?? "user").toLowerCase().replace(/\s+/g, ".")}@company.com`,
          isCurrentUser,
        };
      });

      // Put current user first
      rows.sort((a, b) => (b.isCurrentUser ? 1 : 0) - (a.isCurrentUser ? 1 : 0));
      setMembers(rows);
    };
    loadMembers();
  }, [orgId]);

  const exportCsv = () => {
    const csv = ["Name,Email,Role", ...members.map(m => `"${m.full_name}","${m.email}","${m.role}"`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "members.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
      <UserAccessSettingsModal open={showAccessSettings} onClose={() => setShowAccessSettings(false)} orgId={orgId} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-100 py-4 flex items-center gap-3 -mx-6 px-6 mb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={actionsRef}>
            <button
              onClick={() => setShowActionsDropdown(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Actions <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {showActionsDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                <button
                  onClick={() => { setShowActionsDropdown(false); setShowAccessSettings(true); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Cog className="h-4 w-4 text-gray-400" /> Settings
                </button>
                <button
                  onClick={() => { setShowActionsDropdown(false); exportCsv(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4 text-gray-400" /> Export Users
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> + Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 pl-4 w-8"><input type="checkbox" className="h-4 w-4 rounded cursor-pointer" /></th>
              <th className="py-3 px-4 font-semibold text-gray-700">User</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Teams</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-gray-400">No users found</td>
              </tr>
            ) : (
              filtered.map((m, idx) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 pl-4"><input type="checkbox" className="h-4 w-4 rounded cursor-pointer" /></td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={m.full_name} idx={idx} />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {m.full_name}
                          {m.isCurrentUser && <span className="ml-1.5 text-xs text-gray-400 font-normal">(You)</span>}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-gray-400">{m.email}</p>
                          <ProviderIcon email={m.email} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-gray-400">No team assigned</td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-medium text-gray-700 capitalize">{m.role || "Admin"}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite banner */}
      <PurpleBanner
        icon={<svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        title="Don't go alone. Take... friends."
        subtitle="Security is easier when you have your teammates."
        linkText="Invite collaborators"
        onLink={() => setShowInvite(true)}
      />
    </>
  );
}

// ─── TAB 3: TEAMS ─────────────────────────────────────────────────────────────
type Team = { id: string; name: string; created_at: string; member_count: number };
type TeamMemberRow = { id: string; user_id: string; full_name: string; email: string };
type RepoRow = { id: string; full_name: string; provider: string };

function LinkResourceModal({
  open, onClose, teamId, teamName, orgId, onLinked,
}: {
  open: boolean; onClose: () => void; teamId: string; teamName: string; orgId: string; onLinked: () => void;
}) {
  const [repos, setRepos] = useState<RepoRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!open || !orgId) return;
    supabase.from("repositories").select("id, full_name, provider").eq("organization_id", orgId)
      .then(({ data }) => setRepos((data || []) as RepoRow[]));
  }, [open, orgId]);

  const filtered = repos.filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()));

  const handleLink = async () => {
    setLinking(true);
    const inserts = Array.from(selected).map(repoId => {
      const repo = repos.find(r => r.id === repoId);
      return {
        team_id: teamId,
        resource_type: "repository",
        resource_id: repoId,
        resource_name: repo?.full_name ?? repoId,
      };
    });
    if (inserts.length > 0) {
      await supabase.from("team_resources").insert(inserts);
    }
    setLinking(false);
    onLinked();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <p className="text-sm text-gray-400 mb-2">Link resource to team</p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Connect a resource to {teamName}</h2>
        <p className="text-sm text-gray-500 mb-4">Select the resource you&apos;d like to assign to this team.</p>
        <p className="text-sm font-semibold text-gray-700 mb-2">Repositories</p>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search repositories…"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-gray-50"
          />
        </div>
        <div className="max-h-52 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No repositories found</p>
          ) : (
            filtered.map(repo => {
              const isSelected = selected.has(repo.id);
              return (
                <button
                  key={repo.id}
                  onClick={() => setSelected(prev => {
                    const next = new Set(prev);
                    isSelected ? next.delete(repo.id) : next.add(repo.id);
                    return next;
                  })}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm",
                    isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <input type="checkbox" className="h-4 w-4 rounded cursor-pointer" checked={isSelected} onChange={() => {}} />
                  <span className="text-gray-800">{repo.full_name}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleLink}
            disabled={selected.size === 0 || linking}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50"
          >
            {linking ? "Linking…" : "Link"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TeamDetailView({
  team, orgId, onBack,
}: { team: Team; orgId: string; onBack: () => void }) {
  const [subTab, setSubTab] = useState<"people" | "responsibilities">("people");
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMemberRow[]>([]);
  const [resources, setResources] = useState<Array<{ id: string; resource_name: string; resource_type: string }>>([]);
  const [showLinkResource, setShowLinkResource] = useState(false);
  const [allSearch, setAllSearch] = useState("");

  const loadTeamMembers = async () => {
    const { data } = await supabase
      .from("team_members")
      .select("id, user_id, user_profiles(full_name)")
      .eq("team_id", team.id);
    if (!data) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTeamMembers((data as any[]).map((m: any) => {
      const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles;
      return { id: m.id, user_id: m.user_id, full_name: profile?.full_name ?? "Unknown", email: "" };
    }));
  };

  const loadAllMembers = async () => {
    const { data } = await supabase
      .from("organization_members")
      .select("id, user_id, user_profiles(full_name)")
      .eq("organization_id", orgId);
    if (!data) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAllMembers((data as any[]).map((m: any) => {
      const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles;
      return { id: m.id, user_id: m.user_id, full_name: profile?.full_name ?? "Unknown", email: "" };
    }));
  };

  const loadResources = async () => {
    const { data } = await supabase.from("team_resources").select("id, resource_name, resource_type").eq("team_id", team.id);
    setResources((data || []) as Array<{ id: string; resource_name: string; resource_type: string }>);
  };

  useEffect(() => {
    loadTeamMembers();
    loadAllMembers();
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id, orgId]);

  const teamMemberUserIds = new Set(teamMembers.map(m => m.user_id));

  const addToTeam = async (userId: string) => {
    await supabase.from("team_members").insert({ team_id: team.id, user_id: userId });
    await loadTeamMembers();
  };

  const filteredAll = allMembers.filter(m =>
    m.full_name.toLowerCase().includes(allSearch.toLowerCase()) && !teamMemberUserIds.has(m.user_id)
  );

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
      >
        <ChevronRight className="h-4 w-4 rotate-180" /> All Teams
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">{team.name}</h2>

      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["people", "responsibilities"] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 -mb-px capitalize transition-colors",
              subTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "people" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left: team members */}
          <div>
            <p className="font-semibold text-gray-800 mb-3 text-sm">Users in {team.name} ({teamMembers.length})</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2.5 px-3 font-semibold text-gray-600 text-left">User</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.length === 0 ? (
                  <tr><td className="py-8 text-center text-sm text-gray-400">No members yet. Add from the right.</td></tr>
                ) : (
                  teamMembers.map((m, idx) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={m.full_name} idx={idx} />
                          <span className="font-medium text-gray-800 text-sm">{m.full_name}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Right: all org members */}
          <div>
            <p className="font-semibold text-gray-800 mb-3 text-sm">All users ({allMembers.length})</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={allSearch}
                onChange={e => setAllSearch(e.target.value)}
                placeholder="Search…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2.5 px-3 font-semibold text-gray-600 text-left">User</th>
                </tr>
              </thead>
              <tbody>
                {filteredAll.map((m, idx) => (
                  <tr
                    key={m.id}
                    onClick={() => addToTeam(m.user_id)}
                    className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={m.full_name} idx={idx} />
                        <span className="font-medium text-gray-800 text-sm">{m.full_name}</span>
                        <Plus className="h-3.5 w-3.5 text-blue-500 ml-auto" />
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAll.length === 0 && (
                  <tr><td className="py-8 text-center text-sm text-gray-400">All org members already in team</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "responsibilities" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowLinkResource(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Link Resource
            </button>
          </div>

          <LinkResourceModal
            open={showLinkResource}
            onClose={() => setShowLinkResource(false)}
            teamId={team.id}
            teamName={team.name}
            orgId={orgId}
            onLinked={loadResources}
          />

          {resources.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
              <p className="font-semibold text-gray-700 text-sm">No resources linked to this team</p>
              <p className="text-sm text-gray-500 mt-1 text-center max-w-sm">You have not yet linked any repositories or clouds to this team.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 pl-4 w-8"><input type="checkbox" className="h-4 w-4 rounded cursor-pointer" /></th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Severity</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resources.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-3.5 pl-4"><input type="checkbox" className="h-4 w-4 rounded cursor-pointer" /></td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">{r.resource_name}</td>
                    <td className="py-3.5 px-4 text-gray-400">—</td>
                    <td className="py-3.5 px-4 text-gray-400">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function CreateTeamModal({
  open, onClose, orgId, onCreated,
}: { open: boolean; onClose: () => void; orgId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from("teams").insert({
      organization_id: orgId,
      name: name.trim(),
      created_by: authData.user?.id,
    });
    setSaving(false);
    setName("");
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <p className="text-sm text-gray-400 mb-4">Create a team</p>
        <h2 className="text-2xl font-bold text-gray-900">Create a new team</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4 leading-relaxed">
          A team is a collection of members you can assign to monitor, triage, and track security vulnerabilities across specific areas of your codebase.
        </p>
        <p className="text-sm text-gray-600 mb-4">The following users will be added to the team:</p>
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
          Enter a team name <span className="text-red-500">*</span>
        </label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="e.g. Backend, Security, DevOps"
          className="w-full px-4 py-3 text-sm border border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TeamsTab({ orgId }: { orgId: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const loadTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("id, name, created_at, team_members(count)")
      .eq("organization_id", orgId);
    if (!data) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTeams((data as any[]).map((t: any) => ({
      id: t.id,
      name: t.name,
      created_at: t.created_at,
      member_count: t.team_members?.[0]?.count ?? 0,
    })));
  };

  useEffect(() => { if (orgId) loadTeams(); }, [orgId]);

  if (selectedTeam) {
    return (
      <TeamDetailView
        team={selectedTeam}
        orgId={orgId}
        onBack={() => setSelectedTeam(null)}
      />
    );
  }

  const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <CreateTeamModal open={showCreate} onClose={() => setShowCreate(false)} orgId={orgId} onCreated={loadTeams} />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teams…"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-blue-400 text-blue-600 text-sm font-medium rounded-full hover:bg-blue-50 transition-colors">
            Import From GitHub
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create Team
          </button>
        </div>
      </div>

      <div className="bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Users</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Responsibilities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-16 text-center text-sm text-gray-400">
                  {teams.length === 0 ? "No teams yet. Create your first team." : "No teams match your search."}
                </td>
              </tr>
            ) : (
              filtered.map(team => (
                <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                    >
                      {team.name}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-sm">{team.member_count}</td>
                  <td className="py-3.5 px-4 text-gray-400 text-sm">—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── TAB 4: REPOSITORIES ──────────────────────────────────────────────────────
function AddRepoModal({ open, onClose, orgId }: { open: boolean; onClose: () => void; orgId: string }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [autoScan, setAutoScan] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const showMsg = (msg: string) => {
    setToastMsg(msg); setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleConnect = async () => {
    const raw = repoUrl.trim();
    if (!raw) return;

    // Parse "github.com/owner/repo" or "owner/repo"
    const match = raw.replace(/^https?:\/\//, "").replace(/^github\.com\//, "").replace(/\.git$/, "");
    const parts = match.split("/");
    if (parts.length < 2) {
      showMsg("Enter a valid repo like owner/repo");
      return;
    }
    const fullName = `${parts[0]}/${parts[1]}`;

    setConnecting(true);
    try {
      // 1. Insert into repositories table
      const { data: repo, error: insertErr } = await supabase
        .from("repositories")
        .insert({
          organization_id: orgId,
          provider: "github",
          provider_repo_id: fullName,
          full_name: fullName,
          auto_review_enabled: autoScan,
        })
        .select("id")
        .single();

      if (insertErr) throw new Error(insertErr.message);

      showMsg(`✓ ${fullName} connected! Triggering Day Zero scan…`);
      setRepoUrl("");
      onClose();

      // 2. Auto-trigger Day Zero scan — show errors if rate-limited
      if (repo?.id) {
        const { data: { session } } = await supabase.auth.getSession();
        const scanResp = await fetch("/api/code-scan/day-zero", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            organization_id: orgId,
            repository_id: repo.id,
            repo_full_name: fullName,
          }),
        });
        if (scanResp.status === 429) {
          const body = await scanResp.json().catch(() => ({}));
          showMsg(`⚠ ${body?.detail?.message || "Scan rate limit reached — try again in an hour."}`);
        } else if (scanResp.status === 503) {
          showMsg(`✓ ${fullName} connected! Scanner starting up — findings will appear in AutoFix shortly.`);
        } else {
          const d = await scanResp.json().catch(() => ({}));
          console.log("[DayZero] Scan queued:", d.scan_run_id);
        }
      }
    } catch (err: any) {
      showMsg(`Error: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <>
      <Toast message={toastMsg} show={showToast} />
      <Modal open={open} onClose={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Connect a Repository</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Paste your repository URL or enter owner/repo name. We&apos;ll check if Zentinel has access.</p>
          <input
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            placeholder="e.g. github.com/myorg/myrepo or owner/repo"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 mb-3"
          />
          <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded cursor-pointer" checked={autoScan} onChange={() => setAutoScan(v => !v)} />
            Enable automatic scanning on new commits
          </label>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={onClose} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleConnect}
              disabled={!repoUrl.trim() || connecting}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {connecting ? "Connecting…" : "Connect"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function RepositoriesTab({ orgId }: { orgId: string }) {
  const [repos, setRepos] = useState<Array<{ id: string; full_name: string; created_at: string; auto_review_enabled?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activated, setActivated] = useState<Record<string, boolean>>({});
  const [showAddRepo, setShowAddRepo] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("repositories")
      .select("id, full_name, provider, created_at, auto_review_enabled")
      .eq("organization_id", orgId)
      .then(({ data }) => {
        const rows = (data || []) as Array<{ id: string; full_name: string; created_at: string; auto_review_enabled?: boolean }>;
        setRepos(rows);
        const init: Record<string, boolean> = {};
        (data || []).forEach((r: any) => { init[r.id] = r.auto_review_enabled ?? true; });
        setActivated(init);
        setLoading(false);
      });
  }, [orgId]);

  const handleToggle = async (repoId: string) => {
    const newVal = !activated[repoId];
    setActivated(prev => ({ ...prev, [repoId]: newVal }));
    try {
      await supabase.from('repositories').update({ auto_review_enabled: newVal }).eq('id', repoId);
    } catch (err) {
      // revert on error
      setActivated(prev => ({ ...prev, [repoId]: !newVal }));
    }
  };

  const filtered = repos.filter(r =>
    (r.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const timeAgo = (ts: string) => {
    if (!ts) return "N/A";
    const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000);
    if (h < 1) return "< 1h ago";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <>
      <AddRepoModal open={showAddRepo} onClose={() => setShowAddRepo(false)} orgId={orgId} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-100 py-4 flex items-center gap-3 -mx-6 px-6 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search repositories…"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors">
          All Repositories <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Actions <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={() => setShowAddRepo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Repo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400 bg-white">Loading repositories…</div>
      ) : (
        <div className="bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-3 pl-4 w-8"><input type="checkbox" className="h-4 w-4 rounded cursor-pointer" /></th>
                <th className="py-3 px-4 font-semibold text-gray-700">Repo name</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Domain</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Last scan</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Activated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">No repositories found</td></tr>
              ) : (
                filtered.map(repo => {
                  const repoName = repo.full_name?.split("/")[1] || repo.full_name;
                  return (
                    <tr key={repo.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 pl-4"><input type="checkbox" className="h-4 w-4 rounded cursor-pointer" /></td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">{repoName}</td>
                      <td className="py-3.5 px-4 text-gray-400">N/A</td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs">{timeAgo(repo.created_at)}</td>
                      <td className="py-3.5 px-4">
                        <Toggle
                          checked={!!activated[repo.id]}
                          onChange={() => handleToggle(repo.id)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── TAB 5: CLOUDS ────────────────────────────────────────────────────────────
const CLOUD_PROVIDERS = [
  { logo: <AwsLogo />,     name: "Amazon Web Services" },
  { logo: <AzureLogo />,   name: "Microsoft Azure" },
  { logo: <GcpLogo />,     name: "Google Cloud" },
  { logo: <DoLogo />,      name: "DigitalOcean" },
  { logo: <K8sLogo />,     name: "Kubernetes" },
  { logo: <AlibabaLogo />, name: "Alibaba Cloud" },
];

function ConnectCloudModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (name: string) => setSelected(name === selected ? null : name);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Cloud</h2>
        <p className="text-sm text-gray-500 mb-2 leading-relaxed">
          Connect your cloud environments and let Zentinel automatically discover assets, identify misconfigurations, and secure everything from code to cloud.
        </p>
        <a href="#" className="text-sm text-blue-600 hover:underline">Why connect Zentinel to my cloud?</a>
        <div className="my-4 border-t border-gray-200" />
        <div className="grid grid-cols-2 gap-3">
          {CLOUD_PROVIDERS.map(p => (
            <button
              key={p.name}
              onClick={() => handleSelect(p.name)}
              className={cn(
                "flex items-center gap-3 p-4 border rounded-2xl text-left hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all",
                selected === p.name ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"
              )}
            >
              {p.logo}
              <span className="text-sm font-medium text-gray-800">{p.name}</span>
            </button>
          ))}
        </div>
        {selected && (
          <div className="mt-4 text-center text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl py-2.5">
            Configuration coming soon for {selected}
          </div>
        )}
      </div>
    </Modal>
  );
}

function CloudsTab() {
  const [showConnect, setShowConnect] = useState(false);
  return (
    <>
      <ConnectCloudModal open={showConnect} onClose={() => setShowConnect(false)} />

      <div className="bg-white border-b border-gray-100 py-4 flex items-center gap-3 -mx-6 px-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input placeholder="Search…" className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowConnect(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Connect Cloud
          </button>
        </div>
      </div>

      <PurpleBanner
        icon={<svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>}
        title="Want to see the full picture?"
        subtitle="Harden your cloud infrastructure by discovering misconfigurations before attackers do."
        linkText="Connect a cloud"
        onLink={() => setShowConnect(true)}
      />

      <div className="bg-white mt-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 pl-4 w-8"><input type="checkbox" className="h-4 w-4 rounded cursor-pointer" /></th>
              <th className="py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Purpose</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Account ID</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Last scan</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-400">No cloud environments connected</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── TAB 6: CONTAINERS ────────────────────────────────────────────────────────
const REGISTRIES_PRIMARY = [
  { logo: <AwsLogo />,    name: "AWS Elastic Container Registry" },
  { logo: <DockerLogo />, name: "Docker Hub" },
  { logo: <AzureLogo />,  name: "Azure Container Registry" },
];
const REGISTRIES_MORE = [
  "Cloudsmith", "DigitalOcean Container Registry", "Google Cloud Artifact Registry",
  "Github Container Registry", "Gitlab Container Registry", "Gitlab Self-Managed Registry",
  "Harbor", "JFrog Artifactory", "Scaleway Container Registry",
  "Sonatype Nexus Registry", "Quay.io", "OCI Registry",
];

function ScanImagesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Scan Your Container Images</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 mb-5">
          {REGISTRIES_PRIMARY.map(r => (
            <button key={r.name} className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl text-left hover:border-blue-300 hover:bg-blue-50 transition-colors">
              {r.logo}
              <span className="text-sm font-semibold text-gray-800">{r.name}</span>
            </button>
          ))}
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">More providers</p>
        <div className="grid grid-cols-3 gap-2">
          {REGISTRIES_MORE.map(name => (
            <button key={name} className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl text-left hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-gray-500 font-bold text-xs">{name[0]}</span>
              </div>
              <span className="text-xs font-medium text-gray-700 leading-tight">{name}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-5 text-center">
          Registry not in the list, behind a firewall or running locally?
        </p>
      </div>
    </Modal>
  );
}

function ContainersTab() {
  const [showScan, setShowScan] = useState(false);
  const [search, setSearch] = useState("");
  return (
    <>
      <ScanImagesModal open={showScan} onClose={() => setShowScan(false)} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-lg font-bold text-gray-900">Registries</p>
        <button
          onClick={() => setShowScan(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Connect Registry
        </button>
      </div>

      <PurpleBanner
        icon={<svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 20h.01M20 14h.01M20 20h.01"/></svg>}
        title="Want to see the full picture?"
        subtitle="Link a container registry to scan Docker images for CVEs and protect your production workloads."
        linkText="Connect registry"
        onLink={() => setShowScan(true)}
      />

      <div className="mt-8 mb-4">
        <p className="text-lg font-bold text-gray-900">Containers</p>
      </div>

      <div className="bg-white border-b border-gray-100 py-4 flex items-center gap-2 -mx-6 px-6 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-full hover:bg-gray-50">All Registries <ChevronDown className="h-4 w-4" /></button>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-full hover:bg-gray-50">All Regions <ChevronDown className="h-4 w-4" /></button>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-full hover:bg-gray-50">All Containers <ChevronDown className="h-4 w-4" /></button>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-blue-400 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
            Configure
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-blue-400 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors">
            <Plus className="h-4 w-4" /> Add Public Image
          </button>
        </div>
      </div>

      <div className="bg-white">
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="py-10 text-center text-sm text-gray-400">No containers found</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── TAB 7: DOMAINS & APIS ────────────────────────────────────────────────────
const DOMAIN_TYPES = [
  { id: "frontend", label: "Front-End App",       desc: "Test CSP, safe cookie usage, exposed files, JWT usage, and other client-side vulnerabilities" },
  { id: "rest",     label: "REST APIs & Web Apps", desc: "Test your REST APIs against SQLi, SSRF, BOLA, authentication flaws, and other server-side attacks" },
  { id: "graphql",  label: "GraphQL",              desc: "Test your GraphQL API against introspection abuse, injections, and authorization misconfigurations" },
  { id: "surface",  label: "Attack Surface",       desc: "Discover exposed credentials, shadow APIs, misconfigured services, and broader attack surface risks" },
];

function AddDomainModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState("frontend");
  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Choose your application type</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="border-t border-gray-100">
          {DOMAIN_TYPES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={cn(
                "w-full flex items-start justify-between py-4 text-left hover:bg-gray-50 transition-colors px-1",
                i < DOMAIN_TYPES.length - 1 ? "border-b border-gray-100" : ""
              )}
            >
              <div className="pr-4">
                <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                <a href="#" onClick={e => e.stopPropagation()} className="text-xs text-blue-600 hover:underline mt-0.5 inline-block">More info</a>
              </div>
              <div className={cn(
                "mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                selected === t.id ? "border-green-500 bg-green-500" : "border-gray-300"
              )}>
                {selected === t.id && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors">
            Next
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DomainsTab() {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <>
      <AddDomainModal open={showAdd} onClose={() => setShowAdd(false)} />

      <div className="bg-white border-b border-gray-100 py-4 flex items-center gap-3 -mx-6 px-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input placeholder="Search domains…" className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
        </div>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <Info className="h-4 w-4" /> Zentinel static IPs
        </button>
        <div className="ml-auto">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Domain
          </button>
        </div>
      </div>

      <div className="bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 pl-4 w-8"><input type="checkbox" className="h-4 w-4 rounded cursor-pointer" /></th>
              <th className="py-3 px-4 font-semibold text-gray-700">Domain name</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Location</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Sensitivity</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Type</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Last scan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6}>
                <div className="flex flex-col items-center text-center py-14">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-700 text-sm">No domains configured</p>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm">
                    You don&apos;t seem to have any domains configured yet, add some to get a full overview of your attack surface.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── TAB 8: INTEGRATIONS ──────────────────────────────────────────────────────
function IntegrationCard({
  logo, name, description, connected = false,
}: { logo: React.ReactNode; name: string; description: string; connected?: boolean }) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
      {connected && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
          <Check className="h-3 w-3" /> Connected
        </span>
      )}
      <div className="h-8 w-8">{logo}</div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Integrations");

  const sections = [
    {
      label: "Chat & Alerts",
      items: [
        { logo: <SlackLogo />, name: "Slack", description: "Get instant alerts for critical findings and scan completions in your Slack channels." },
        { logo: <MSTeamsLogo />, name: "MS Teams", description: "Receive security notifications in Microsoft Teams channels." },
        { logo: <div className="h-8 w-8 rounded bg-blue-500 flex items-center justify-center"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></div>, name: "Email Forwarding", description: "Forward security alerts and weekly summaries to any email address." },
      ],
    },
    {
      label: "Task Trackers",
      items: [
        { logo: <JiraLogo />, name: "Jira", description: "Automatically create Jira tickets for security findings and sync status back." },
        { logo: <LinearLogo />, name: "Linear", description: "Push issues to Linear and track remediation from your engineering workflow." },
      ],
    },
    {
      label: "Source Control",
      items: [
        { logo: <GitHubLogo />, name: "GitHub", description: "Connect GitHub to enable SAST scanning on PRs and automatic fix suggestions.", connected: true },
        { logo: <GitLabLogo />, name: "GitLab", description: "Scan merge requests and monitor your CI/CD pipeline for vulnerabilities." },
        { logo: <BitbucketLogo />, name: "Bitbucket", description: "Enable pull request scanning and security gate checks for Bitbucket repos." },
      ],
    },
    {
      label: "Cloud",
      items: [
        { logo: <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center"><span className="text-white font-bold text-xs">aws</span></div>, name: "AWS", description: "Detect misconfigurations in your AWS cloud infrastructure." },
        { logo: <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center"><svg viewBox="0 0 18 18" className="h-5 w-5 fill-white"><path d="M9 1L1 15h5l3-5 3 5h5z"/></svg></div>, name: "Azure", description: "Monitor Azure subscriptions for security misconfigurations." },
        { logo: <div className="h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center"><span className="font-bold text-blue-600 text-sm">G</span></div>, name: "GCP", description: "Scan Google Cloud projects for identity and configuration risks." },
      ],
    },
  ];

  const filteredSections = sections.map(s => ({
    ...s,
    items: s.items.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(s => s.items.length > 0);

  return (
    <>
      <div className="bg-white border-b border-gray-100 py-4 flex items-center gap-3 -mx-6 px-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search integrations…"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors">
          {filter} <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        <span className="sr-only">{filter}</span>
      </div>

      <div className="space-y-8 mt-6">
        {filteredSections.map(sec => (
          <div key={sec.label}>
            <div className="flex items-center gap-1.5 mb-3">
              <p className="text-base font-semibold text-gray-900">{sec.label}</p>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sec.items.map(item => (
                <IntegrationCard key={item.name} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState("general");
  const [repoCount, setRepoCount] = useState(0);
  const [memberCount, setMemberCount] = useState(1);

  const wsName = activeWorkspace?.name ?? "Organization";
  const orgId  = activeWorkspace?.id  ?? "";

  const activeTabLabel = TABS.find(t => t.id === activeTab)?.label ?? "General";

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("repositories")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .then(({ count }) => setRepoCount(count ?? 0));
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .then(({ count }) => setMemberCount(count ?? 1));
  }, [orgId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-gray-400 mb-0">
          <span>Settings</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-600 font-medium">{activeTabLabel}</span>
        </div>

        {/* Hero */}
        <div className="flex items-center gap-5 py-6 border-b border-gray-200 bg-white -mx-6 px-6">
          <OrgAvatar />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{wsName}</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {repoCount} active {repoCount === 1 ? "repo" : "repos"}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                <Users className="h-3 w-3" />
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-b border-gray-200 bg-white -mx-6 px-6 mb-0">
          <div className="flex items-center overflow-x-auto gap-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px",
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          {activeTab === "general"      && <GeneralTab wsName={wsName} />}
          {activeTab === "users"        && <UsersTab orgId={orgId} />}
          {activeTab === "teams"        && <TeamsTab orgId={orgId} />}
          {activeTab === "repositories" && <RepositoriesTab orgId={orgId} />}
          {activeTab === "clouds"       && <CloudsTab />}
          {activeTab === "containers"   && <ContainersTab />}
          {activeTab === "domains"      && <DomainsTab />}
          {activeTab === "integrations" && <IntegrationsTab />}
        </div>
      </div>
    </div>
  );
}

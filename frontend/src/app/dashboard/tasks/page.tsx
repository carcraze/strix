"use client";

import { useState, useEffect, useMemo } from "react";
import {
    CheckSquare2, Plus, MoreVertical, CheckCircle2, Users, BellOff, Trash2, X, Search,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";

// ─────────────── Status Config ───────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
    open:        { label: "Open",        bg: "bg-blue-50",    color: "text-blue-700",   border: "border-blue-200"   },
    in_progress: { label: "In Progress", bg: "bg-orange-50",  color: "text-orange-700", border: "border-orange-200" },
    completed:   { label: "Completed",   bg: "bg-green-50",   color: "text-green-700",  border: "border-green-200"  },
    delegated:   { label: "Delegated",   bg: "bg-blue-50",  color: "text-blue-700", border: "border-blue-200" },
    snoozed:     { label: "Snoozed",     bg: "bg-yellow-50",  color: "text-yellow-700", border: "border-yellow-200" },
};

const PRIORITY_CONFIG: Record<string, { dot: string; label: string }> = {
    critical: { dot: "bg-red-500",    label: "Critical" },
    high:     { dot: "bg-orange-500", label: "High"     },
    medium:   { dot: "bg-blue-500",   label: "Medium"   },
    low:      { dot: "bg-green-500",  label: "Low"      },
};

// ─────────────── Delegate Modal ───────────────
function DelegateModal({ onClose, onDelegate }: { onClose: () => void; onDelegate: (name: string) => void }) {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onDelegate(name.trim());
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Delegate Task</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delegate to</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Email or name"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            Delegate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────── Add Task Modal ───────────────
function AddTaskModal({
    onClose,
    onSuccess,
    activeWorkspace,
}: {
    onClose: () => void;
    onSuccess: () => void;
    activeWorkspace: any;
}) {
    const [taskTitle, setTaskTitle]       = useState('');
    const [taskDesc, setTaskDesc]         = useState('');
    const [taskPriority, setTaskPriority] = useState('medium');
    const [assignTo, setAssignTo]         = useState('');
    const [dueDate, setDueDate]           = useState('');
    const [submitting, setSubmitting]     = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskTitle.trim()) return;
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const descFull = [taskDesc, assignTo ? `Assigned to: ${assignTo}` : ''].filter(Boolean).join('\n\n');
            await supabase.from('tasks').insert({
                organization_id: activeWorkspace?.id,
                issue_id:        null,
                title:           taskTitle.trim(),
                description:     descFull || null,
                priority:        taskPriority,
                status:          'open',
                created_by:      user?.id,
                due_date:        dueDate || null,
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to add task', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Add Task</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task title <span className="text-red-500">*</span></label>
                        <input
                            autoFocus
                            type="text"
                            value={taskTitle}
                            onChange={e => setTaskTitle(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Task title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={taskDesc}
                            onChange={e => setTaskDesc(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Optional description"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
                        <input type="text" value={assignTo} onChange={e => setAssignTo(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Email or name (optional)" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
                            {submitting ? 'Adding…' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────── Row Action Menu ───────────────
function TaskMenu({
    task,
    onMarkComplete,
    onDelegate,
    onSnooze,
    onDelete,
    onClose,
}: {
    task: any;
    onMarkComplete: () => void;
    onDelegate: () => void;
    onSnooze: () => void;
    onDelete: () => void;
    onClose: () => void;
}) {
    return (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
            <button onClick={() => { onMarkComplete(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-gray-500" /> Mark Complete
            </button>
            <button onClick={() => { onDelegate(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Users className="h-4 w-4 text-gray-500" /> Delegate
            </button>
            <button onClick={() => { onSnooze(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <BellOff className="h-4 w-4 text-gray-500" /> Snooze
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button onClick={() => { onDelete(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="h-4 w-4" /> Delete
            </button>
        </div>
    );
}

// ─────────────── Main Component ───────────────
export default function TasksPage() {
    const [loading, setLoading]           = useState(true);
    const [tasks, setTasks]               = useState<any[]>([]);
    const [searchQuery, setSearchQuery]   = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [openMenuId, setOpenMenuId]     = useState<string | null>(null);
    const [delegateTask, setDelegateTask] = useState<any | null>(null);
    const [toast, setToast]               = useState<string | null>(null);
    const { activeWorkspace }             = useWorkspace();

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const fetchTasks = async () => {
        if (!activeWorkspace) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*, issues(title)')
                .eq('organization_id', activeWorkspace.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            console.error('Failed to fetch tasks', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, [activeWorkspace]);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-task-menu]')) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const stats = useMemo(() => ({
        open:        tasks.filter(t => t.status === 'open').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed:   tasks.filter(t => t.status === 'completed').length,
        delegated:   tasks.filter(t => t.status === 'delegated').length,
    }), [tasks]);

    const filteredTasks = useMemo(() => {
        if (!searchQuery) return tasks;
        const q = searchQuery.toLowerCase();
        return tasks.filter(t =>
            t.title?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.issues?.title?.toLowerCase().includes(q)
        );
    }, [tasks, searchQuery]);

    const updateTaskStatus = async (taskId: string, status: string, extra?: Record<string, any>) => {
        try {
            await supabase.from('tasks').update({ status, ...extra }).eq('id', taskId);
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, ...extra } : t));
        } catch (err) { console.error(err); }
    };

    const deleteTask = async (taskId: string) => {
        try {
            await supabase.from('tasks').delete().eq('id', taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            showToast('Task deleted');
        } catch (err) { console.error(err); }
    };

    const handleDelegate = async (task: any, name: string) => {
        const extra = { description: [task.description, `Delegated to: ${name}`].filter(Boolean).join('\n\n') };
        await updateTaskStatus(task.id, 'delegated', extra);
        setDelegateTask(null);
        showToast(`Task delegated to ${name}`);
    };

    const handleSnooze = async (taskId: string) => {
        const until = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        await updateTaskStatus(taskId, 'snoozed', { snoozed_until: until.toISOString() });
        showToast('Task snoozed for 3 days');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modals */}
            {showAddModal && (
                <AddTaskModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { fetchTasks(); showToast('Task added successfully'); }}
                    activeWorkspace={activeWorkspace}
                />
            )}
            {delegateTask && (
                <DelegateModal
                    onClose={() => setDelegateTask(null)}
                    onDelegate={(name) => handleDelegate(delegateTask, name)}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl">
                    {toast}
                </div>
            )}

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckSquare2 className="h-6 w-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Add Task
                    </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { key: 'open',        label: 'Open',        icon: '○', iconColor: 'text-blue-500'   },
                        { key: 'in_progress', label: 'In Progress', icon: '◑', iconColor: 'text-orange-500' },
                        { key: 'completed',   label: 'Completed',   icon: '●', iconColor: 'text-green-500'  },
                        { key: 'delegated',   label: 'Delegated',   icon: '◎', iconColor: 'text-blue-500' },
                    ].map(({ key, label, icon, iconColor }) => (
                        <div key={key} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-lg ${iconColor}`}>{icon}</span>
                                <span className="text-sm text-gray-600 font-medium">{label}</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{stats[key as keyof typeof stats]}</div>
                        </div>
                    ))}
                </div>

                {/* Table card */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Search */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search tasks"
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-500 text-sm">Loading tasks…</div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <CheckSquare2 className="h-10 w-10 text-gray-300 mb-4" />
                            <h3 className="text-sm font-medium text-gray-600 mb-1">No tasks yet</h3>
                            <p className="text-xs text-gray-500">Add your first task to get started</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="h-4 w-4" /> Add Task
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Priority</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Title</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Issue</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Assigned To</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Due Date</th>
                                        <th className="px-5 py-3 font-semibold text-sm text-gray-900">Status</th>
                                        <th className="px-2 py-3 w-10" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTasks.map(task => {
                                        const pConf   = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                                        const sConf   = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;
                                        const menuOpen = openMenuId === task.id;

                                        // Extract assigned to from description
                                        const assignedMatch = task.description?.match(/(?:Assigned to|Delegated to): (.+)/);
                                        const assignedTo    = assignedMatch ? assignedMatch[1] : '—';

                                        const dueDate = task.due_date
                                            ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : '—';

                                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

                                        return (
                                            <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                                                {/* Priority */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2.5 h-2.5 rounded-full ${pConf.dot}`} />
                                                        <span className="text-xs text-gray-600">{pConf.label}</span>
                                                    </div>
                                                </td>

                                                {/* Title */}
                                                <td className="px-5 py-4">
                                                    <div className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                                        {task.title}
                                                    </div>
                                                    {task.description && !task.description.startsWith('Assigned to') && !task.description.startsWith('Delegated to') && (
                                                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                                                            {task.description.split('\n')[0]}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Linked issue */}
                                                <td className="px-5 py-4">
                                                    {task.issues?.title ? (
                                                        <span className="text-xs text-blue-600 truncate max-w-[160px] block">
                                                            {task.issues.title}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>

                                                {/* Assigned to */}
                                                <td className="px-5 py-4 text-sm text-gray-700">{assignedTo}</td>

                                                {/* Due date */}
                                                <td className="px-5 py-4">
                                                    <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                                        {dueDate}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${sConf.bg} ${sConf.color} ${sConf.border}`}>
                                                        {sConf.label}
                                                    </span>
                                                </td>

                                                {/* Three dots menu */}
                                                <td className="px-2 py-4 relative" data-task-menu>
                                                    <button
                                                        data-task-menu
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                                                        onClick={() => setOpenMenuId(menuOpen ? null : task.id)}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                    {menuOpen && (
                                                        <TaskMenu
                                                            task={task}
                                                            onMarkComplete={() => { updateTaskStatus(task.id, 'completed'); showToast('Task marked complete'); }}
                                                            onDelegate={() => setDelegateTask(task)}
                                                            onSnooze={() => handleSnooze(task.id)}
                                                            onDelete={() => deleteTask(task.id)}
                                                            onClose={() => setOpenMenuId(null)}
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

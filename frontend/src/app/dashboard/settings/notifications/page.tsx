import { NotificationsSettings } from "@/components/settings/NotificationsSettings";

export default function NotificationsSettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white font-syne">Notifications</h1>
            <NotificationsSettings />
        </div>
    );
}

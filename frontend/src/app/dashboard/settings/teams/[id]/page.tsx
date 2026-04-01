import { redirect } from 'next/navigation';

export default function TeamDetailPage() {
  redirect('/dashboard/settings#teams');
}

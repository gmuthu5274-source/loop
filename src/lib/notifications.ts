import { supabase } from './supabase';
import type { Profile } from './types';

export type NotificationType = 'workout' | 'meal' | 'task' | 'progress' | 'quote' | 'general';

export async function createNotification(
  type: NotificationType,
  title: string,
  body: string,
  linkPage?: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  // Check user preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('notify_workouts, notify_meals, notify_tasks, notify_progress, notify_quotes, quiet_start, quiet_end, notification_style')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile) {
    const prefMap: Record<string, boolean> = {
      workout: profile.notify_workouts,
      meal: profile.notify_meals,
      task: profile.notify_tasks,
      progress: profile.notify_progress,
      quote: profile.notify_quotes,
      general: true,
    };
    if (prefMap[type] === false) return;

    // Quiet hours check
    if (isInQuietHours(profile.quiet_start || '22:00', profile.quiet_end || '07:00')) return;

    // Minimal style: only task and progress notifications
    if (profile.notification_style === 'minimal' && type !== 'task' && type !== 'progress') return;
  }

  // Anti-annoyance: max 2 proactive per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  if (count !== null && count >= 2 && type !== 'task') return;

  await supabase.from('notifications').insert({
    user_id: userData.user.id,
    type,
    title,
    body,
    link_page: linkPage || null,
  });
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);

  if (error || count === null) return 0;
  return count;
}

export async function getNotifications(limit = 30): Promise<any[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

export async function markAsRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllRead(): Promise<void> {
  await supabase.from('notifications').update({ read: true }).neq('id', '00000000-0000-0000-0000-000000000000');
}

export async function dismissNotification(id: string): Promise<void> {
  await supabase.from('notifications').delete().eq('id', id);
}

function isInQuietHours(quietStart: string, quietEnd: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes < endMinutes) {
    // Same day range e.g. 14:00 - 16:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Crosses midnight e.g. 22:00 - 07:00
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

const FITNESS_QUOTES = [
  'Small steps, strong you.',
  'Consistency beats intensity.',
  'Show up. Even when you don\u2019t feel like it.',
  'Progress is progress, no matter how small.',
  'Your only competition is who you were yesterday.',
  'Rest is part of the work.',
  'Hydrate, move, repeat.',
  'Strength doesn\u2019t come from what you can do. It comes from overcoming what you once couldn\u2019t.',
];

export function getDailyQuote(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return FITNESS_QUOTES[dayOfYear % FITNESS_QUOTES.length];
}

// Optional browser push with explicit consent
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showBrowserNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/ChatGPT_Image_Sep_23,_2026,_07_54_43_PM.png' });
    } catch {
      // Silently ignore if notification fails
    }
  }
}

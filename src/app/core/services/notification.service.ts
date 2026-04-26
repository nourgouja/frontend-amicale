import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  notifications = signal<AppNotification[]>([]);
  unreadCount = computed(() => this.notifications().length);

  private abortController: AbortController | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  init(): void {
    this.loadAll();
    this.connectSse();
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  private loadAll(): void {
    this.http.get<AppNotification[]>('/api/notifications').subscribe({
      next: notifs => this.notifications.set(notifs),
      error: () => {},
    });
  }

  private connectSse(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.abortController?.abort();
    this.abortController = new AbortController();

    fetch('/api/notifications/stream', {
      headers: { Authorization: `Bearer ${token}` },
      signal: this.abortController.signal,
    })
      .then(async response => {
        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';
          for (const event of events) {
            const dataLine = event.split('\n').find(l => l.startsWith('data:'));
            if (!dataLine) continue;
            try {
              const notif: AppNotification = JSON.parse(dataLine.slice(5).trim());
              this.notifications.update(list => [notif, ...list]);
            } catch {}
          }
        }
        this.scheduleReconnect();
      })
      .catch(err => {
        if ((err as Error).name !== 'AbortError') this.scheduleReconnect();
      });
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => this.connectSse(), 5000);
  }

  private disconnect(): void {
    this.abortController?.abort();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
  }

  markAllRead(): void {
    this.http.post('/api/notifications/read', {}).subscribe();
    this.notifications.set([]);
  }
}

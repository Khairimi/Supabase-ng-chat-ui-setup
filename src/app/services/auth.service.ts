import { inject, Injectable, NgZone } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabase!: SupabaseClient;

  private router = inject(Router);
  private _ngZone = inject(NgZone);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          lockType: 'mem'
        } as any
      }
    );

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('event', event);
      console.log('session', session);

      try { localStorage.setItem('session', JSON.stringify(session?.user ?? null)); } catch {}

      if (session?.user) {
        this._ngZone.run(() => {
          this.router.navigate(['/chat']);
        });
      }
    });
  }

  private async withLockRetry<T>(fn: () => Promise<T>, maxAttempts = 5): Promise<T> {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const isLockError = (err && (err.name === 'NavigatorLockAcquireTimeoutError' || /NavigatorLockAcquireTimeoutError/.test(err.message || '')));
        console.error(`AuthService: attempt ${attempt + 1} error:`, err);
        if (isLockError && attempt < maxAttempts - 1) {
          const backoff = Math.pow(2, attempt) * 100 + Math.floor(Math.random() * 100);
          console.warn(`Navigator lock timeout — retrying auth call in ${backoff}ms (attempt ${attempt + 1})`);
          await delay(backoff);
          continue;
        }
        throw err;
      }
    }
    throw new Error('AuthService: retries exhausted');
  }

  get isLoggedIn(): boolean {
    const user = localStorage.getItem('session');
    return user === 'undefined' || !user ? false : true;
  }

  async signInWithGoogle() {
    console.log('AuthService.signInWithGoogle invoked');
    return this.withLockRetry(() => this.supabase.auth.signInWithOAuth({ provider: 'google' }));
  }

  async signOut() {
    console.log('AuthService.signOut invoked');
    const res = await this.withLockRetry(() => this.supabase.auth.signOut());
    const maybe: any = res;
    if (maybe && maybe.error) throw maybe.error;
    return res;
  }
}

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private supabase: SupabaseClient;
  

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async chatMessage(text: string): Promise<any> {
    console.log('ChatService.chatMessage called with:', text);

    const maxAttempts = 5;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const table = (environment as any).supabaseChatTable ?? 'chat';

        // try common column names in order until one succeeds
        const columnsToTry = ['text', 'message', 'content', 'body'];
        let lastError: any = null;
        for (const col of columnsToTry) {
          try {
            const payload: any = {};
            payload[col] = text;
            const { data, error } = await this.supabase
              .from(table)
              .insert([payload]);

            if (error) {
              lastError = error;
              const msg = (error.message || '').toLowerCase();
              if (msg.includes('column') || msg.includes('does not exist') || msg.includes('unknown')) {
                console.warn(`Insert failed for column '${col}', trying next candidate.`);
                continue;
              }
              console.error('Supabase insert error:', error);
              throw error;
            }

            console.log(`Supabase insert data (column '${col}') :`, data);
            return data;
          } catch (e: any) {
            lastError = e;
            if (e && e.code === 'PGRST205') throw e;
          }
        }
        if (lastError) throw lastError;
      } catch (err: any) {
        const isLockError = (err && (err.name === 'NavigatorLockAcquireTimeoutError' || /NavigatorLockAcquireTimeoutError/.test(err.message || '')));
        console.error(`ChatService.chatMessage attempt ${attempt + 1} error:`, err);

        // Provide actionable guidance when table is missing in Supabase
        if (err && err.code === 'PGRST205') {
          console.error(`Supabase table not found: '${(environment as any).supabaseChatTable ?? 'chat'}'. Create this table in Supabase or update 'supabaseChatTable' in your environment file.`);
          throw err;
        }

        if (isLockError && attempt < maxAttempts - 1) {
          const backoff = Math.pow(2, attempt) * 100 + Math.floor(Math.random() * 100);
          console.warn(`Navigator lock timeout — retrying in ${backoff}ms (attempt ${attempt + 1})`);
          await delay(backoff);
          continue;
        }

        throw err;
      }
    }
    throw new Error('Failed to send chat message after retries');
  }

async listChat(): Promise<any> {
  try {
    const {data, error} = await this.supabase.from('chat').select('*,users(*)')

    if (error) {
      alert(error.message);
    }

    return data;
  } catch (error) {
    throw error
  }
 }

}

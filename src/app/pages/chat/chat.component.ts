import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService } from '../../supabase/chat.service';
import { Ichat } from '../../interface/chat-response';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent {
  private auth = inject(AuthService);
  private chat_service = inject(ChatService);
  private router = inject(Router);

  chats: Ichat[] = [];
  chatForm!: FormGroup;
  private fb = inject(FormBuilder);
 
  constructor() {
    this.chatForm = this.fb.group({
      chat_message: ['', Validators.required]
    });

    this.onListChat();
  }

  async logOut() {
    console.log('logOut() clicked');
    try {
      const res = await this.auth.signOut();
      console.log('signOut result:', res);
      // Clear local session immediately to ensure UI updates even if Supabase has issues
      try { localStorage.removeItem('session'); } catch {}
      // Always navigate back to login page after attempting sign-out
      await this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('signOut error:', error);
      try { localStorage.removeItem('session'); } catch {}
      // Navigate away even if signOut failed
      await this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    const formValue = this.chatForm.value.chat_message;
    console.log(formValue);

    this.chat_service
      .chatMessage(formValue)
      .then((res) => {
        console.log(res);
        this.chatForm.reset();
        this.onListChat();
      })
      .catch((err: any) => {
        alert(err?.message ?? err);
      });
  }

  onListChat() {
    this.chat_service.listChat()
      .then((res: any[] | null) => {
        console.log('listChat result:', res);
        this.chats = res ?? [];
      })
      .catch((error: any) => {
        console.error('listChat error:', error);
      });
  }

}
                                                                 
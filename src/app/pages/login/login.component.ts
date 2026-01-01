import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule], // Provide common directives
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'] // Changed to plural [] just to be safe
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router); // Inject router to move to chat after login
  loading = false;

  async handleAuth() {
    this.loading = true;
    try {
      console.log('handleAuth() start');
      const res: any = await this.auth.signInWithGoogle();
      console.log('signInWithGoogle result:', res);

      if (res?.error) throw res.error;

      const maybeUrl = res?.data?.url ?? res?.url ?? res?.data?.confirmation_url;
      if (maybeUrl) {
        window.location.href = maybeUrl;
        return;
      }

      console.log('handleAuth() finished, waiting for auth state change');
    } catch (error: any) {
      console.error('Authentication error:', error);
      alert('Login failed: ' + (error?.message ?? error));
    } finally {
      this.loading = false;
    }
  }
}
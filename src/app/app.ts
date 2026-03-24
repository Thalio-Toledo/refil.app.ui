import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LoginModalComponent } from "./components/login-modal.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, LoginModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('refil.app.ui');
  darkMode = false;

  toggleTheme() {
    const html = document.documentElement;
    this.darkMode = !this.darkMode

    if (this.darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
}

import { Component } from '@angular/core'
import { AuthService } from '../services/auth.service'
import { LoginModalService } from '../services/login-modal.service'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'


@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports:[CommonModule,FormsModule],
  template: `
    <div class="overlay" *ngIf="open$ | async">
      <div class="modal">
        <h2>Acesso restrito</h2>

        <input placeholder="Usuário" [(ngModel)]="user" />
        <input type="password" placeholder="Senha" [(ngModel)]="pass" />

        <button (click)="login()">Entrar</button>
        <p *ngIf="error">Usuário ou senha inválidos</p>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .modal {
      background: #fff;
      padding: 24px;
      border-radius: 8px;
      width: 300px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    input, button {
      padding: 8px;
      width: 100%;
    }
    p { color: red; }
  `]
})
export class LoginModalComponent {
    constructor(
      private auth: AuthService,
      public modal: LoginModalService
    ) {
        this.open$ = this.modal.open$

}
  user = ''
  pass = ''
  error = false
  open$ = null
  


  login() {
    if (this.auth.login(this.user, this.pass)) {
      this.modal.close()
    } else {
      this.error = true
    }
  }
}
import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER = 'admin'
  private readonly PASSWORD = '@dm1n'

  isAuthenticated(): boolean {
    return localStorage.getItem('auth') === 'true'
  }

  login(user: string, pass: string): boolean {
    if (user === this.USER && pass === this.PASSWORD) {
      localStorage.setItem('auth', 'true')
      return true
    }
    return false
  }

  logout() {
    localStorage.removeItem('auth')
  }
}
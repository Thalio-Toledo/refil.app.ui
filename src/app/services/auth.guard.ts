import { CanActivateFn } from '@angular/router'
import { inject } from '@angular/core'
import { AuthService } from './auth.service'
import { LoginModalService } from './login-modal.service'

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  const modal = inject(LoginModalService)

  if (auth.isAuthenticated()) {
    return true
  }

  modal.open()
  return false
}
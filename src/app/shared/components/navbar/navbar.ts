import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { GerenciarDelegacoesModal } from '../../../modules/meta/components/gerenciar-delegacoes-modal/gerenciar-delegacoes-modal';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, GerenciarDelegacoesModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  displayDelegacoesModal = false;

  constructor(public auth: Auth) { }

  openDelegacoesModal(): void {
    this.displayDelegacoesModal = true;
  }

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }
}

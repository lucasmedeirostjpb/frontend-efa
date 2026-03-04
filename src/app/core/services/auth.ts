import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private keycloak: Keycloak;

  constructor() {
    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });
  }

  async init(): Promise<boolean> {
    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
        checkLoginIframe: false,
      });
      return authenticated;
    } catch (error) {
      console.error('Keycloak init failed', error);
      return false;
    }
  }

  login(): void {
    this.keycloak.login();
  }

  logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }

  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated;
  }

  getToken(): string | undefined {
    return this.keycloak.token;
  }

  getUsername(): string | undefined {
    return this.keycloak.tokenParsed?.['preferred_username'];
  }

  hasRole(role: string): boolean {
    // Check client roles first, then realm roles
    const clientRoles =
      this.keycloak.tokenParsed?.['resource_access']?.[environment.keycloak.clientId]?.['roles'] || [];
    const realmRoles =
      this.keycloak.tokenParsed?.['realm_access']?.['roles'] || [];

    return clientRoles.includes(role) || realmRoles.includes(role);
  }

  isCoordenador(): boolean {
    return this.hasRole('COORDENADOR');
  }

  async updateToken(minValidity: number = 30): Promise<string | undefined> {
    try {
      await this.keycloak.updateToken(minValidity);
      return this.keycloak.token;
    } catch {
      this.login();
      return undefined;
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Delegacao, DelegacaoCreatePayload } from '../models/delegacao.model';

@Injectable({
  providedIn: 'root',
})
export class DelegacaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/coordenadores/me/delegacoes`;

  listarMinhasDelegacoes(): Observable<Delegacao[]> {
    return this.http.get<Delegacao[]>(this.apiUrl);
  }

  adicionarDelegacao(payload: DelegacaoCreatePayload): Observable<Delegacao> {
    return this.http.post<Delegacao>(this.apiUrl, payload);
  }

  removerDelegacao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
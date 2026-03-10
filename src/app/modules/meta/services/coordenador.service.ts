import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Coordenador {
  id: number;
  nome: string;
}

@Injectable({
  providedIn: 'root',
})
export class CoordenadorService {
  private readonly apiUrl = `${environment.apiUrl}/api/coordenadores`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Coordenador[]> {
    return this.http.get<Coordenador[]>(this.apiUrl);
  }
}

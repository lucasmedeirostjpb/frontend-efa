import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Eixo } from '../models/meta.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EixoService {
  private readonly apiUrl = `/api/eixos`;

  constructor(private http: HttpClient) { }

  listarTodos(): Observable<Eixo[]> {
    return this.http.get<Eixo[]>(this.apiUrl);
  }
}

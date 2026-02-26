import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meta } from '../models/meta.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MetaService {

  private readonly apiUrl = `${environment.apiUrl}/api/metas`;

  constructor(private http: HttpClient) { }

  /**
   * GET /api/metas - Rota pública, lista todas as metas.
   */
  listar(): Observable<Meta[]> {
    return this.http.get<Meta[]>(this.apiUrl);
  }

  /**
   * GET /api/metas/:id - Busca uma meta pelo ID.
   */
  buscarPorId(id: number): Observable<Meta> {
    return this.http.get<Meta>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/metas - Cria uma nova meta.
   * Requer role COORDENADOR (token via interceptor).
   */
  criar(meta: Partial<Meta>): Observable<Meta> {
    return this.http.post<Meta>(this.apiUrl, meta);
  }

  /**
   * PUT /api/metas/:id - Atualiza uma meta existente.
   * Requer role COORDENADOR (token via interceptor).
   */
  atualizar(id: number, meta: Partial<Meta>): Observable<Meta> {
    return this.http.put<Meta>(`${this.apiUrl}/${id}`, meta);
  }
}

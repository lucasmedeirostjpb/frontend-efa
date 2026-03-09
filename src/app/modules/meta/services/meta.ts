import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meta, Page, HistoricoAlteracao } from '../models/meta.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MetaService {

  private readonly apiUrl = `${environment.apiUrl}/api/metas`;

  constructor(private http: HttpClient) { 
    console.log('MetaService: apiUrl configurada como:', this.apiUrl);
  }

  /**
   * GET /api/metas?page=X&size=Y - Lista metas com paginação.
   */
  listar(page: number = 0, size: number = 10): Observable<Page<Meta>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<Meta>>(this.apiUrl, { params });
  }

  /**
   * GET /api/metas/:id - Busca uma meta pelo ID.
   */
  buscarPorId(id: string): Observable<Meta> {
    return this.http.get<Meta>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/metas/:id/historico - Busca o histórico de alterações (JaVers).
   */
  buscarHistorico(id: string): Observable<HistoricoAlteracao[]> {
    return this.http.get<HistoricoAlteracao[]>(`${this.apiUrl}/${id}/historico`);
  }

  /**
   * POST /api/metas - Cria uma nova meta.
   * Requer role COORDENADOR (token via interceptor).
   */
  criar(meta: Partial<Meta>): Observable<Meta> {
    return this.http.post<Meta>(this.apiUrl, meta);
  }

  /**
   * POST /api/metas/batch - Cria metas em lote.
   * Requer role COORDENADOR.
   */
  criarEmLote(metas: Partial<Meta>[]): Observable<Meta[]> {
    return this.http.post<Meta[]>(`${this.apiUrl}/batch`, metas);
  }

  /**
   * PUT /api/metas/:id - Atualiza uma meta existente.
   * Requer role COORDENADOR (token via interceptor).
   */
  atualizar(id: string, meta: Partial<Meta>): Observable<Meta> {
    return this.http.put<Meta>(`${this.apiUrl}/${id}`, meta);
  }

  /**
   * DELETE /api/metas/:id - Exclui uma meta.
   * Requer role COORDENADOR (token via interceptor).
   */
  deletar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

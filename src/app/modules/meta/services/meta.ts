import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  HistoricoAlteracao,
  Meta,
  MetaAcompanhamentoUpdatePayload,
  MetaCreatePayload,
  MetaEstruturalUpdatePayload,
  Page,
} from '../models/meta.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MetaService {

  private readonly apiUrl = `${environment.apiUrl}/api/metas`;

  constructor(private http: HttpClient) { }

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
   * GET /api/metas/all - Lista TODAS as metas sem paginação.
   */
  listarTodas(): Observable<Meta[]> {
    return this.http.get<Meta[]>(`${this.apiUrl}/all`);
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
   * Requer role com permissão para criação estrutural.
   */
  criar(meta: MetaCreatePayload): Observable<Meta> {
    return this.http.post<Meta>(this.apiUrl, meta);
  }

  /**
   * POST /api/metas/batch - Cria metas em lote.
   * Requer role com permissão para criação estrutural.
   */
  criarEmLote(metas: Array<Partial<MetaCreatePayload>>): Observable<Meta[]> {
    return this.http.post<Meta[]>(`${this.apiUrl}/batch`, metas);
  }

  /**
   * PUT /api/metas/:id - Atualiza estruturalmente uma meta existente.
   * Requer role DIGOV.
   */
  updateMetaEstrutural(id: string, meta: MetaEstruturalUpdatePayload): Observable<Meta> {
    return this.http.put<Meta>(`${this.apiUrl}/${id}`, meta);
  }

  /**
   * PUT /api/metas/:id/acompanhamento - Atualiza apenas o acompanhamento de uma meta.
   * Requer role COORDENADOR dono da meta.
   */
  updateMetaAcompanhamento(id: string, meta: MetaAcompanhamentoUpdatePayload): Observable<Meta> {
    return this.http.put<Meta>(`${this.apiUrl}/${id}/acompanhamento`, meta);
  }

  /**
   * DELETE /api/metas/:id - Exclui uma meta.
   * Requer role DIGOV.
   */
  deletar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

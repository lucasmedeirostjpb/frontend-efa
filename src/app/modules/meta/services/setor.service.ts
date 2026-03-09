import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Setor } from '../models/meta.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SetorService {
  private readonly apiUrl = `/api/setores`;

  constructor(private http: HttpClient) { }

  listarTodos(): Observable<Setor[]> {
    return this.http.get<Setor[]>(this.apiUrl);
  }
}

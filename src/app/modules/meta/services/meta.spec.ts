import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Meta, MetaAcompanhamentoUpdatePayload, MetaEstruturalUpdatePayload } from '../models/meta.model';
import { MetaService } from './meta';

describe('MetaService', () => {
  let service: MetaService;
  let httpMock: HttpTestingController;

  const metaMock: Meta = {
    id: 'meta-1',
    titulo: 'Meta institucional',
    descricao: 'Descricao',
    data_criacao: '2026-03-11T00:00:00Z',
    status: 'EM_ANDAMENTO',
    eixoId: 1,
    setorId: 2,
    coordenadorId: 3,
    coordenadorNome: 'Coordenadora',
    coordenadorLoginKeycloak: 'coord.teste',
    artigo: 'Art. 5o',
    anoCiclo: 2026,
    deadline: '2026-12-31T00:00:00Z',
    pMaximo: 100,
    estimativaReal: 40,
    tetoEstimado: 70,
    pontosAtingidos: 0,
    nivelDificuldade: 'EM_ALERTA',
    evidenciasAuditoria: 'Evidencias registradas para acompanhamento.',
    observacoes: 'Observacoes iniciais',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MetaService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MetaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call the structural update endpoint for DIGOV payloads', () => {
    const payload: MetaEstruturalUpdatePayload = {
      titulo: 'Meta revisada',
      descricao: 'Descricao revisada',
      eixoId: 1,
      setorId: 2,
      coordenadorId: 4,
      artigo: 'Art. 6o',
      anoCiclo: 2027,
      deadline: '2027-10-20T00:00:00Z',
      status: 'PARCIALMENTE_CUMPRIDA',
      nivelDificuldade: 'SITUACAO_CRITICA',
      evidenciasAuditoria: 'Texto de evidencia com mais de vinte caracteres.',
      observacoes: 'Observacao final',
      pMaximo: 120,
      estimativaReal: 80,
      tetoEstimado: 100,
      pontosAtingidos: 60,
    };

    service.updateMetaEstrutural('meta-1', payload).subscribe((meta) => {
      expect(meta).toEqual(metaMock);
    });

    const request = httpMock.expectOne('/api/metas/meta-1');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);

    request.flush(metaMock);
  });

  it('should call the acompanhamento endpoint for COORDENADOR payloads', () => {
    const payload: MetaAcompanhamentoUpdatePayload = {
      status: 'TOTALMENTE_CUMPRIDA',
      nivelDificuldade: 'SEM_DIFICULDADES',
      evidenciasAuditoria: 'Texto de evidencia com mais de vinte caracteres.',
      observacoes: 'Observacao de acompanhamento',
      estimativaReal: 90,
      tetoEstimado: 95,
      pontosAtingidos: 100,
    };

    service.updateMetaAcompanhamento('meta-1', payload).subscribe((meta) => {
      expect(meta).toEqual(metaMock);
    });

    const request = httpMock.expectOne('/api/metas/meta-1/acompanhamento');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);

    request.flush(metaMock);
  });
});
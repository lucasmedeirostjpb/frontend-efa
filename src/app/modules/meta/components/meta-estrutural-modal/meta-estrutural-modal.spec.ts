import { FormBuilder } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Auth } from '../../../../core/services/auth';
import {
  Meta,
  MetaAcompanhamentoUpdatePayload,
  MetaEstruturalUpdatePayload,
} from '../../models/meta.model';
import { CoordenadorService } from '../../services/coordenador.service';
import { EixoService } from '../../services/eixo.service';
import { MetaService } from '../../services/meta';
import { SetorService } from '../../services/setor.service';
import { MetaEstruturalModal } from './meta-estrutural-modal';

describe('MetaEstruturalModal', () => {
  const criarMeta = (overrides: Partial<Meta> = {}): Meta => ({
    id: 'meta-1',
    titulo: 'Meta base',
    descricao: 'Descricao base',
    data_criacao: '2026-03-11T00:00:00Z',
    status: 'EM_ANDAMENTO',
    eixoId: 1,
    setorId: 2,
    coordenadorId: 3,
    coordenadorNome: 'Maria Coordenadora',
    coordenadorLoginKeycloak: 'maria.coord',
    artigo: 'Art. 5o',
    anoCiclo: 2026,
    deadline: '2026-12-31T00:00:00Z',
    pMaximo: 100,
    estimativaReal: 40,
    tetoEstimado: 70,
    pontosAtingidos: 0,
    nivelDificuldade: 'EM_ALERTA',
    evidenciasAuditoria: 'Evidencias iniciais com tamanho suficiente.',
    observacoes: 'Observacao inicial',
    ...overrides,
  });

  const criarContexto = ({ isDigov, isCoordenador }: { isDigov: boolean; isCoordenador: boolean }) => {
    const metaRetornada = criarMeta();
    const metaService = {
      criar: vi.fn().mockReturnValue(of(metaRetornada)),
      updateMetaEstrutural: vi.fn().mockReturnValue(of(metaRetornada)),
      updateMetaAcompanhamento: vi.fn().mockReturnValue(of(metaRetornada)),
      deletar: vi.fn(),
    } as unknown as MetaService;

    const eixoService = {
      listarTodos: vi.fn().mockReturnValue(of([])),
    } as unknown as EixoService;

    const setorService = {
      listarTodos: vi.fn().mockReturnValue(of([])),
    } as unknown as SetorService;

    const coordenadorService = {
      listarTodos: vi.fn().mockReturnValue(of([])),
    } as unknown as CoordenadorService;

    const auth = {
      isDigov: vi.fn().mockReturnValue(isDigov),
      isCoordenador: vi.fn().mockReturnValue(isCoordenador),
      isLoggedIn: vi.fn().mockReturnValue(true),
    } as unknown as Auth;

    const component = new MetaEstruturalModal(
      new FormBuilder(),
      metaService,
      eixoService,
      setorService,
      coordenadorService,
      auth,
    );

    component.ngOnInit();

    return {
      auth,
      component,
      metaRetornada,
      metaService: metaService as unknown as {
        criar: ReturnType<typeof vi.fn>;
        updateMetaEstrutural: ReturnType<typeof vi.fn>;
        updateMetaAcompanhamento: ReturnType<typeof vi.fn>;
      },
    };
  };

  it('should use the structural endpoint with the full payload for DIGOV', () => {
    const { component, metaService } = criarContexto({ isDigov: true, isCoordenador: false });
    const meta = criarMeta();
    const deadline = new Date('2027-06-15T00:00:00.000Z');

    component.metaParaEditar = meta;
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });

    component.metaForm.patchValue({
      titulo: 'Meta DIGOV atualizada',
      descricao: 'Descricao revisada pela DIGOV',
      eixoId: 9,
      setorId: 10,
      coordenadorId: 11,
      artigo: 'Art. 9o',
      anoCiclo: 2027,
      deadline,
      status: 'PARCIALMENTE_CUMPRIDA',
      nivelDificuldade: 'SITUACAO_CRITICA',
      evidenciasAuditoria: 'Texto de evidencia revisado com tamanho suficiente.',
      observacoes: 'Observacao revisada',
      pMaximo: 130,
      estimativaReal: 88,
      tetoEstimado: 110,
      pontosAtingidos: 65,
    });

    component.salvar();

    expect(metaService.updateMetaEstrutural).toHaveBeenCalledTimes(1);
    expect(metaService.updateMetaAcompanhamento).not.toHaveBeenCalled();

    const [metaId, payload] = metaService.updateMetaEstrutural.mock.calls[0] as [string, MetaEstruturalUpdatePayload];

    expect(metaId).toBe('meta-1');
    expect(payload).toEqual({
      titulo: 'Meta DIGOV atualizada',
      descricao: 'Descricao revisada pela DIGOV',
      eixoId: 9,
      setorId: 10,
      coordenadorId: 11,
      artigo: 'Art. 9o',
      anoCiclo: 2027,
      deadline,
      status: 'PARCIALMENTE_CUMPRIDA',
      nivelDificuldade: 'SITUACAO_CRITICA',
      evidenciasAuditoria: 'Texto de evidencia revisado com tamanho suficiente.',
      observacoes: 'Observacao revisada',
      pMaximo: 130,
      estimativaReal: 88,
      tetoEstimado: 110,
      pontosAtingidos: 65,
    });
  });

  it('should use the acompanhamento endpoint with the limited payload for COORDENADOR', () => {
    const { component, metaService } = criarContexto({ isDigov: false, isCoordenador: true });
    const meta = criarMeta();

    component.metaParaEditar = meta;
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });

    component.metaForm.patchValue({
      titulo: 'Nao deve ser enviado',
      descricao: 'Tambem nao deve ser enviado',
      eixoId: 99,
      setorId: 98,
      coordenadorId: 97,
      artigo: 'Art. 99',
      anoCiclo: 2030,
      deadline: new Date('2030-01-01T00:00:00.000Z'),
      pMaximo: 999,
      status: 'TOTALMENTE_CUMPRIDA',
      nivelDificuldade: 'SEM_DIFICULDADES',
      evidenciasAuditoria: 'Texto final de evidencia com mais de vinte caracteres.',
      observacoes: 'Observacao final do acompanhamento',
      estimativaReal: 91,
      tetoEstimado: 96,
      pontosAtingidos: 100,
    });

    component.salvar();

    expect(metaService.updateMetaAcompanhamento).toHaveBeenCalledTimes(1);
    expect(metaService.updateMetaEstrutural).not.toHaveBeenCalled();

    const [metaId, payload] = metaService.updateMetaAcompanhamento.mock.calls[0] as [
      string,
      MetaAcompanhamentoUpdatePayload,
    ];

    expect(metaId).toBe('meta-1');
    expect(payload).toEqual({
      status: 'TOTALMENTE_CUMPRIDA',
      nivelDificuldade: 'SEM_DIFICULDADES',
      evidenciasAuditoria: 'Texto final de evidencia com mais de vinte caracteres.',
      observacoes: 'Observacao final do acompanhamento',
      estimativaReal: 91,
      tetoEstimado: 96,
      pontosAtingidos: 100,
    });
  });
});
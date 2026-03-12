import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Auth } from '../../../../core/services/auth';
import {
  HistoricoAlteracao,
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

  const criarContexto = ({
    isDigov,
    isCoordenador,
    canEditMeta = isDigov || isCoordenador,
    username = 'maria.coord',
    email = 'maria.coord@tjpb.jus.br',
  }: {
    isDigov: boolean;
    isCoordenador: boolean;
    canEditMeta?: boolean;
    username?: string;
    email?: string;
  }) => {
    const metaRetornada = criarMeta();
    const metaService = {
      buscarHistorico: vi.fn().mockReturnValue(of([])),
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
      getUsername: vi.fn().mockReturnValue(username),
      getEmail: vi.fn().mockReturnValue(email),
      podeEditarMeta: vi.fn().mockReturnValue(canEditMeta),
    } as unknown as Auth;

    const cdr = {
      markForCheck: vi.fn(),
    } as unknown as ChangeDetectorRef;

    const component = new MetaEstruturalModal(
      new FormBuilder(),
      cdr,
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
        buscarHistorico: ReturnType<typeof vi.fn>;
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

  it('should use the acompanhamento endpoint with the limited payload for delegated users', () => {
    const { component, metaService } = criarContexto({
      isDigov: false,
      isCoordenador: false,
      canEditMeta: true,
      username: '10350476403',
      email: 'assessor@tjpb.jus.br',
    });
    const meta = criarMeta({ delegadosEmails: ['assessor@tjpb.jus.br'] });

    component.metaParaEditar = meta;
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });

    component.metaForm.patchValue({
      status: 'PARCIALMENTE_CUMPRIDA',
      nivelDificuldade: 'EM_ALERTA',
      evidenciasAuditoria: 'Texto de evidencia do delegado com tamanho suficiente.',
      observacoes: 'Observacao registrada por delegado',
      estimativaReal: 51,
      tetoEstimado: 75,
      pontosAtingidos: 44,
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
      status: 'PARCIALMENTE_CUMPRIDA',
      nivelDificuldade: 'EM_ALERTA',
      evidenciasAuditoria: 'Texto de evidencia do delegado com tamanho suficiente.',
      observacoes: 'Observacao registrada por delegado',
      estimativaReal: 51,
      tetoEstimado: 75,
      pontosAtingidos: 44,
    });
    expect(component.isAcompanhamentoEditor()).toBe(true);
    expect(component.isDelegadoAndEditing()).toBe(true);
  });

  it('should expose the history tab and load history lazily for DIGOV', () => {
    const historicoMock: HistoricoAlteracao[] = [
      {
        id: 'hist-1',
        autor: 'digov.user',
        dataHora: '2026-03-12T10:00:00Z',
        tipoMudanca: 'ATUALIZACAO',
        propriedadesAlteradas: [
          {
            propriedade: 'status',
            valorAntigo: 'PENDENTE',
            valorNovo: 'EM_ANDAMENTO',
          },
        ],
      },
    ];
    const { component, metaService } = criarContexto({ isDigov: true, isCoordenador: false });

    metaService.buscarHistorico.mockReturnValue(of(historicoMock));
    component.metaParaEditar = criarMeta();
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });

    expect(component.canShowSectionTabs()).toBe(true);
    expect(component.canViewEstruturaTab()).toBe(true);
    expect(component.canViewHistoricoTab()).toBe(true);
    expect(component.showPreenchimentoFields()).toBe(true);

    component.setEditSection('historico');

    expect(component.editSection).toBe('historico');
    expect(component.showHistoricoSection()).toBe(true);
    expect(metaService.buscarHistorico).toHaveBeenCalledWith('meta-1');
    expect(component.historico).toEqual(historicoMock);
    expect(component.historicoLoading).toBe(false);
  });

  it('should expose only preenchimento and historico tabs for responsible COORDENADOR', () => {
    const { component, metaService } = criarContexto({ isDigov: false, isCoordenador: true, canEditMeta: true });

    component.metaParaEditar = criarMeta();
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });

    expect(component.canShowSectionTabs()).toBe(true);
    expect(component.canViewEstruturaTab()).toBe(false);
    expect(component.canViewHistoricoTab()).toBe(true);

    component.setEditSection('estrutura');
    expect(component.editSection).toBe('preenchimento');

    component.setEditSection('historico');
    expect(component.editSection).toBe('historico');
    expect(metaService.buscarHistorico).toHaveBeenCalledWith('meta-1');
  });

  it('should close consistently when the history tab is active', () => {
    const { component } = criarContexto({ isDigov: true, isCoordenador: false });
    const emitSpy = vi.spyOn(component.displayChange, 'emit');

    component.metaParaEditar = criarMeta();
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });
    component.setEditSection('historico');

    component.fechar();
    component.onDialogHide();

    expect(component.display).toBe(false);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(false);
  });

  it('should filter redundant update date fields and use readable labels in history', () => {
    const historicoMock = [
      {
        id: 'hist-2',
        autor: 'coord.user',
        dataHora: '2026-03-12T11:00:00Z',
        tipoMudanca: 'ATUALIZACAO',
        propriedadesAlteradas: [
          {
            propriedade: 'dataAtualizacao',
            valorAntigo: '2026-03-11T09:00:00Z',
            valorNovo: '2026-03-12T11:00:00Z',
          },
          {
            propriedade: 'observacoes',
            valorAntigo: 'Texto antigo',
            valorNovo: 'Texto novo',
          },
        ],
      },
    ] as unknown as HistoricoAlteracao[];
    const { component, metaService } = criarContexto({ isDigov: true, isCoordenador: false });

    metaService.buscarHistorico.mockReturnValue(of(historicoMock));
    component.metaParaEditar = criarMeta();
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });

    component.setEditSection('historico');

    expect(component.historico[0]?.propriedadesAlteradas).toEqual([
      {
        propriedade: 'observacoes',
        valorAntigo: 'Texto antigo',
        valorNovo: 'Texto novo',
      },
    ]);
    expect(component.formatHistoricoFieldLabel('observacoes')).toBe('Observações');
  });

  it('should format date-only and datetime history values for display', () => {
    const { component } = criarContexto({ isDigov: true, isCoordenador: false });

    expect(component.formatHistoricoValue('deadline', '2026-12-31')).toBe('31/12/2026');
    expect(component.formatHistoricoValue('dataCriacao', '2026-03-10T11:56:46.4780328')).toBe('10/03/2026 11:56:46');
    expect(component.formatHistoricoValue('nivelDificuldade', 'SEM_DIFICULDADES')).toBe('Sem Dificuldades');
  });

  it('should normalize malformed history payloads without leaving loading active', () => {
    const { component, metaService } = criarContexto({ isDigov: true, isCoordenador: false });

    metaService.buscarHistorico.mockReturnValue(of({ content: null } as unknown as HistoricoAlteracao[]));
    component.metaParaEditar = criarMeta();
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });

    component.setEditSection('historico');

    expect(component.historicoLoading).toBe(false);
    expect(component.historico).toEqual([]);
    expect(component.historicoError).toBe('');
  });

  it('should keep history unavailable when creating a new requisito', () => {
    const { component, metaService } = criarContexto({ isDigov: true, isCoordenador: false });

    component.metaParaEditar = null;
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });

    expect(component.canShowSectionTabs()).toBe(false);
    expect(component.canViewHistoricoTab()).toBe(false);

    component.setEditSection('historico');
    expect(component.editSection).toBe('estrutura');
    expect(metaService.buscarHistorico).not.toHaveBeenCalled();
  });
});
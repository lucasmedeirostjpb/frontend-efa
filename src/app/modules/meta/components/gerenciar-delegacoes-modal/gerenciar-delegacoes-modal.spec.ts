import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, SimpleChange } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Delegacao } from '../../models/delegacao.model';
import { DelegacaoService } from '../../services/delegacao.service';
import { GerenciarDelegacoesModal } from './gerenciar-delegacoes-modal';

describe('GerenciarDelegacoesModal', () => {
  const criarDelegacao = (overrides: Partial<Delegacao> = {}): Delegacao => ({
    id: 1,
    delegadoEmail: 'ana.assessora@tjpb.jus.br',
    delegadoNome: 'Ana Assessora',
    ...overrides,
  });

  const criarContexto = () => {
    const delegacaoService = {
      listarMinhasDelegacoes: vi.fn().mockReturnValue(of([])),
      adicionarDelegacao: vi.fn().mockReturnValue(of(criarDelegacao())),
      removerDelegacao: vi.fn().mockReturnValue(of(void 0)),
    } as unknown as DelegacaoService;

    const cdr = {
      markForCheck: vi.fn(),
    } as unknown as ChangeDetectorRef;

    const component = new GerenciarDelegacoesModal(new FormBuilder(), cdr, delegacaoService);

    return {
      component,
      delegacaoService: delegacaoService as unknown as {
        listarMinhasDelegacoes: ReturnType<typeof vi.fn>;
        adicionarDelegacao: ReturnType<typeof vi.fn>;
        removerDelegacao: ReturnType<typeof vi.fn>;
      },
    };
  };

  it('should load delegacoes when modal opens', () => {
    const { component, delegacaoService } = criarContexto();
    const delegacoes = [
      criarDelegacao({ id: 2, delegadoNome: 'Zuleica' }),
      criarDelegacao({ id: 1, delegadoNome: 'Ana' }),
    ];

    delegacaoService.listarMinhasDelegacoes.mockReturnValue(of(delegacoes));
    component.display = true;
    component.ngOnChanges({ display: new SimpleChange(false, true, true) });

    expect(delegacaoService.listarMinhasDelegacoes).toHaveBeenCalledTimes(1);
    expect(component.delegacoes.map((item) => item.delegadoNome)).toEqual(['Ana', 'Zuleica']);
  });

  it('should disable add action when email is invalid', () => {
    const { component } = criarContexto();

    component.delegacaoForm.patchValue({ email: 'email-invalido', nome: 'Ana Assessora' });

    expect(component.delegacaoForm.invalid).toBe(true);
    expect(component.isAddDisabled()).toBe(true);
  });

  it('should normalize email and append delegacao when adding', () => {
    const { component, delegacaoService } = criarContexto();

    component.delegacaoForm.patchValue({ email: ' Carlos.Assessor@TJPB.JUS.BR ', nome: 'Carlos Assessor' });
    component.addDelegacao();

    expect(delegacaoService.adicionarDelegacao).toHaveBeenCalledWith({
      delegadoEmail: 'carlos.assessor@tjpb.jus.br',
      delegadoNome: 'Carlos Assessor',
    });
    expect(component.delegacoes).toHaveLength(1);
  });

  it('should surface backend duplicate email message on 409', () => {
    const { component, delegacaoService } = criarContexto();

    delegacaoService.adicionarDelegacao.mockReturnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: { message: 'Delegação já cadastrada para este e-mail.' },
      })),
    );

    component.delegacaoForm.patchValue({ email: 'ana.assessora@tjpb.jus.br', nome: 'Ana Assessora' });
    component.addDelegacao();

    expect(component.actionError).toBe('Delegação já cadastrada para este e-mail.');
  });

  it('should remove delegacao locally after delete succeeds', () => {
    const { component, delegacaoService } = criarContexto();
    const delegacao = criarDelegacao();

    component.delegacoes = [delegacao];
    component.removeDelegacao(delegacao);

    expect(delegacaoService.removerDelegacao).toHaveBeenCalledWith(1);
    expect(component.delegacoes).toEqual([]);
  });
});
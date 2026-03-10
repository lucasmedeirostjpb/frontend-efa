export interface Meta {
  id: string;
  titulo: string;
  descricao: string;
  data_criacao: string | Date;
  status: string;
  eixoId: number;
  setorId: number;
  eixoNome?: string;
  setorNome?: string;
  coordenadorId?: number;
  coordenadorNome?: string;
  coordenadorLoginKeycloak?: string;
  artigo: string;
  anoCiclo: number;
  deadline: string | Date;
  pMaximo: number;
  estimativaReal: number;
  tetoEstimado: number;
  pontosAtingidos: number;
  nivelDificuldade?: string;
  evidenciasAuditoria?: string;
  observacoes?: string;
}

/**
 * Interface genérica para resposta paginada do Spring Boot (Page<T>).
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página atual (0-indexed)
  size: number; // itens por página
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Interface para representar uma propriedade alterada no histórico (JaVers).
 */
export interface PropriedadeAlterada {
  propriedade: string;
  valorAntigo: string | null;
  valorNovo: string | null;
}

/**
 * Interface para representar um item de histórico de alteração (JaVers).
 */
export interface HistoricoAlteracao {
  id: string; // O backend costuma retornar um id gerado pro snapshot/commit
  autor: string;
  dataHora: string | Date;
  tipoMudanca: 'CRIACAO' | 'ATUALIZACAO' | 'EXCLUSAO' | string;
  propriedadesAlteradas: PropriedadeAlterada[];
}

export interface Eixo {
  id: number;
  nome: string;
}

export interface Setor {
  id: number;
  sigla: string;
  nome: string;
}

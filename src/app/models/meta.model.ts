export interface Meta {
  id: number;
  titulo: string;
  descricao: string;
  concluida: boolean;
  data_criacao: string | Date;
}

/**
 * Interface genérica para resposta paginada do Spring Boot (Page<T>).
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;       // página atual (0-indexed)
  size: number;         // itens por página
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
  data: string | Date;
  tipo: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  propriedadesAlteradas: PropriedadeAlterada[];
}

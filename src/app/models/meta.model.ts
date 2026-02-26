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

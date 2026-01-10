import manufacturersData from '../data/manufacturers.json';

export type SearchType = 'code' | 'name';

export interface Manufacturer {
  code: string;
  nameJa: string;
  nameEn?: string;
}

export interface SearchOptions {
  query: string;
  type: SearchType;
}

export function searchManufacturers({ query, type }: SearchOptions): Manufacturer[] {
  const normalizedQuery = query.trim().toLowerCase().replace(/^0x/i, '');

  if (!normalizedQuery) {
    return manufacturersData.manufacturers;
  }

  return manufacturersData.manufacturers.filter((m) => {
    if (type === 'code') {
      return m.code.toLowerCase().includes(normalizedQuery);
    }

    // Name search (Japanese or English)
    return (
      m.nameJa.toLowerCase().includes(normalizedQuery) ||
      m.nameEn?.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function formatCode(code: string): string {
  return `0x${code.toUpperCase()}`;
}

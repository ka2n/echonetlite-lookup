import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { SearchType } from '../lib/search';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchType>('name');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: '/search',
      search: { q: query, type },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="メーカー名またはコードを入力"
        className="search-input"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as SearchType)}
        className="search-type-select"
      >
        <option value="name">企業名</option>
        <option value="code">メーカーコード</option>
      </select>
      <button type="submit" className="search-button">
        検索
      </button>
    </form>
  );
}

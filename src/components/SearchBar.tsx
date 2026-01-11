import { useState, useDeferredValue, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { detectSearchType } from '../lib/search';

export interface SearchBarProps {
  /** Callback for realtime search (triggered on input with debounce) */
  onRealtimeSearch?: (query: string) => void;
  /** Callback for search button submit (triggers URL update) */
  onSubmit?: (query: string) => void;
  /** Initial query value (for restoring from URL params) */
  initialQuery?: string;
  /** Pending state from parent (shows loading indicator) */
  isPending?: boolean;
  /** Mode: 'realtime' enables live search, 'traditional' disables it */
  mode?: 'realtime' | 'traditional';
}

export function SearchBar({
  onRealtimeSearch,
  onSubmit,
  initialQuery = '',
  isPending = false,
  mode = 'realtime',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  // Sync query state with initialQuery when it changes (e.g., browser back/forward)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // React 19: useDeferredValue provides debounce effect (~300ms)
  const deferredQuery = useDeferredValue(query);

  // Trigger realtime search with additional delay (600ms total)
  useEffect(() => {
    if (mode === 'realtime' && onRealtimeSearch) {
      const timer = setTimeout(() => {
        onRealtimeSearch(deferredQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [deferredQuery, onRealtimeSearch, mode]);

  // Handle form submit (search button or Enter key)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit(query);
    }
    // Note: URL update is now handled by onRealtimeSearch after debounce
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="メーカー名、コード、識別番号を入力（複数検索: カンマまたはスペース区切り）"
        className="search-input"
        aria-label="検索クエリ"
      />
      <button type="submit" className="search-button" aria-label="検索を実行">
        検索
      </button>
    </form>
  );
}

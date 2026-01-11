import { formatCode, type Manufacturer } from '../lib/search';

interface ManufacturerListProps {
  manufacturers: Manufacturer[];
}

/**
 * Generate Google search URL for company name
 */
function getGoogleSearchUrl(companyName: string): string {
  const query = encodeURIComponent(companyName);
  return `https://www.google.com/search?q=${query}`;
}

export function ManufacturerList({ manufacturers }: ManufacturerListProps) {
  if (manufacturers.length === 0) {
    return <p className="no-results">該当するメーカーが見つかりませんでした</p>;
  }

  return (
    <div className="manufacturer-list">
      <p className="result-count">{manufacturers.length}件のメーカーが見つかりました</p>
      <table className="manufacturer-table">
        <thead>
          <tr>
            <th>メーカーコード</th>
            <th>企業名</th>
          </tr>
        </thead>
        <tbody>
          {manufacturers.map((m) => (
            <tr key={m.code}>
              <td>
                <span className="code">{formatCode(m.code)}</span>
              </td>
              <td>
                <a
                  href={getGoogleSearchUrl(m.nameJa)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="name"
                  aria-label={`${m.nameJa}をGoogle検索で開く`}
                >
                  {m.nameJa}
                </a>
                {m.nameEn && <span className="name-en"> ({m.nameEn})</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

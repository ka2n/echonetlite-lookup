import { formatCode, type Manufacturer } from '../lib/search';

interface ManufacturerListProps {
  manufacturers: Manufacturer[];
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
              <td className="code">{formatCode(m.code)}</td>
              <td className="name">
                {m.nameJa}
                {m.nameEn && <span className="name-en"> ({m.nameEn})</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

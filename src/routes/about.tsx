import { createRoute } from '@tanstack/react-router';
import { Route as RootRoute } from './__root';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/about',
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="about-page">
      <h2>このサイトについて</h2>
      <p>
        ECHONET Lite Lookupは、ECHONET
        Liteで使用されるメーカーコードを検索できる非公式ツールです。
      </p>
      <h3>ECHONET Liteとは</h3>
      <p>
        ECHONET Lite（エコーネット・ライト）は、日本のスマートホーム機器通信規格です。
        家電や住宅設備機器を相互に接続し、制御するための通信プロトコルを定義しています。
      </p>
      <h3>メーカーコードとは</h3>
      <p>
        メーカーコードは、ECHONET
        Lite機器の製造元を識別するための3バイト（6桁の16進数）のコードです。
        ECHONET Consortiumによって各企業に割り当てられています。
      </p>
      <h3>免責事項</h3>
      <p>
        このサイトは非公式ツールです。正確性を保証するものではありません。
        正式な情報については、
        <a href="https://echonet.jp/" target="_blank" rel="noopener noreferrer">
          ECHONET Consortium公式サイト
        </a>
        をご確認ください。
      </p>
    </div>
  );
}

import React from 'react';

type LinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

// Storybook 用 next/link モック
// next/link の特殊なルーティングを通常の <a> に置き換える
// style/onClick も必ず転送すること: 転送しないとリンクの見た目(フォントサイズ等)が
// ブラウザ標準のスタイルに戻ってしまい、隣接要素とのレイアウトがズレて見える
const NextLink = ({ href, children, className, style, onClick }: LinkProps) => {
  return (
    <a href={href} className={className} style={style} onClick={onClick}>
      {children}
    </a>
  );
};

export default NextLink;

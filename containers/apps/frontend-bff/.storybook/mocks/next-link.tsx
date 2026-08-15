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
const NextLink = ({ href, children, className, style, onClick }: LinkProps) => {
  return (
    <a href={href} className={className} style={style} onClick={onClick}>
      {children}
    </a>
  );
};

export default NextLink;

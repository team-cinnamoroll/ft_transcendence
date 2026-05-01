import React from 'react';

type LinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

// Storybook 用 next/link モック
// next/link の特殊なルーティングを通常の <a> に置き換える
const NextLink = ({ href, children, className }: LinkProps) => {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
};

export default NextLink;

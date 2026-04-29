import React from 'react';

type ImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
};

// Storybook 用 next/image モック
// next/image は最適化処理があるため、通常の <img> に置き換える
const NextImage = ({ src, alt, width, height, className }: ImageProps) => {
  return <img src={src} alt={alt} width={width} height={height} className={className} />;
};

export default NextImage;

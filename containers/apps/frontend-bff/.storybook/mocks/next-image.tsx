import React from 'react';

type ImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  fill?: boolean;
};

// Storybook 用 next/image モック
// next/image は最適化処理があるため、通常の <img> に置き換える
const NextImage = ({ src, alt, width, height, className, style, fill }: ImageProps) => {
  // next/imageの fill プロパティをエミュレートする
  const mergedClassName = [fill ? 'absolute inset-0 w-full h-full' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={mergedClassName}
      style={style}
    />
  );
};

export default NextImage;

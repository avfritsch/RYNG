interface IconProps {
  name: string;
  size?: number;
  className?: string;
  'aria-hidden'?: boolean;
}

export function Icon({ name, size = 24, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      aria-hidden={ariaHidden}
      focusable="false"
    >
      <use href={`/icons-sprite.svg#${name}`} />
    </svg>
  );
}

import { SVGProps } from 'react';

export function AppleIcon(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M12 20.94c1.5 0 2.75-.67 3.95-1.34 1.25-.7 2.3-1.3 3.95-1.3.5 0 .75.03 1.1.1V5.5c-.25-.07-.5-.1-1.1-.1-1.65 0-2.7.6-3.95 1.3-1.2.67-2.45 1.34-3.95 1.34s-2.75-.67-3.95-1.34C6.8 6 5.75 5.4 4.1 5.4c-.6 0-.85.03-1.1.1V18.4c.35-.07.6-.1 1.1-.1 1.65 0 2.7.6 3.95 1.3 1.2.67 2.45 1.34 3.95 1.34z" />
      <path d="M12 12c0-3 2.5-5.5 5.5-5.5" />
    </svg>
  );
}

import type { SVGProps } from 'react';

function IconBase({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4.25" />
      <path d="M12 2.25v2.5" />
      <path d="M12 19.25v2.5" />
      <path d="M4.75 4.75l1.75 1.75" />
      <path d="M17.5 17.5l1.75 1.75" />
      <path d="M2.25 12h2.5" />
      <path d="M19.25 12h2.5" />
      <path d="M4.75 19.25l1.75-1.75" />
      <path d="M17.5 6.25l1.75-1.75" />
    </IconBase>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        d="M20.5 15.75a8.5 8.5 0 0 1-11.25-11.25 0.75 0.75 0 0 0-.95-.95A8.5 8.5 0 1 0 20.5 16.7a0.75 0.75 0 0 0-.95-0.95Z"
        fill="currentColor"
        stroke="none"
      />
    </IconBase>
  );
}

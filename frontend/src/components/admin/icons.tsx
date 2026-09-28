import { ReactNode, SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-[1.125rem] shrink-0"
      {...props}
    >
      {children}
    </svg>
  );
}

export const OverviewIcon = () => (
  <Icon>
    <path d="M3 10.5L12 4l9 6.5" />
    <path d="M5 9.5V20h14V9.5" />
    <path d="M10 20v-5h4v5" />
  </Icon>
);

export const LoansIcon = () => (
  <Icon>
    <path d="M7 4h10v16l-5-3-5 3z" />
    <path d="M10 9h4" />
  </Icon>
);

export const BooksIcon = () => (
  <Icon>
    <path d="M4 20V5a1 1 0 011-1h3a1 1 0 011 1v15" />
    <path d="M9 20V8a1 1 0 011-1h3a1 1 0 011 1v12" />
    <path d="M15.2 8.4l2.9-.8a1 1 0 011.2.7l3 11" />
    <path d="M2 20h20" />
  </Icon>
);

export const AuthorsIcon = () => (
  <Icon>
    <path d="M16.5 3.5l4 4L9 19l-5 1 1-5z" />
    <path d="M14 6l4 4" />
  </Icon>
);

export const MembersIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="11" r="2.25" />
    <path d="M5.75 16c.6-1.6 1.8-2.4 3.25-2.4s2.65.8 3.25 2.4" />
    <path d="M15 10h3M15 13.5h3" />
  </Icon>
);

export const FinesIcon = () => (
  <Icon>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Icon>
);

export const ActivityIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const MenuIcon = () => (
  <Icon>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

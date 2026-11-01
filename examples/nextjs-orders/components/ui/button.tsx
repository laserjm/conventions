import type { ReactNode } from 'react';

export type ButtonProps = { children: ReactNode; disabled?: boolean; onClick?: () => void };

export function Button({ children, disabled, onClick }: ButtonProps) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

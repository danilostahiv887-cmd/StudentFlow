'use client';

export function PrintButton({ children = 'Друк' }: { children?: string }) {
  return (
    <button className="button button-secondary" type="button" onClick={() => window.print()}>
      {children}
    </button>
  );
}

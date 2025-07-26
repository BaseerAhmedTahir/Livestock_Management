// src/components/UI/LoadingSpinner.tsx
import React from 'react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  /** Message shown under the spinner (defaults to “Loading…”) */
  label?: string;
  /** Render as a full-screen overlay */
  fullScreen?: boolean;
  /** Spinner diameter size */
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading…',
  fullScreen = true,
  size = 'md',
}) => {
  /* ------------------------------------------------------------------ */
  /*                        COMPUTED CLASSNAMES                         */
  /* ------------------------------------------------------------------ */
  const dimensions = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-2',
    lg: 'h-20 w-20 border-[3px]',
  }[size];

  const Wrapper = fullScreen ? 'section' : 'div';

  /* ------------------------------------------------------------------ */
  /*                                UI                                  */
  /* ------------------------------------------------------------------ */
  return (
    <Wrapper
      role="status"
      aria-live="polite"
      className={clsx(
        fullScreen && 'min-h-screen',
        'flex flex-col items-center justify-center gap-4 text-center',
        'bg-gray-50 dark:bg-gray-900/50',
      )}
    >
      {/* spinner */}
      <span
        className={clsx(
          'animate-spin rounded-full border-b-emerald-600',
          dimensions,
        )}
      />
      {/* visible label */}
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
      {/* screen-reader only label (ensures accessibility if dev hides the text) */}
      <span className="sr-only">{label}</span>
    </Wrapper>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';
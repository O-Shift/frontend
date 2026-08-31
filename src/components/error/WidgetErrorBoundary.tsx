'use client';

import React, { type ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from './ErrorBoundary';

export interface WidgetErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  message?: string;
  resetKeys?: unknown[];
  onReset?: () => void;
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  className?: string;
}

export function WidgetErrorBoundary({
  children,
  title = 'Widget Unavailable',
  message = 'An error occurred while rendering this widget.',
  resetKeys,
  onReset,
  fallback,
  className,
}: WidgetErrorBoundaryProps) {
  return (
    <div className={className}>
      <ErrorBoundary
        variant="widget"
        fallbackTitle={title}
        fallbackMessage={message}
        resetKeys={resetKeys}
        onReset={onReset ? () => onReset() : undefined}
        fallback={fallback}
      >
        {children}
      </ErrorBoundary>
    </div>
  );
}

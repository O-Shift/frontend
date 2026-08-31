'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { ErrorCard } from './ErrorCard';
import { generateClientErrorRef } from '../../lib/error-reference';

export interface FallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorRef: string;
  resetErrorBoundary: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  fallbackTitle?: string;
  fallbackMessage?: string;
  variant?: 'widget' | 'panel' | 'page';
  resetKeys?: unknown[];
  onReset?: (details: { reason: 'keys' | 'imperative'; prevError: Error }) => void;
  onError?: (error: Error, errorInfo: ErrorInfo, errorRef: string) => void;
  isolate?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorRef: string | null;
  prevResetKeys: unknown[];
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorRef: null,
      prevResetKeys: props.resetKeys || [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(
    nextProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    const { resetKeys } = nextProps;
    const { prevResetKeys, hasError, error } = prevState;

    if (hasError && resetKeys && prevResetKeys) {
      const hasChanged =
        resetKeys.length !== prevResetKeys.length ||
        resetKeys.some((item, idx) => !Object.is(item, prevResetKeys[idx]));

      if (hasChanged) {
        if (nextProps.onReset && error) {
          nextProps.onReset({ reason: 'keys', prevError: error });
        }
        return {
          hasError: false,
          error: null,
          errorInfo: null,
          errorRef: null,
          prevResetKeys: resetKeys,
        };
      }
    }

    if (resetKeys !== prevResetKeys) {
      return { prevResetKeys: resetKeys || [] };
    }

    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const existingRef = (error as { ref?: string }).ref;
    const errorRef = existingRef || generateClientErrorRef();

    this.setState({ errorInfo, errorRef });

    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ErrorBoundary] Caught error [${errorRef}]:`, error, errorInfo);
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorRef);
    }
  }

  resetErrorBoundary = () => {
    if (this.state.error && this.props.onReset) {
      this.props.onReset({ reason: 'imperative', prevError: this.state.error });
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorRef: null,
    });
  };

  render() {
    const { hasError, error, errorInfo, errorRef } = this.state;
    const { children, fallback, fallbackTitle, fallbackMessage, variant = 'panel' } = this.props;

    if (hasError && error) {
      const activeRef = errorRef || (error as { ref?: string }).ref || 'ERR-UNKNOWN';

      if (typeof fallback === 'function') {
        return fallback({
          error,
          errorInfo,
          errorRef: activeRef,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      if (fallback) {
        return fallback;
      }

      return (
        <ErrorCard
          error={error}
          errorRef={activeRef}
          title={fallbackTitle}
          message={fallbackMessage}
          variant={variant}
          onRetry={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

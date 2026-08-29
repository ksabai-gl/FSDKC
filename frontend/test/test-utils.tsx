---
agent: test-generation-reactphp
cli: Cursor Agent CLI
llm: claude-4.5-opus-high
run_id: 20260611T171838_hlqk4c
generated_at: 2026-06-11T11:48:38.662Z
---

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render, createTestQueryClient };

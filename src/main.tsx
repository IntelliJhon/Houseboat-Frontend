import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './styles/globals.css'
import App from './App.tsx'

// 1. Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive query refetching on desktop context shift
      retry: 1, // Retries once upon network failures before throwing error boundary
    },
  },
})

import { LanguageProvider } from './context/LanguageContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
      {/* 2. Global Toast alert container with premium styling */}
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          className: 'premium-toast',
          duration: 4000,
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #1E293B',
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
            letterSpacing: '0.01em',
          },
          success: {
            style: {
              border: '1px solid #10B981',
            },
            iconTheme: {
              primary: '#10B981',
              secondary: '#0F172A',
            },
          },
          error: {
            duration: 5000,
            style: {
              border: '1px solid #EF4444',
            },
            iconTheme: {
              primary: '#EF4444',
              secondary: '#0F172A',
            },
          },
          loading: {
            style: {
              border: '1px solid #3B82F6',
            },
          }
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)

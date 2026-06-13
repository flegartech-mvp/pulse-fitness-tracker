import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// Lazy-loaded routes can take a moment when test files run in parallel.
configure({ asyncUtilTimeout: 5000 })

// jsdom doesn't implement ResizeObserver, which the chart components use.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

// jsdom's scrollTo throws "Not implemented" — the app calls it on route changes.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
}

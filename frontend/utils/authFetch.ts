'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'
import { getApiUrl } from './api'

/**
 * Hook returning a fetch-like function that automatically attaches the
 * Clerk session JWT and prefixes the API base URL.
 */
export function useAuthFetch() {
  const { getToken } = useAuth()

  return useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const token = await getToken()
      const headers = new Headers(init.headers || {})
      if (token) headers.set('Authorization', `Bearer ${token}`)
      if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      const url = path.startsWith('http') ? path : `${getApiUrl()}${path}`
      return fetch(url, { ...init, headers })
    },
    [getToken],
  )
}

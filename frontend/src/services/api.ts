import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { supabase } from '../lib/supabase';

const rawBaseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: async (headers) => {
        try {
            const { data } = await supabase.auth.getSession();
            let session = data?.session;

            // If token is expiring within 2 minutes, try proactive refresh
            if (session?.expires_at) {
                const now = Math.floor(Date.now() / 1000);
                if (session.expires_at - now < 120 && typeof supabase.auth.refreshSession === 'function') {
                    try {
                        const { data: refreshed } = await supabase.auth.refreshSession();
                        if (refreshed?.session) {
                            session = refreshed.session;
                        }
                    } catch {
                        // Keep current session if refresh fails
                    }
                }
            }

            if (session?.access_token) {
                headers.set('authorization', `Bearer ${session.access_token}`);
            }
        } catch (e) {
            console.warn('[StoryEngine] Could not retrieve session for headers:', e);
        }
        return headers;
    },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // Attempt a one-time session refresh
        try {
            if (typeof supabase.auth.refreshSession === 'function') {
                const { data: refreshed, error } = await supabase.auth.refreshSession();
                if (refreshed?.session && !error) {
                    // Retry with refreshed session
                    result = await rawBaseQuery(args, api, extraOptions);
                }
            }
        } catch (e) {
            console.warn('[StoryEngine] Token refresh failed:', e);
        }
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Story', 'Narration', 'Element', 'Moment', 'Connection', 'Mention', 'Suggestion'],
    endpoints: () => ({}),
});


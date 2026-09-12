import { baseApi } from './api';

export interface Story {
    id: string;
    title: string;
    description?: string;
    genre?: string;
    created_at: string;
}

export const storiesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getStories: builder.query<Story[], void>({
            query: () => '/stories',
            providesTags: ['Story'],
        }),
        createStory: builder.mutation<Story, Partial<Story>>({
            query: (body) => ({
                url: '/stories',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Story'],
        }),
        deleteStory: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/stories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Story'],
        }),
        getStoryById: builder.query<Story, string>({
            query: (id) => `/stories/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Story', id }],
        }),
        updateStory: builder.mutation<Story, { id: string; updates: Partial<Story> }>({
            query: ({ id, updates }) => ({
                url: `/stories/${id}`,
                method: 'PATCH',
                body: updates,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Story', id }, 'Story'],
        }),
        brainstormOptions: builder.mutation<{ title: string; description: string }[], string>({
            query: (id) => `/stories/${id}/brainstorm`,
        }),
        getStoryElements: builder.query<any[], string>({
            query: (id) => `/stories/${id}/elements`,
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Element' as const, id })), 'Element']
                    : ['Element'],
        }),
        getStoryTimeline: builder.query<any[], string>({
            query: (id) => `/stories/${id}/timeline`,
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Moment' as const, id })), 'Moment']
                    : ['Moment'],
        }),
        getStoryConnections: builder.query<any[], string>({
            query: (id) => `/stories/${id}/connections`,
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Connection' as const, id })), 'Connection']
                    : ['Connection'],
        }),
        getStoryMentions: builder.query<any[], string>({
            query: (id) => `/stories/${id}/mentions`,
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Mention' as const, id })), 'Mention']
                    : ['Mention'],
        }),
        createElement: builder.mutation<any, { storyId: string; element: any }>({
            query: ({ storyId, element }) => ({
                url: `/stories/${storyId}/elements`,
                method: 'POST',
                body: element,
            }),
            invalidatesTags: ['Element'],
        }),
        updateElement: builder.mutation<any, { storyId: string; elementId: string; updates: any }>({
            query: ({ storyId, elementId, updates }) => ({
                url: `/stories/${storyId}/elements/${elementId}`,
                method: 'PATCH',
                body: updates,
            }),
            invalidatesTags: (_result, _error, { elementId }) => [{ type: 'Element', id: elementId }, 'Element'],
        }),
        deleteElement: builder.mutation<{ success: boolean }, { storyId: string; elementId: string }>({
            query: ({ storyId, elementId }) => ({
                url: `/stories/${storyId}/elements/${elementId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Element', 'Connection'],
        }),
        createConnection: builder.mutation<any, { storyId: string; connection: any }>({
            query: ({ storyId, connection }) => ({
                url: `/stories/${storyId}/connections`,
                method: 'POST',
                body: connection,
            }),
            invalidatesTags: ['Connection'],
        }),
        updateConnection: builder.mutation<any, { storyId: string; connId: string; updates: any }>({
            query: ({ storyId, connId, updates }) => ({
                url: `/stories/${storyId}/connections/${connId}`,
                method: 'PATCH',
                body: updates,
            }),
            invalidatesTags: (_result, _error, { connId }) => [{ type: 'Connection', id: connId }, 'Connection'],
        }),
        deleteConnection: builder.mutation<{ success: boolean }, { storyId: string; connId: string }>({
            query: ({ storyId, connId }) => ({
                url: `/stories/${storyId}/connections/${connId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Connection'],
        }),
        updateMoment: builder.mutation<any, { storyId: string; momentId: string; updates: any }>({
            query: ({ storyId, momentId, updates }) => ({
                url: `/stories/${storyId}/timeline/${momentId}`,
                method: 'PATCH',
                body: updates,
            }),
            invalidatesTags: (_result, _error, { momentId }) => [{ type: 'Moment', id: momentId }, 'Moment'],
        }),
        deleteMoment: builder.mutation<{ success: boolean }, { storyId: string; momentId: string }>({
            query: ({ storyId, momentId }) => ({
                url: `/stories/${storyId}/timeline/${momentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Moment'],
        }),
        interviewCharacter: builder.mutation<string, { storyId: string; characterId: string; prompt: string }>({
            query: ({ storyId, characterId, prompt }) => ({
                url: `/stories/${storyId}/interview/${characterId}`,
                method: 'POST',
                body: { prompt },
            }),
            transformResponse: (res: any) => {
                if (typeof res === 'string') return res;
                return res?.response || res?.message || '';
            },
        }),
        refreshCharacterDescription: builder.mutation<any, { storyId: string; characterId: string }>({
            query: ({ storyId, characterId }) => ({
                url: `/stories/${storyId}/characters/${characterId}/refresh-description`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, { characterId }) => [{ type: 'Element', id: characterId }, 'Element'],
        }),
        mergeElement: builder.mutation<void, { storyId: string; elementId: string; targetId: string }>({
            query: ({ storyId, elementId, targetId }) => ({
                url: `/stories/${storyId}/elements/${elementId}/merge`,
                method: 'POST',
                body: { targetId },
            }),
            invalidatesTags: ['Element', 'Mention', 'Moment', 'Connection'],
        }),
        generateElementVisual: builder.mutation<any, { storyId: string; elementId: string }>({
            query: ({ storyId, elementId }) => ({
                url: `/stories/${storyId}/elements/${elementId}/visual`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, { elementId }) => [{ type: 'Element', id: elementId }, 'Element'],
        }),
    }),
});

export const {
    useGetStoriesQuery,
    useCreateStoryMutation,
    useDeleteStoryMutation,
    useGetStoryByIdQuery,
    useUpdateStoryMutation,
    useBrainstormOptionsMutation,
    useGetStoryElementsQuery,
    useCreateElementMutation,
    useUpdateElementMutation,
    useDeleteElementMutation,
    useGenerateElementVisualMutation,
    useGetStoryTimelineQuery,
    useUpdateMomentMutation,
    useDeleteMomentMutation,
    useGetStoryConnectionsQuery,
    useCreateConnectionMutation,
    useUpdateConnectionMutation,
    useDeleteConnectionMutation,
    useGetStoryMentionsQuery,
    useInterviewCharacterMutation,
    useRefreshCharacterDescriptionMutation,
    useMergeElementMutation,
} = storiesApi;

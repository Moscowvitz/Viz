import React, { useState, useMemo } from 'react';
import { useGetStoriesQuery, useCreateStoryMutation, useDeleteStoryMutation, type Story } from '../../services/stories';
import { useNavigate } from 'react-router-dom';
import { Plus, Book, Clock, ChevronRight, Search, Trash2, X, AlertTriangle, User } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { data: stories, isLoading } = useGetStoriesQuery();
    const [createStory, { isLoading: isCreating }] = useCreateStoryMutation();
    const [deleteStory, { isLoading: isDeleting }] = useDeleteStoryMutation();
    const [createError, setCreateError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
    const navigate = useNavigate();

    const handleCreateStory = async () => {
        try {
            setCreateError(null);
            const newStory = await createStory({ title: 'A New Narrative' }).unwrap();
            navigate(`/story/${newStory.id}`);
        } catch (err: any) {
            console.error('Failed to create story:', err);
            setCreateError(err?.data?.message || 'Failed to create story. Please try again.');
        }
    };

    const confirmDeleteStory = async () => {
        if (!storyToDelete) return;
        try {
            await deleteStory(storyToDelete.id).unwrap();
            setStoryToDelete(null);
        } catch (err: any) {
            console.error('Failed to delete story:', err);
            setCreateError(err?.data?.message || 'Failed to delete story.');
        }
    };

    const filteredStories = useMemo(() => {
        if (!stories) return [];
        if (!searchQuery.trim()) return stories;
        const q = searchQuery.toLowerCase().trim();
        return stories.filter(
            (story) =>
                story.title?.toLowerCase().includes(q) ||
                story.description?.toLowerCase().includes(q) ||
                story.genre?.toLowerCase().includes(q)
        );
    }, [stories, searchQuery]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Book className="text-white w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">Story Engine</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            id="profile-nav-button"
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-all group"
                        >
                            <div className="w-7 h-7 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Profile</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Narratives</h1>
                        <p className="text-slate-500 mt-1 text-sm sm:text-base">Capture, understand, and evolve your worlds.</p>
                    </div>
                    <button
                        id="new-story-button"
                        onClick={handleCreateStory}
                        disabled={isCreating}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5" />
                        {isCreating ? 'Creating...' : 'New Story'}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            id="story-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search stories by title, description, or genre..."
                            className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        {searchQuery && (
                            <button
                                id="clear-search-button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                                title="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <div className="text-xs text-slate-500 flex items-center px-2">
                            Found {filteredStories.length} {filteredStories.length === 1 ? 'match' : 'matches'}
                        </div>
                    )}
                </div>

                {createError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center justify-between">
                        <span>{createError}</span>
                        <button
                            onClick={() => setCreateError(null)}
                            className="text-red-400 hover:text-red-600 font-bold ml-4"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                        ))}
                    </div>
                ) : stories?.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Book className="text-slate-400 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800">No stories yet</h3>
                        <p className="text-slate-500 mt-2 mb-6">Start your first narration and see it come alive.</p>
                        <button
                            id="begin-journey-button"
                            onClick={handleCreateStory}
                            className="text-indigo-600 font-semibold hover:underline"
                        >
                            Begin a journey
                        </button>
                    </div>
                ) : filteredStories.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                        <p className="text-slate-600 font-medium">No stories matched "{searchQuery}"</p>
                        <button
                            id="reset-search-button"
                            onClick={() => setSearchQuery('')}
                            className="mt-3 text-sm text-indigo-600 font-semibold hover:underline"
                        >
                            Clear search filter
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredStories.map((story) => (
                            <div
                                key={story.id}
                                id={`story-card-${story.id}`}
                                onClick={() => navigate(`/story/${story.id}`)}
                                className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                        <Book className="text-indigo-600 w-5 h-5 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            {new Date(story.created_at).toLocaleDateString()}
                                        </div>
                                        <button
                                            id={`delete-story-${story.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setStoryToDelete(story);
                                            }}
                                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete Story"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {story.title}
                                </h3>
                                <p className="text-slate-500 mt-2 text-sm line-clamp-2">
                                    {story.description || 'No description yet. Start narrating to build your world.'}
                                </p>
                                <div className="mt-6 flex items-center justify-between text-sm font-semibold text-indigo-600">
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                        Open Engine <ChevronRight className="w-4 h-4 ml-1" />
                                    </span>
                                    {story.genre && (
                                        <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                                            {story.genre}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {storyToDelete && (
                <div
                    id="delete-story-modal-backdrop"
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => !isDeleting && setStoryToDelete(null)}
                >
                    <div
                        id="delete-story-modal"
                        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Delete Narrative?</h3>
                        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                            Are you sure you want to permanently delete <strong className="text-slate-900">"{storyToDelete.title}"</strong>?
                            All associated narrations, characters, timeline moments, and world connections will be removed.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                id="cancel-delete-story"
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setStoryToDelete(null)}
                                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                id="confirm-delete-story"
                                type="button"
                                disabled={isDeleting}
                                onClick={confirmDeleteStory}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? 'Deleting...' : 'Delete Narrative'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

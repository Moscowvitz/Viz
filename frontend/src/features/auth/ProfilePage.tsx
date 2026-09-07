import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, Shield, Mail, Calendar, Sparkles, BookOpen,
    ArrowLeft, Award, CheckCircle2, Edit3, Save, X
} from 'lucide-react';
import { useGetStoriesQuery } from '../../services/stories';

export const ProfilePage: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [profileData, setProfileData] = useState<any>({
        xp: 350,
        level: 3,
        display_name: 'Story Creator',
        bio: 'Crafting worlds through natural narration and emergent lore.',
    });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const { data: stories } = useGetStoriesQuery();
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const loadUserProfile = async () => {
            try {
                // 1. Fetch user from auth
                let currentUser: any = null;
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user) {
                    currentUser = userData.user;
                } else {
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (sessionData?.session?.user) {
                        currentUser = sessionData.session.user;
                    }
                }

                // Fallback default user if null
                if (!currentUser) {
                    currentUser = {
                        id: 'demo-user-123',
                        email: 'creator@storyengine.ai',
                        user_metadata: { display_name: 'Story Creator' },
                        created_at: new Date().toISOString(),
                    };
                }

                if (isMounted) {
                    setUser(currentUser);
                    const name =
                        currentUser.user_metadata?.display_name ||
                        currentUser.user_metadata?.full_name ||
                        currentUser.email?.split('@')[0] ||
                        'Story Creator';
                    setEditName(name);
                    setEditBio(
                        currentUser.user_metadata?.bio ||
                        'Crafting worlds through natural narration and emergent lore.'
                    );
                }

                // 2. Fetch profile stats (xp, level)
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();

                    if (profile && isMounted) {
                        setProfileData((prev: any) => ({
                            ...prev,
                            ...profile,
                            display_name: profile.display_name || prev.display_name,
                        }));
                    }
                } catch (e) {
                    // Profile table optional in mock
                }
            } catch (err) {
                console.error('Error loading profile:', err);
                if (isMounted) {
                    setUser({
                        id: 'demo-user-123',
                        email: 'creator@storyengine.ai',
                        created_at: new Date().toISOString(),
                    });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadUserProfile();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updatedMetadata = {
                ...user?.user_metadata,
                display_name: editName.trim() || 'Story Creator',
                bio: editBio.trim(),
            };

            // Update user state locally
            setUser((prev: any) => ({
                ...prev,
                user_metadata: updatedMetadata,
            }));

            setProfileData((prev: any) => ({
                ...prev,
                display_name: editName.trim() || 'Story Creator',
                bio: editBio.trim(),
            }));

            // Sync with local session if available
            try {
                const stored = localStorage.getItem('storyengine_mock_session');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed?.user) {
                        parsed.user.user_metadata = updatedMetadata;
                        localStorage.setItem('storyengine_mock_session', JSON.stringify(parsed));
                    }
                }
            } catch (e) {}

            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save profile updates:', err);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {}
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-9 w-9 border-2 border-indigo-600 border-t-transparent"></div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        Loading Storyteller Profile...
                    </p>
                </div>
            </div>
        );
    }

    const email = user?.email || 'creator@storyengine.ai';
    const displayName =
        profileData.display_name ||
        user?.user_metadata?.display_name ||
        user?.user_metadata?.full_name ||
        email.split('@')[0];

    const joinDate = user?.created_at
        ? (() => {
            try {
                const d = new Date(user.created_at);
                return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
            } catch {
                return 'Recently';
            }
        })()
        : 'Recently';

    const storiesCount = stories?.length ?? 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-10 shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-100">
                        S
                    </div>
                    <span className="font-bold text-slate-800 tracking-tight text-lg">Story Engine</span>
                </div>
                <button
                    id="back-to-dashboard-btn"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Dashboard</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center py-10 sm:py-16 px-4">
                <div className="w-full max-w-2xl bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    {/* Cover Section */}
                    <div className="h-36 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 relative flex items-end px-8 pb-4">
                        <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-3xl p-1.5 shadow-xl border border-slate-100">
                            <div className="w-full h-full bg-slate-100 rounded-[1.25rem] flex items-center justify-center text-indigo-600 font-bold text-2xl">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-10 px-8 sm:px-12 space-y-8">
                        {/* Profile Header & Edit Mode */}
                        {isEditing ? (
                            <form onSubmit={handleSaveProfile} className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Edit Author Profile</h4>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Author Bio</label>
                                    <textarea
                                        rows={2}
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                                            {displayName}
                                        </h1>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Edit Profile"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-widest">
                                        Level {profileData.level} Master Storyteller
                                    </p>
                                    <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                                        {profileData.bio || 'Crafting worlds through natural narration and emergent lore.'}
                                    </p>
                                </div>

                                {saveSuccess && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200 text-xs font-semibold animate-in fade-in">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Saved!</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Author Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
                                    <Award className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Level</span>
                                </div>
                                <span className="text-xl font-bold text-slate-800">{profileData.level}</span>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">XP</span>
                                </div>
                                <span className="text-xl font-bold text-slate-800">{profileData.xp}</span>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Worlds</span>
                                </div>
                                <span className="text-xl font-bold text-slate-800">{storiesCount}</span>
                            </div>
                        </div>

                        {/* Details Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Mail className="w-4 h-4 text-indigo-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Email Address</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700 truncate">{email}</p>
                            </div>

                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Member Since</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700">{joinDate}</p>
                            </div>
                        </div>

                        {/* Footer & Actions */}
                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
                                <Shield className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Verified Account</span>
                            </div>

                            <button
                                id="logout-button"
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout Session
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-2 text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Story Engine // Narrative Co-Creation Suite</span>
                </div>
            </main>
        </div>
    );
};

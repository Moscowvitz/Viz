import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    useGetStoryElementsQuery,
    useGetStoryMentionsQuery,
    useGetStoryConnectionsQuery,
    useCreateElementMutation,
    useUpdateElementMutation,
    useDeleteElementMutation,
    useCreateConnectionMutation,
    useDeleteConnectionMutation,
    useGenerateElementVisualMutation,
    useInterviewCharacterMutation,
    useMergeElementMutation
} from '../../services/stories';
import { useRevertElementMutation } from '../../services/suggestions';
import {
    User, MapPin, Shield, MessageSquare, Clock, Sparkles,
    TrendingUp, TrendingDown, Edit3, Trash2, Check, X,
    RotateCcw, ArrowLeft, Search, Activity, Send, Download, Merge,
    Plus, Image, Link, AlertTriangle, RefreshCw
} from 'lucide-react';

const SentimentArc: React.FC<{ data: number[] }> = ({ data }) => {
    if (data.length < 2) return null;

    const width = 300;
    const height = 60;
    const padding = 10;

    const points = data.map((val, i) => ({
        x: padding + (i * (width - 2 * padding) / (data.length - 1)),
        y: height / 2 - (val * (height / 2 - padding) / 10)
    }));

    const pathData = `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                <div className="flex items-center gap-1.5 text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    Ascent
                </div>
                <div className="text-slate-300">Emotional Life Arc</div>
                <div className="flex items-center gap-1.5 text-rose-500">
                    <TrendingDown className="w-3 h-3" />
                    Descent
                </div>
            </div>
            <div className="relative h-[60px] bg-slate-50/50 rounded-2xl border border-slate-100/30 overflow-hidden">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-200/50 border-dashed" />
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="drop-shadow-sm">
                    <defs>
                        <linearGradient id="arcGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#6366f1" stopOpacity="0" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.4" />
                        </linearGradient>
                    </defs>
                    <path d={pathData} fill="none" stroke="url(#arcGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" className={`${data[i] > 0 ? 'fill-emerald-500' : data[i] < 0 ? 'fill-rose-500' : 'fill-slate-400'}`} />
                    ))}
                </svg>
            </div>
        </div>
    );
};

const CharacterInterviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    character: any;
    storyId: string;
}> = ({ isOpen, onClose, character, storyId }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [interview, { isLoading }] = useInterviewCharacterMutation();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([{ role: 'ai', content: `*${character.name} looks at you, waiting.*` }]);
        }
    }, [isOpen, character]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!isOpen) return null;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

        try {
            const raw = await interview({ storyId, characterId: character.id, prompt: userMsg }).unwrap();
            const text = typeof raw === 'string' ? raw : (raw as any)?.response || (raw as any)?.message || '*Silently nods.*';
            setMessages(prev => [...prev, { role: 'ai', content: text }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'ai', content: '*Seems unable to speak right now.*' }]);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-4xl h-[85vh] max-h-[700px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                {/* Character Sidebar inside Modal */}
                <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-6 sm:p-8 flex flex-col items-center text-center shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-inner overflow-hidden">
                        {character.attributes?.visual_url ? (
                            <img src={character.attributes.visual_url} alt={character.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{character.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Living Simulation</p>
                    <div className="mt-6 sm:mt-8 text-left w-full space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Traits</label>
                            <div className="flex flex-wrap gap-2">
                                {character.attributes?.traits?.map((t: string) => (
                                    <span key={t} className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] text-slate-600 font-bold uppercase">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto pt-4">
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                            <X className="w-4 h-4" /> End Session
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] sm:max-w-[80%] p-4 sm:p-6 rounded-3xl text-sm leading-relaxed font-serif ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-br-none' : 'bg-indigo-600 text-white rounded-bl-none shadow-lg shadow-indigo-100'}`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-3xl rounded-bl-none text-xs font-bold uppercase tracking-widest animate-pulse">
                                    Thinking...
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 sm:p-6 border-t border-slate-50">
                        <form onSubmit={handleSend} className="relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Ask ${character.name} something...`}
                                className="w-full pl-6 pr-16 py-3.5 sm:py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MergeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    currentEntity: any;
    allEntities: any[];
    storyId: string;
    onSuccess: () => void;
}> = ({ isOpen, onClose, currentEntity, allEntities, storyId, onSuccess }) => {
    const [merge, { isLoading }] = useMergeElementMutation();
    const [targetId, setTargetId] = useState<string | null>(null);

    const candidates = useMemo(() => {
        return allEntities.filter(e =>
            e.id !== currentEntity.id &&
            e.element_type === currentEntity.element_type
        );
    }, [allEntities, currentEntity]);

    const handleConfirm = async () => {
        if (!targetId || isLoading) return;
        try {
            await merge({ storyId, elementId: currentEntity.id, targetId }).unwrap();
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Merge className="w-5 h-5 text-indigo-500" />
                        Merge Entity
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                </div>

                <p className="text-sm text-slate-500 mb-6">
                    Select a target to merge <strong>{currentEntity.name}</strong> into.
                    All mentions, moments, and connections will be transferred.
                    <strong> {currentEntity.name}</strong> will be archived.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-6">
                    {candidates.map(candidate => (
                        <button
                            key={candidate.id}
                            onClick={() => setTargetId(candidate.id)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${targetId === candidate.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                        >
                            <span className="font-bold text-slate-700">{candidate.name}</span>
                            {targetId === candidate.id && <Check className="w-4 h-4 text-indigo-600" />}
                        </button>
                    ))}
                    {candidates.length === 0 && (
                        <div className="text-center text-slate-400 italic p-4">No compatible entities found.</div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-600">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={!targetId || isLoading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105"
                    >
                        {isLoading ? 'Merging...' : 'Confirm Merge'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal for creating a new entity manually
const CreateEntityModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    storyId: string;
    onCreated: (newElement: any) => void;
}> = ({ isOpen, onClose, storyId, onCreated }) => {
    const [createElement, { isLoading }] = useCreateElementMutation();
    const [name, setName] = useState('');
    const [elementType, setElementType] = useState('character');
    const [description, setDescription] = useState('');
    const [traits, setTraits] = useState<string[]>([]);
    const [traitInput, setTraitInput] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(true);
    const [visualUrl, setVisualUrl] = useState('');

    if (!isOpen) return null;

    const handleAddTrait = () => {
        if (traitInput.trim() && !traits.includes(traitInput.trim())) {
            setTraits([...traits, traitInput.trim()]);
            setTraitInput('');
        }
    };

    const handleRemoveTrait = (t: string) => {
        setTraits(traits.filter(item => item !== t));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isLoading) return;

        try {
            const created = await createElement({
                storyId,
                element: {
                    name: name.trim(),
                    element_type: elementType,
                    attributes: {
                        description: description.trim(),
                        traits,
                        ...(visualUrl.trim() ? { visual_url: visualUrl.trim() } : {}),
                    },
                    status: isConfirmed ? 'confirmed' : 'draft',
                    user_confirmed: isConfirmed,
                    confidence_score: 1.0,
                }
            }).unwrap();

            onCreated(created);
            onClose();
        } catch (err) {
            console.error('Failed to create entity:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">New World Fact</h3>
                            <p className="text-xs text-slate-400">Add an entity manually to the World Bible</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Entity Name *
                        </label>
                        <input
                            id="create-entity-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Master Elric, Citadel of Whispers, The Black Order..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Classification
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'character', label: 'Character', icon: <User className="w-4 h-4" /> },
                                { id: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
                                { id: 'organization', label: 'Organization', icon: <Shield className="w-4 h-4" /> },
                                { id: 'concept', label: 'Concept', icon: <Sparkles className="w-4 h-4" /> },
                                { id: 'event', label: 'Event', icon: <Clock className="w-4 h-4" /> },
                                { id: 'artifact', label: 'Artifact', icon: <Activity className="w-4 h-4" /> },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setElementType(item.id)}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${elementType === item.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Description / Lore
                        </label>
                        <textarea
                            id="create-entity-desc"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe their place, history, or importance in the narrative..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Essence Traits & Tags
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={traitInput}
                                onChange={(e) => setTraitInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTrait();
                                    }
                                }}
                                placeholder="Type trait and press Add (e.g. Arcane, Cynical)..."
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddTrait}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        {traits.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {traits.map(t => (
                                    <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg flex items-center gap-1.5">
                                        {t}
                                        <button type="button" onClick={() => handleRemoveTrait(t)} className="hover:text-rose-600">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Visual Portrait URL (Optional)
                        </label>
                        <input
                            type="url"
                            value={visualUrl}
                            onChange={(e) => setVisualUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isConfirmed}
                                onChange={(e) => setIsConfirmed(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-semibold text-slate-700">Mark as Confirmed Canon (not Draft)</span>
                        </label>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!name.trim() || isLoading}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md shadow-indigo-100 disabled:opacity-50 transition-all"
                            >
                                {isLoading ? 'Adding...' : 'Create Entity'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modal for adding a relationship directly to the current entity
const AddConnectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    storyId: string;
    currentEntity: any;
    allEntities: any[];
}> = ({ isOpen, onClose, storyId, currentEntity, allEntities }) => {
    const [createConnection, { isLoading }] = useCreateConnectionMutation();
    const [targetId, setTargetId] = useState('');
    const [connectionType, setConnectionType] = useState('ally');
    const [description, setDescription] = useState('');
    const [weight, setWeight] = useState(6);

    const availableTargets = useMemo(() => {
        return allEntities.filter(e => e.id !== currentEntity.id);
    }, [allEntities, currentEntity]);

    useEffect(() => {
        if (availableTargets.length > 0 && !targetId) {
            setTargetId(availableTargets[0].id);
        }
    }, [availableTargets, targetId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetId || isLoading) return;

        try {
            await createConnection({
                storyId,
                connection: {
                    from_id: currentEntity.id,
                    to_id: targetId,
                    connection_type: connectionType,
                    description: description.trim(),
                    weight,
                }
            }).unwrap();
            onClose();
        } catch (err) {
            console.error('Failed to create relationship:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            <Link className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Add Relationship</h3>
                            <p className="text-xs text-slate-400">Connect {currentEntity.name} to another entity</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Connect To
                        </label>
                        <select
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {availableTargets.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.element_type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Relationship Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['ally', 'rival', 'mentor', 'family', 'conflicted_past', 'subordinate'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setConnectionType(type)}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all ${connectionType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                >
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Bond Strength ({weight}/10)
                            </label>
                            <span className="text-xs font-semibold text-indigo-600">
                                {weight >= 8 ? 'Crucial Arc' : weight >= 5 ? 'Active Dynamic' : 'Subtle Thread'}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={weight}
                            onChange={(e) => setWeight(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Context & Backstory (Optional)
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Sworn comrades in the siege of Eldermoor..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!targetId || isLoading}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md shadow-indigo-100 disabled:opacity-50 transition-all"
                        >
                            {isLoading ? 'Connecting...' : 'Save Relationship'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const EntityDossier: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: elements } = useGetStoryElementsQuery(id!);
    const { data: mentions } = useGetStoryMentionsQuery(id!);
    const { data: allConnections } = useGetStoryConnectionsQuery(id!);
    const [updateElement] = useUpdateElementMutation();
    const [deleteElement] = useDeleteElementMutation();
    const [revertElement] = useRevertElementMutation();
    const [deleteConnection] = useDeleteConnectionMutation();
    const [generateVisual, { isLoading: isGeneratingVisual }] = useGenerateElementVisualMutation();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isInterviewOpen, setIsInterviewOpen] = useState(false);
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customVisualUrl, setCustomVisualUrl] = useState('');
    const [isEditingVisualUrl, setIsEditingVisualUrl] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string | null>(null);

    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState('character');
    const [editDesc, setEditDesc] = useState('');
    const [editTraits, setEditTraits] = useState<string[]>([]);
    const [newTrait, setNewTrait] = useState('');

    const filteredElements = useMemo(() => {
        if (!elements) return [];
        return elements.filter(e => {
            const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterType ? e.element_type === filterType : true;
            return matchesSearch && matchesFilter;
        });
    }, [elements, searchTerm, filterType]);

    const selectedEntity = useMemo(() => {
        return elements?.find(e => e.id === selectedId);
    }, [elements, selectedId]);

    const entityMentions = useMemo(() => {
        return mentions?.filter(m => m.element_id === selectedId) || [];
    }, [mentions, selectedId]);

    const sentimentData = useMemo(() => {
        return entityMentions.map(m => m.emotional_state?.sentiment_score ?? 0);
    }, [entityMentions]);

    // Direct connections for selected entity
    const entityConnections = useMemo(() => {
        if (!allConnections || !selectedId || !elements) return [];
        const elMap = elements.reduce((acc, el) => {
            acc[el.id] = el;
            return acc;
        }, {} as Record<string, any>);

        return allConnections
            .filter(c => c.from_id === selectedId || c.to_id === selectedId)
            .map(c => ({
                ...c,
                otherEntity: c.from_id === selectedId ? elMap[c.to_id] : elMap[c.from_id],
                direction: c.from_id === selectedId ? 'outgoing' : 'incoming',
            }))
            .filter(c => c.otherEntity);
    }, [allConnections, selectedId, elements]);

    useEffect(() => {
        if (selectedEntity) {
            setEditName(selectedEntity.name);
            setEditType(selectedEntity.element_type || 'character');
            setEditDesc(selectedEntity.attributes?.description || '');
            setEditTraits(selectedEntity.attributes?.traits || []);
            setCustomVisualUrl(selectedEntity.attributes?.visual_url || '');
            setIsEditingVisualUrl(false);
        }
    }, [selectedEntity]);

    const handleSave = async () => {
        if (!selectedId || !selectedEntity) return;
        try {
            await updateElement({
                storyId: id!,
                elementId: selectedId,
                updates: {
                    name: editName,
                    element_type: editType,
                    attributes: {
                        ...selectedEntity.attributes,
                        description: editDesc,
                        traits: editTraits,
                        ...(customVisualUrl.trim() ? { visual_url: customVisualUrl.trim() } : {}),
                    }
                }
            }).unwrap();
            setIsEditMode(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedId || !selectedEntity) return;
        const newConfirmed = !selectedEntity.user_confirmed;
        try {
            await updateElement({
                storyId: id!,
                elementId: selectedId,
                updates: {
                    user_confirmed: newConfirmed,
                    status: newConfirmed ? 'confirmed' : 'draft',
                }
            }).unwrap();
        } catch (err) {
            console.error('Failed to toggle entity status:', err);
        }
    };

    const handleGenerateVisual = async () => {
        if (!selectedId || isGeneratingVisual) return;
        try {
            await generateVisual({ storyId: id!, elementId: selectedId }).unwrap();
        } catch (err) {
            console.error('Failed to generate visual:', err);
        }
    };

    const confirmDelete = async () => {
        if (!selectedId) return;
        try {
            await deleteElement({ storyId: id!, elementId: selectedId });
            setIsDeleteModalOpen(false);
            setSelectedId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRevert = async () => {
        if (!selectedId) return;
        try {
            await revertElement(selectedId).unwrap();
            setSelectedId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const renderIcon = (type: string, size = "w-4 h-4") => {
        switch (type) {
            case 'character': return <User className={size} />;
            case 'location': return <MapPin className={size} />;
            case 'organization': return <Shield className={size} />;
            case 'concept': return <Sparkles className={size} />;
            case 'event': return <Clock className={size} />;
            default: return <Activity className={size} />;
        }
    };

    const handleExport = () => {
        if (!elements) return;
        let md = `# World Bible Export\n\n`;

        // Characters
        md += `## Characters\n\n`;
        elements.filter(e => e.element_type === 'character').forEach(c => {
            md += `### ${c.name}\n`;
            md += `> ${c.attributes?.description || 'No description.'}\n\n`;
            if (c.attributes?.traits?.length) {
                md += `**Traits**: ${c.attributes.traits.join(', ')}\n\n`;
            }
        });

        // Locations
        md += `## Locations\n\n`;
        elements.filter(e => e.element_type === 'location').forEach(l => {
            md += `### ${l.name}\n`;
            md += `> ${l.attributes?.description || 'No description.'}\n\n`;
        });

        // Organizations
        md += `## Organizations\n\n`;
        elements.filter(e => e.element_type === 'organization').forEach(o => {
            md += `### ${o.name}\n`;
            md += `> ${o.attributes?.description || 'No description.'}\n\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'world_bible.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (selectedId && selectedEntity) {
        return (
            <div className="flex-1 flex flex-col h-full bg-white overflow-hidden animate-in fade-in duration-500">
                <header className="h-20 px-4 sm:px-10 flex items-center justify-between border-b border-slate-50 shrink-0">
                    <button
                        onClick={() => setSelectedId(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back to World Bible</span>
                        <span className="sm:hidden">Back</span>
                    </button>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Status Toggle Button */}
                        <button
                            id="toggle-entity-status-btn"
                            onClick={handleToggleStatus}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${selectedEntity.user_confirmed ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                            title="Click to toggle between Confirmed Canon and Draft"
                        >
                            {selectedEntity.user_confirmed ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Confirmed Canon</span>
                                </>
                            ) : (
                                <>
                                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                                    <span>Pending Draft</span>
                                </>
                            )}
                        </button>

                        {isEditMode ? (
                            <div className="flex gap-2">
                                <button
                                    id="save-entity-btn"
                                    onClick={handleSave}
                                    className="p-2.5 sm:p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-colors"
                                    title="Save changes"
                                >
                                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button
                                    onClick={() => setIsEditMode(false)}
                                    className="p-2.5 sm:p-3 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors"
                                    title="Cancel edit"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-1.5 sm:gap-2">
                                {selectedEntity.element_type === 'character' && (
                                    <button
                                        onClick={() => setIsInterviewOpen(true)}
                                        className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all"
                                        title="Live Character Interview"
                                    >
                                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsMergeModalOpen(true)}
                                    className="p-2.5 sm:p-3 bg-violet-50 text-violet-500 hover:bg-violet-100 rounded-2xl transition-all"
                                    title="Merge with another entity"
                                >
                                    <Merge className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button
                                    id="edit-entity-btn"
                                    onClick={() => setIsEditMode(true)}
                                    className="p-2.5 sm:p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"
                                    title="Edit entity"
                                >
                                    <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button
                                    onClick={handleRevert}
                                    className="p-2.5 sm:p-3 bg-amber-50 text-amber-500 hover:bg-amber-100 rounded-2xl transition-all"
                                    title="Revert to Draft"
                                >
                                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button
                                    id="delete-entity-btn"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="p-2.5 sm:p-3 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-2xl transition-all"
                                    title="Delete entity"
                                >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <CharacterInterviewModal
                    isOpen={isInterviewOpen}
                    onClose={() => setIsInterviewOpen(false)}
                    character={selectedEntity}
                    storyId={id!}
                />

                <MergeModal
                    isOpen={isMergeModalOpen}
                    onClose={() => setIsMergeModalOpen(false)}
                    currentEntity={selectedEntity}
                    allEntities={elements || []}
                    storyId={id!}
                    onSuccess={() => setSelectedId(null)}
                />

                <AddConnectionModal
                    isOpen={isAddConnectionOpen}
                    onClose={() => setIsAddConnectionOpen(false)}
                    storyId={id!}
                    currentEntity={selectedEntity}
                    allEntities={elements || []}
                />

                {/* Delete Entity Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Delete Entity?</h3>
                            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                                Are you sure you want to permanently delete <strong className="text-slate-900">"{selectedEntity.name}"</strong>?
                                All entity mentions and linked relationship connections will also be removed.
                            </p>
                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all"
                                >
                                    Delete Entity
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-8 sm:py-12 scrollbar-hide">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Header & Avatar Card */}
                        <section className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
                            <div className="relative group/avatar">
                                <div className={`shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-[2.5rem] flex items-center justify-center overflow-hidden relative ${selectedEntity.element_type === 'character' ? 'bg-indigo-50 text-indigo-600 shadow-xl shadow-indigo-100/50' : 'bg-emerald-50 text-emerald-600 shadow-xl shadow-emerald-100/50'}`}>
                                    {selectedEntity.attributes?.visual_url ? (
                                        <img src={selectedEntity.attributes.visual_url} alt={selectedEntity.name} className="w-full h-full object-cover" />
                                    ) : (
                                        renderIcon(selectedEntity.element_type, "w-12 h-12")
                                    )}

                                    {isGeneratingVisual && (
                                        <div className="absolute inset-0 bg-indigo-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 text-center">
                                            <RefreshCw className="w-6 h-6 animate-spin mb-1" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">Generating Art...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Cinematic Visual Action Overlay / Button */}
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        id="generate-visual-btn"
                                        onClick={handleGenerateVisual}
                                        disabled={isGeneratingVisual}
                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                                        title="Generate AI Portrait or Concept Artwork"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                        {isGeneratingVisual ? 'Creating...' : selectedEntity.attributes?.visual_url ? 'Regenerate Art' : 'Generate Visual'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingVisualUrl(!isEditingVisualUrl)}
                                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                                        title="Paste custom image URL"
                                    >
                                        <Image className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {isEditingVisualUrl && (
                                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 max-w-xs">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Custom Image URL</label>
                                        <input
                                            type="url"
                                            value={customVisualUrl}
                                            onChange={(e) => setCustomVisualUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setIsEditingVisualUrl(false)}
                                                className="px-2 py-1 text-[10px] text-slate-400 font-bold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await updateElement({
                                                        storyId: id!,
                                                        elementId: selectedId,
                                                        updates: {
                                                            visual_url: customVisualUrl.trim() || null,
                                                            attributes: {
                                                                ...selectedEntity.attributes,
                                                                visual_url: customVisualUrl.trim() || null,
                                                            }
                                                        }
                                                    });
                                                    setIsEditingVisualUrl(false);
                                                }}
                                                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                {isEditMode ? (
                                    <div className="space-y-3">
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Entity Name"
                                            className="text-2xl sm:text-4xl font-bold text-slate-800 tracking-tight bg-slate-50 px-4 py-2 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-100 focus:bg-white transition-all w-full"
                                        />
                                        {/* Reclassification Type Selector */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                Reclassify Entity Type
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {['character', 'location', 'organization', 'concept', 'event', 'artifact'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setEditType(type)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${editType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full">
                                                {selectedEntity.element_type}
                                            </span>
                                            {!selectedEntity.user_confirmed && (
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 px-2.5 py-0.5 rounded-full">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tighter">{selectedEntity.name}</h1>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{entityMentions.length} Mentions recorded</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                                        <Link className="w-3.5 h-3.5 text-violet-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{entityConnections.length} Relationships</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Added {new Date(selectedEntity.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-12 space-y-10">
                                {/* Description Card */}
                                <div className="p-6 sm:p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">World Description</h3>
                                        {isEditMode ? (
                                            <textarea
                                                value={editDesc}
                                                onChange={(e) => setEditDesc(e.target.value)}
                                                rows={4}
                                                className="w-full text-slate-600 text-lg font-serif border-2 border-slate-50 rounded-2xl p-4 sm:p-6 outline-none focus:bg-white focus:border-indigo-100 transition-all"
                                            />
                                        ) : (
                                            <p className="text-lg sm:text-xl text-slate-700 leading-relaxed font-serif">
                                                {selectedEntity.attributes?.description || "A placeholder in the grand narrative. Begin narrating to deepen this fact."}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Extracted Essence</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {editTraits.map(t => (
                                                    <span key={t} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                                        {t}
                                                        {isEditMode && <button onClick={() => setEditTraits(editTraits.filter(tr => tr !== t))}><X className="w-3 h-3" /></button>}
                                                    </span>
                                                ))}
                                                {isEditMode && (
                                                    <input
                                                        value={newTrait}
                                                        onChange={(e) => setNewTrait(e.target.value)}
                                                        placeholder="+ Essence Tag"
                                                        className="px-3 py-1.5 bg-slate-50 text-[10px] rounded-xl outline-none border border-slate-100"
                                                        onKeyDown={e => e.key === 'Enter' && (setEditTraits([...editTraits, newTrait]), setNewTrait(''))}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            {selectedEntity.element_type === 'character' && (
                                                <SentimentArc data={sentimentData} />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Relationships Section in Entity Dossier */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active Relationships & Bonds</h3>
                                            <p className="text-xs text-slate-400">Connections with other characters and world locations</p>
                                        </div>
                                        <button
                                            id="add-relationship-btn"
                                            onClick={() => setIsAddConnectionOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Relationship
                                        </button>
                                    </div>

                                    {entityConnections.length === 0 ? (
                                        <div className="p-8 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200 text-center">
                                            <p className="text-xs text-slate-400 italic">No direct connections mapped for this entity yet.</p>
                                            <button
                                                onClick={() => setIsAddConnectionOpen(true)}
                                                className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                                            >
                                                + Link with another character or place
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {entityConnections.map((conn) => (
                                                <div
                                                    key={conn.id}
                                                    className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-start justify-between gap-4 group"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                                                            {renderIcon(conn.otherEntity?.element_type || 'character')}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4
                                                                    onClick={() => setSelectedId(conn.otherEntity.id)}
                                                                    className="text-sm font-bold text-slate-800 hover:text-indigo-600 cursor-pointer transition-colors"
                                                                >
                                                                    {conn.otherEntity?.name}
                                                                </h4>
                                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase rounded-md">
                                                                    {conn.connection_type?.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            {conn.description && (
                                                                <p className="text-xs text-slate-500 mt-1 italic line-clamp-2">
                                                                    "{conn.description}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteConnection({ storyId: id!, connId: conn.id })}
                                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Remove connection"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Narrative Journey Section */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] px-4 underline decoration-indigo-500/30 decoration-4 underline-offset-8">Narrative Journey</h3>
                                    <div className="space-y-4">
                                        {entityMentions.map((m, i) => (
                                            <div key={i} className="group p-6 bg-slate-50 hover:bg-white rounded-3xl border border-transparent hover:border-indigo-100 transition-all duration-500 relative">
                                                <div className="absolute -left-3 top-6 w-7 h-7 bg-white border border-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 shadow-sm font-mono">0{i + 1}</div>
                                                <p className="text-sm text-slate-600 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">"{m.mention_context}"</p>
                                                {m.emotional_state?.current_emotion && (
                                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 text-[10px] font-bold text-indigo-500 uppercase">
                                                        {m.emotional_state.current_emotion}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-inner p-1">
            <header className="bg-white rounded-t-[1.8rem] sm:rounded-t-[2.8rem] px-6 sm:px-10 py-6 sm:py-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tighter italic">World Bible</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Institutional Repository of Facts</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            id="bible-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Find a legend..."
                            className="w-full sm:w-auto pl-12 pr-6 py-2.5 sm:py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none text-sm transition-all"
                        />
                    </div>
                    <div className="flex bg-slate-50 p-1 rounded-2xl gap-1">
                        {[
                            { id: null, label: 'All' },
                            { id: 'character', icon: <User className="w-3 h-3" /> },
                            { id: 'location', icon: <MapPin className="w-3 h-3" /> },
                            { id: 'organization', icon: <Shield className="w-3 h-3" /> }
                        ].map(f => (
                            <button
                                key={f.label || f.id}
                                onClick={() => setFilterType(f.id)}
                                className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 ${filterType === f.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {f.icon} {f.label && f.label}
                            </button>
                        ))}
                    </div>
                    <button
                        id="new-entity-btn"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
                        title="Add Entity Manually"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Fact</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="p-2.5 sm:p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"
                        title="Export to Markdown"
                    >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </header>

            <CreateEntityModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                storyId={id!}
                onCreated={(newEl) => {
                    if (newEl?.id) setSelectedId(newEl.id);
                }}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-10 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredElements.map(el => (
                        <div
                            key={el.id}
                            id={`entity-card-${el.id}`}
                            onClick={() => setSelectedId(el.id)}
                            className="group bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 cursor-pointer relative overflow-hidden"
                        >
                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${el.element_type === 'character' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} transition-all group-hover:scale-105`}>
                                        {el.attributes?.visual_url ? (
                                            <img src={el.attributes.visual_url} alt={el.name} className="w-full h-full object-cover" />
                                        ) : (
                                            renderIcon(el.element_type, "w-6 h-6")
                                        )}
                                    </div>
                                    {!el.user_confirmed && (
                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-500 text-[8px] font-bold uppercase rounded-md animate-pulse">
                                            Pending Draft
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{el.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{el.element_type}</p>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">{el.attributes?.description || "A silent observer of the narrative stream."}</p>
                            </div>

                            {/* Decorative background letter */}
                            <div className="absolute -bottom-6 -right-4 text-9xl font-black text-slate-50 group-hover:text-indigo-50/50 transition-colors -z-0 select-none">
                                {el.name.charAt(0)}
                            </div>
                        </div>
                    ))}
                </div>
                {filteredElements.length === 0 && (
                    <div className="h-60 flex flex-col items-center justify-center text-slate-300">
                        <Activity className="w-10 h-10 opacity-10 mb-2" />
                        <p className="text-sm italic">The bible is silent. Add an entity manually or via narration.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
                        >
                            + Create New Fact
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

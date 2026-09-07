import React, { useState, useMemo } from 'react';
import {
    useGetStoryConnectionsQuery,
    useGetStoryElementsQuery,
    useCreateConnectionMutation,
    useUpdateConnectionMutation,
    useDeleteConnectionMutation
} from '../../services/stories';
import { useParams } from 'react-router-dom';
import {
    Share2, User, MapPin, Shield, Zap, Plus, Edit3, Trash2,
    X, AlertTriangle, Filter, Search
} from 'lucide-react';

const CONNECTION_TYPES = [
    'ally',
    'rival',
    'enemy',
    'mentor',
    'apprentice',
    'family',
    'conflicted_past',
    'subordinate',
    'associated',
    'creator',
    'sworn_protector'
];

interface ConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    storyId: string;
    elements: any[];
    existingConnection?: any | null;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({
    isOpen,
    onClose,
    storyId,
    elements,
    existingConnection
}) => {
    const [createConnection, { isLoading: isCreating }] = useCreateConnectionMutation();
    const [updateConnection, { isLoading: isUpdating }] = useUpdateConnectionMutation();

    const [fromId, setFromId] = useState('');
    const [toId, setToId] = useState('');
    const [connectionType, setConnectionType] = useState('ally');
    const [description, setDescription] = useState('');
    const [weight, setWeight] = useState(6);

    const isEdit = Boolean(existingConnection);
    const isLoading = isCreating || isUpdating;

    React.useEffect(() => {
        if (existingConnection) {
            setFromId(existingConnection.from_id);
            setToId(existingConnection.to_id);
            setConnectionType(existingConnection.connection_type || 'ally');
            setDescription(existingConnection.description || '');
            setWeight(existingConnection.weight || 6);
        } else {
            if (elements.length >= 2) {
                setFromId(elements[0].id);
                setToId(elements[1].id);
            } else if (elements.length === 1) {
                setFromId(elements[0].id);
                setToId(elements[0].id);
            }
            setConnectionType('ally');
            setDescription('');
            setWeight(6);
        }
    }, [existingConnection, elements, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromId || !toId || fromId === toId || isLoading) return;

        try {
            if (isEdit) {
                await updateConnection({
                    storyId,
                    connId: existingConnection.id,
                    updates: {
                        connection_type: connectionType,
                        description: description.trim(),
                        weight,
                    }
                }).unwrap();
            } else {
                await createConnection({
                    storyId,
                    connection: {
                        from_id: fromId,
                        to_id: toId,
                        connection_type: connectionType,
                        description: description.trim(),
                        weight,
                    }
                }).unwrap();
            }
            onClose();
        } catch (err) {
            console.error('Failed to save connection:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {isEdit ? 'Edit Relationship' : 'Establish Connection'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {isEdit ? 'Update bond dynamics' : 'Link two narrative entities'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isEdit && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Source Entity
                                </label>
                                <select
                                    id="connection-from-select"
                                    value={fromId}
                                    onChange={(e) => setFromId(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {elements.map(el => (
                                        <option key={el.id} value={el.id}>
                                            {el.name} ({el.element_type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Target Entity
                                </label>
                                <select
                                    id="connection-to-select"
                                    value={toId}
                                    onChange={(e) => setToId(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {elements.map(el => (
                                        <option key={el.id} value={el.id} disabled={el.id === fromId}>
                                            {el.name} ({el.element_type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Relationship Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {CONNECTION_TYPES.slice(0, 9).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setConnectionType(type)}
                                    className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize border transition-all text-center truncate ${connectionType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                >
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Bond Strength / Weight ({weight}/10)
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
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Context & Dynamics
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe how their paths cross, tension, mutual history..."
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
                            disabled={(!isEdit && fromId === toId) || isLoading}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md shadow-indigo-100 disabled:opacity-50 transition-all"
                        >
                            {isLoading ? 'Saving...' : isEdit ? 'Update Bond' : 'Establish Bond'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const NarrativeGraph: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: elements } = useGetStoryElementsQuery(id!);
    const { data: connections } = useGetStoryConnectionsQuery(id!);
    const [deleteConnection] = useDeleteConnectionMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConnection, setEditingConnection] = useState<any | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const nexusItems = useMemo(() => {
        if (!connections || !elements) return [];

        const elementMap = elements.reduce((acc, el) => {
            acc[el.id] = el;
            return acc;
        }, {} as Record<string, any>);

        return connections
            .map(conn => ({
                ...conn,
                from: elementMap[conn.from_id],
                to: elementMap[conn.to_id],
            }))
            .filter(conn => {
                const matchesType = filterType === 'all' || conn.connection_type === filterType;
                const matchesSearch = !searchQuery ||
                    conn.from?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    conn.to?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    conn.description?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesType && matchesSearch;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [connections, elements, filterType, searchQuery]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'character': return <User className="w-4 h-4" />;
            case 'location': return <MapPin className="w-4 h-4" />;
            case 'organization': return <Shield className="w-4 h-4" />;
            default: return <Zap className="w-4 h-4" />;
        }
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteConnection({ storyId: id!, connId: deletingId }).unwrap();
            setDeletingId(null);
        } catch (err) {
            console.error('Failed to delete connection:', err);
        }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto px-4 sm:px-8 pb-20 scrollbar-hide">
            <div className="max-w-3xl mx-auto py-8 space-y-10">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em]">
                            Vertical Narrative Nexus
                        </h3>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Relationship Web
                        </h2>
                    </div>

                    <button
                        id="new-relationship-btn"
                        onClick={() => {
                            setEditingConnection(null);
                            setIsModalOpen(true);
                        }}
                        disabled={!elements || elements.length < 2}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-50 transition-all shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Relationship</span>
                    </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by entity name or context..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Dynamic Types</option>
                            {CONNECTION_TYPES.map(t => (
                                <option key={t} value={t}>
                                    {t.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Connection List */}
                {nexusItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 text-center text-slate-400">
                        <div className="p-5 bg-slate-50 rounded-full mb-3">
                            <Share2 className="w-8 h-8 opacity-30" />
                        </div>
                        <p className="text-sm font-medium italic">
                            {searchQuery || filterType !== 'all'
                                ? 'No relationships matching your search.'
                                : 'No relationships mapped yet.'}
                        </p>
                        {(!elements || elements.length < 2) ? (
                            <p className="text-xs text-slate-400 mt-2">
                                Add at least two entities in the World Bible to establish connections.
                            </p>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditingConnection(null);
                                    setIsModalOpen(true);
                                }}
                                className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                            >
                                + Connect Two Entities
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="relative space-y-0">
                        {nexusItems.map((conn, idx) => (
                            <div key={conn.id} className="relative pl-10 sm:pl-12 pb-14 group">
                                {/* Vertical Connecting Line */}
                                {idx !== nexusItems.length - 1 && (
                                    <div className="absolute left-5 top-10 w-[2px] h-full bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
                                )}

                                {/* Connector Icon Badge */}
                                <div className="absolute left-0 top-1.5 w-10 h-10 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-600 transition-all shadow-sm z-10">
                                    <Zap className="w-4 h-4" />
                                </div>

                                <div className="p-6 sm:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm group-hover:shadow-xl group-hover:border-indigo-50 transition-all duration-500 relative">
                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingConnection(conn);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit Relationship"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(conn.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete Relationship"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Two Entities & Connection Badge */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                                        {/* From Entity */}
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                {getIcon(conn.from?.element_type)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-800 tracking-tight">{conn.from?.name || 'Unknown'}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{conn.from?.element_type}</span>
                                        </div>

                                        {/* Connection Type */}
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{conn.connection_type?.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1.5 h-1.5 rounded-full ${i < (conn.weight / 2) ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* To Entity */}
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                {getIcon(conn.to?.element_type)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-800 tracking-tight">{conn.to?.name || 'Unknown'}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{conn.to?.element_type}</span>
                                        </div>
                                    </div>

                                    {/* Connection Description */}
                                    <div className="mt-4 pt-4 border-t border-slate-50 text-center md:text-left">
                                        <p className="text-xs text-slate-500 italic font-medium leading-relaxed">
                                            "{conn.description || 'A connection established in the narrative.'}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Connection Create/Edit Modal */}
            <ConnectionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingConnection(null);
                }}
                storyId={id!}
                elements={elements || []}
                existingConnection={editingConnection}
            />

            {/* Delete Connection Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Sever Relationship?</h3>
                        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                            Are you sure you want to remove this relationship link between these two entities?
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all"
                            >
                                Delete Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

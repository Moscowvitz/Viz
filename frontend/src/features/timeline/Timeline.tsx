import React, { useState } from 'react';
import { useGetTimelineQuery } from '../../services/timeline';
import { useParams } from 'react-router-dom';
import { useUpdateMomentMutation, useDeleteMomentMutation, useGenerateMomentLabelMutation } from '../../services/stories';
import { useRevertMomentMutation } from '../../services/suggestions';
import { Star, Trash2, RotateCcw, X, Check, Activity, Wand2 } from 'lucide-react';

interface TimelineProps {
    variant?: 'horizontal' | 'vertical';
}

export const Timeline: React.FC<TimelineProps> = ({ variant = 'horizontal' }) => {
    const { id } = useParams<{ id: string }>();
    const { data: moments, isLoading } = useGetTimelineQuery(id!);
    const [updateMoment] = useUpdateMomentMutation();
    const [revertMoment] = useRevertMomentMutation();
    const [deleteMoment] = useDeleteMomentMutation();
    const [generateLabel, { isLoading: isGenerating }] = useGenerateMomentLabelMutation();

    const [editingMoment, setEditingMoment] = useState<any>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');

    if (isLoading) return <div className="animate-pulse h-32 bg-slate-100 rounded-3xl" />;

    const startEditing = (m: any) => {
        setEditingMoment(m);
        setEditTitle(m.title);
        setEditDesc(m.description || '');
    };

    const handleSave = async () => {
        if (!editingMoment) return;
        await updateMoment({
            storyId: id!,
            momentId: editingMoment.id,
            updates: { title: editTitle, description: editDesc }
        });
        setEditingMoment(null);
    };

    const handleRevert = async () => {
        if (!editingMoment || !window.confirm("Revert this event back to a suggestion? It will reappear in your draft list.")) return;
        try {
            await revertMoment(editingMoment.id).unwrap();
            setEditingMoment(null);
        } catch (err) {
            alert("Could not revert this moment. It might be a core system event.");
        }
    };

    const handleDelete = async () => {
        if (!editingMoment || !window.confirm("Permanently delete this story moment?")) return;
        await deleteMoment({ storyId: id!, momentId: editingMoment.id });
        setEditingMoment(null);
    };

    const handleGenerateLabel = async () => {
        if (!editingMoment) return;
        try {
            const result = await generateLabel({ storyId: id!, momentId: editingMoment.id }).unwrap();
            setEditTitle(result.title);
            setEditDesc(result.description || '');
        } catch (err) {
            console.error('Failed to generate label:', err);
        }
    };

    if (variant === 'vertical') {
        return (
            <div className="flex flex-col gap-6 relative py-4">
                <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-slate-100 -z-10" />
                {moments?.map((m: any) => {
                    const emotions = m.emotional_signature ? Object.entries(m.emotional_signature)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 1)
                        .map(([emotion]) => emotion)
                        .join('') : '';
                    
                    return (
                        <div
                            key={m.id}
                            onClick={() => startEditing(m)}
                            className="flex gap-4 group cursor-pointer hover:bg-indigo-50 p-3 rounded-lg transition-all"
                        >
                            <div className={`mt-0.5 w-4 h-4 rounded-full border-4 border-white shrink-0 transition-all ${m.narrative_weight > 7 ? 'bg-indigo-600 scale-125' : 'bg-slate-300 group-hover:bg-indigo-400'}`} />
                            <div className="flex flex-col gap-2 flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight flex-1">{m.title}</h4>
                                    {emotions && (
                                        <span className="text-xs shrink-0 text-indigo-600">✨ {emotions}</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-snug">{m.description || 'A key moment in the narrative...'}</p>
                                <div className="flex items-center gap-2 text-[9px]">
                                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${(m.narrative_weight / 10) * 100}%` }} />
                                    </div>
                                    <span className="text-slate-400 font-medium">{m.narrative_weight}/10</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Editing Modal (Shared) */}
                {renderModal()}
            </div>
        );
    }

    function renderModal() {
        if (!editingMoment) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correct Timeline Event</span>
                        </div>
                        <button onClick={() => setEditingMoment(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
                            <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full text-lg font-bold text-slate-900 bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 outline-none focus:border-indigo-100 focus:bg-white transition-all"
                                placeholder="The inciting incident..."
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1 mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Interpretation</label>
                                <button
                                    onClick={handleGenerateLabel}
                                    disabled={isGenerating}
                                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-bold text-[9px] uppercase tracking-widest disabled:opacity-50"
                                >
                                    <Wand2 className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                                    {isGenerating ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                rows={4}
                                className="w-full text-slate-600 text-sm leading-relaxed bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 outline-none focus:border-indigo-100 focus:bg-white transition-all"
                                placeholder="What actually happened in this moment?"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all"
                            >
                                <Check className="w-4 h-4" />
                                Update Timeline
                            </button>
                            <button
                                onClick={handleRevert}
                                className="p-4 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-2xl transition-all"
                                title="Revert to Draft"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-4 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl transition-all"
                                title="Delete Moment"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative py-12 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-12 min-w-max px-20">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 -z-10" />

                {moments?.map((moment: any, index: number) => {
                    const isMajor = moment.narrative_weight > 7;
                    const isSelected = editingMoment?.id === moment.id;
                    
                    // Extract emotions from emotional_signature for better label
                    const emotions = moment.emotional_signature ? Object.entries(moment.emotional_signature)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 2)
                        .map(([emotion]) => emotion)
                        .join(' / ') : '';

                    return (
                        <div
                            key={moment.id}
                            onClick={() => startEditing(moment)}
                            className={`relative flex flex-col items-center group cursor-pointer transition-all duration-300 ${isSelected ? 'scale-110' : ''}`}
                            style={{ width: '220px' }}
                        >
                            <div className={`
                                w-4 h-4 rounded-full border-4 border-slate-50 transition-all duration-300 z-10
                                ${isMajor ? 'scale-150 bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-400 group-hover:bg-indigo-400'}
                                ${isSelected ? 'ring-4 ring-indigo-200 bg-indigo-600 scale-150' : ''}
                            `}>
                                {isMajor && <Star className="w-2 h-2 text-white absolute inset-0 m-auto" />}
                            </div>

                            <div className={`
                                absolute w-56 text-center transition-all duration-300 bg-white rounded-lg p-3 shadow-sm border border-slate-100
                                ${index % 2 === 0 ? '-top-28' : 'top-12'}
                                ${isSelected ? 'opacity-100 scale-100 shadow-lg' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100 pointer-events-none'}
                            `}>
                                <h4 className={`font-bold text-xs leading-snug ${isSelected ? 'text-indigo-600' : 'text-slate-800'}`}>
                                    {moment.title}
                                </h4>
                                {moment.description && (
                                    <p className="text-[9px] text-slate-600 mt-2 leading-relaxed line-clamp-3">
                                        {moment.description}
                                    </p>
                                )}
                                {emotions && (
                                    <p className="text-[9px] text-indigo-500 uppercase font-bold tracking-tight mt-2 italic">
                                        ✨ {emotions}
                                    </p>
                                )}
                                <p className="text-[8px] text-slate-400 mt-2 font-medium">
                                    Impact: {moment.narrative_weight}/10
                                </p>
                            </div>
                        </div>
                    );
                })}

                <div className="flex flex-col items-center opacity-30 select-none">
                    <div className="w-4 h-4 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 mt-4 italic uppercase">Continue...</span>
                </div>
            </div>

            {renderModal()}
        </div>
    );
};

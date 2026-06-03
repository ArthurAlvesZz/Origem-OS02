import React, { useState, useEffect } from 'react';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { QualityReviewRecord } from '../../../repositories/interfaces/IQualityRepository';
import { X, Save, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface QualityReviewDrawerProps {
  reviewId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function QualityReviewDrawer({ reviewId, onClose, onSuccess }: QualityReviewDrawerProps) {
  const { qualityRepo } = useRepositories();
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<QualityReviewRecord | null>(null);

  const [scores, setScores] = useState({
     fragrance: 0, aroma: 0, acidity: 0, body: 0, sweetness: 0, balance: 0, aftertaste: 0, defects: 0
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    qualityRepo.getReviews().then(all => {
       const rev = all.find(r => r.id === reviewId);
       if (rev) {
          setReview(rev);
          setScores({
             fragrance: rev.fragranceScore || 0,
             aroma: rev.aromaScore || 0,
             acidity: rev.acidityScore || 0,
             body: rev.bodyScore || 0,
             sweetness: rev.sweetnessScore || 0,
             balance: rev.balanceScore || 0,
             aftertaste: rev.aftertasteScore || 0,
             defects: rev.defectsScore || 0,
          });
          setNotes(rev.notes || '');
       }
    });
  }, [reviewId, qualityRepo]);

  const totalScore = Object.values(scores).reduce((a,b) => a+b, 0) - (scores.defects * 2); // basic rule

  const handleApprove = async () => {
    setLoading(true);
    try {
      await qualityRepo.updateReview(reviewId, {
         fragranceScore: scores.fragrance,
         aromaScore: scores.aroma,
         acidityScore: scores.acidity,
         bodyScore: scores.body,
         sweetnessScore: scores.sweetness,
         balanceScore: scores.balance,
         aftertasteScore: scores.aftertaste,
         defectsScore: scores.defects,
         scoreTotal: totalScore > 0 ? totalScore + 50 : 0 // standard SCA + 50 baseline roughly
      });
      await qualityRepo.approveReview(reviewId, notes);
      onSuccess();
    } catch (e) {
      alert('Erro ao aprovar lote.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await qualityRepo.updateReview(reviewId, {
         fragranceScore: scores.fragrance,
         aromaScore: scores.aroma,
         acidityScore: scores.acidity,
         bodyScore: scores.body,
         sweetnessScore: scores.sweetness,
         balanceScore: scores.balance,
         aftertasteScore: scores.aftertaste,
         defectsScore: scores.defects,
         scoreTotal: totalScore > 0 ? totalScore + 50 : 0
      });
      await qualityRepo.rejectReview(reviewId, notes);
      onSuccess();
    } catch (e) {
      alert('Erro ao reprovar lote.');
    } finally {
      setLoading(false);
    }
  };

  if (!review) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <div>
            <h2 className="text-xl font-medium text-white">Avaliação Sensorial</h2>
            <p className="text-sm text-zinc-400 mt-1">Lote: <span className="text-amber-500 font-mono">{review.batch?.code || review.productionBatchId}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
           <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <h3 className="text-sm font-medium text-white mb-4">Notas SCA (0-10)</h3>
              <div className="grid grid-cols-2 gap-4">
                 {['fragrance', 'aroma', 'acidity', 'body', 'sweetness', 'balance', 'aftertaste'].map(attr => (
                    <div key={attr}>
                       <label className="block text-xs text-zinc-400 mb-1 capitalize">{attr}</label>
                       <input 
                         type="number" 
                         step="0.25" min="0" max="10" 
                         value={scores[attr as keyof typeof scores]} 
                         onChange={e => setScores({...scores, [attr]: parseFloat(e.target.value) || 0})}
                         className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm focus:border-amber-500 outline-none" 
                       />
                    </div>
                 ))}
                 <div>
                    <label className="block text-xs text-red-400 mb-1">Defeitos (Desc.)</label>
                    <input 
                      type="number" 
                      step="1" min="0" 
                      value={scores.defects} 
                      onChange={e => setScores({...scores, defects: parseInt(e.target.value) || 0})}
                      className="w-full bg-zinc-950 border border-red-900/50 rounded p-2 text-red-400 text-sm focus:border-red-500 outline-none" 
                    />
                 </div>
              </div>
              
              <div className="mt-6 flex justify-between items-center pt-4 border-t border-zinc-800">
                 <span className="text-sm text-zinc-400">Score Projetado (Base 50)</span>
                 <span className={`text-xl font-bold ${totalScore + 50 >= 80 ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {(totalScore + 50).toFixed(2)} pts
                 </span>
              </div>
           </div>

           <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Observações / Laudo</label>
              <textarea 
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-amber-500 outline-none resize-none" 
                placeholder="Notas sobre perfil de xícara, cor da torra, etc..."
              />
           </div>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex gap-3 sticky bottom-0">
          <button 
             onClick={handleReject} 
             disabled={loading} 
             className="flex-1 px-4 py-3 rounded-lg font-medium text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <XCircle size={18} /> Reprovar Lote
          </button>
          <button 
             onClick={handleApprove} 
             disabled={loading} 
             className="flex-1 px-4 py-3 rounded-lg font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} /> Aprovar & Liberar
          </button>
        </div>
      </div>
    </div>
  );
}

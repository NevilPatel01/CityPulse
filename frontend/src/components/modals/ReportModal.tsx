import { useState } from 'react';
import { X } from 'lucide-react';

interface ReportModalProps {
    title?: string;
    onClose: () => void;
    onSubmit: (reason: string, description?: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
    title = "Report Content",
    onClose, 
    onSubmit 
}) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (reason && !isSubmitting) {
            setIsSubmitting(true);
            try {
                await onSubmit(reason, description);
                onClose();
            } catch (error) {
                console.error('Error submitting report:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-surface-glass backdrop-blur-lg border border-white/10 rounded-xl p-6 max-w-md w-full shadow-xl" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-text-primary">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Reason <span className="text-error">*</span>
                        </label>
                        <select 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-base border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-pulse/50 focus:border-pulse transition-all"
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Select a reason</option>
                            <option value="spam">Spam</option>
                            <option value="inappropriate">Inappropriate content</option>
                            <option value="misleading">Misleading information</option>
                            <option value="offensive">Offensive content</option>
                            <option value="copyright">Copyright violation</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Additional details (optional)
                        </label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-base border border-white/10 rounded-lg px-4 py-2 text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-pulse/50 focus:border-pulse transition-all"
                            rows={4}
                            placeholder="Provide more context about why you're reporting this content..."
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-text-primary font-medium"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            disabled={!reason || isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

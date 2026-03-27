import React, { useState } from 'react';
import { Icons } from '../constants';
import { toast } from 'sonner';
import { submitReview } from '../services/authService';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [recommend, setRecommend] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const MIN_LENGTH = 20;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please provide a star rating');
            return;
        }
        if (comment.length < MIN_LENGTH) {
            toast.error(`Please write at least ${MIN_LENGTH} characters`);
            return;
        }
        
        setIsSubmitting(true);
        try {
            await submitReview({
                rating,
                title,
                comment,
                recommend
            });
            
            toast.success('Thank you for your detailed feedback!');
            setRating(0);
            setTitle('');
            setComment('');
            setRecommend(null);
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[100] w-96 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-primary text-white flex justify-between items-center shadow-lg">
                    <h3 className="font-bold flex items-center gap-2">
                        <Icons.Heart /> Share your Feedback
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                        <Icons.Close />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Star Rating */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">How would you rate us?</label>
                        <div className="flex justify-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className={`text-3xl transition-all transform hover:scale-125 focus:outline-none ${
                                        star <= (hoverRating || rating) 
                                        ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Review Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                            required
                        />
                    </div>

                    {/* Review Body */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Review Body</label>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                comment.length >= MIN_LENGTH ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {comment.length} / {MIN_LENGTH} min
                            </span>
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write your meaningful feedback here..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all text-sm resize-none h-28"
                            required
                        />
                    </div>

                    {/* Recommendation Toggle */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Would you recommend this to others?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRecommend(true)}
                                className={`py-2.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                                    recommend === true 
                                    ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                                    : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-green-400'
                                }`}
                            >
                                <Icons.Check /> Yes
                            </button>
                            <button
                                type="button"
                                onClick={() => setRecommend(false)}
                                className={`py-2.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                                    recommend === false 
                                    ? 'bg-red-500 border-red-500 text-white shadow-lg' 
                                    : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-red-400'
                                }`}
                            >
                                <Icons.Close /> No
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export const FloatingReviewButton: React.FC<{ onClick: () => void; isOpen: boolean }> = ({ onClick, isOpen }) => {
    return (
        <button
            onClick={onClick}
            className={`fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
                isOpen 
                ? 'bg-red-500 text-white rotate-90' 
                : 'bg-primary text-white hover:bg-teal-600'
            }`}
            aria-label="Toggle Review Modal"
        >
            {isOpen ? <Icons.Close /> : <Icons.Heart />}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-white dark:border-gray-900"></span>
            </span>
        </button>
    );
};

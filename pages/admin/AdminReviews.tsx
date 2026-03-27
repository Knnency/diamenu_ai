import React, { useState, useEffect } from 'react';
import { Icons } from '../../constants';
import { getAdminReviews, toggleReviewStatus, Review } from '../../services/authService';
import { toast } from 'sonner';

const AdminReviews: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const data = await getAdminReviews();
            setReviews(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch reviews');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            const updatedReview = await toggleReviewStatus(id);
            setReviews(reviews.map(r => r.id === id ? updatedReview : r));
            toast.success(`Review ${updatedReview.is_approved ? 'approved' : 'hidden'}`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update review status');
        }
    };

    // Calculate Analytics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
        : '0.0';
    const recommendedCount = reviews.filter(r => r.recommend === true).length;
    const recommendationRate = totalReviews > 0 
        ? Math.round((recommendedCount / totalReviews) * 100) 
        : 0;
    const pendingModeration = reviews.filter(r => !r.is_approved).length;

    // Star Distribution
    const distribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        percentage: totalReviews > 0 
            ? Math.round((reviews.filter(r => r.rating === star).length / totalReviews) * 100) 
            : 0
    }));

    return (
        <div className="w-full space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <Icons.Bookmark />
                        </div>
                        Customer Reviews
                    </h1>
                    <p className="text-gray-500 mt-2">Manage and moderate user-submitted reviews.</p>
                </div>
            </div>

            {/* Analytics Section */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                <Icons.User />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                                <h3 className="text-2xl font-bold">{totalReviews}</h3>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl">
                                <span className="text-xl font-bold">★</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Avg. Rating</p>
                                <h3 className="text-2xl font-bold">{averageRating}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                                <Icons.Heart />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Recommended</p>
                                <h3 className="text-2xl font-bold">{recommendationRate}%</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl">
                                <Icons.Shield />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Mod.</p>
                                <h3 className="text-2xl font-bold">{pendingModeration}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Rating Distribution Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold mb-6 flex items-center gap-2">
                            <Icons.Chart />
                            Rating Distribution
                        </h4>
                        <div className="space-y-4">
                            {distribution.map(item => (
                                <div key={item.star} className="flex items-center gap-3">
                                    <span className="text-sm font-medium w-8">{item.star}★</span>
                                    <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-amber-400 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 w-8 text-right">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Placeholder for future detailed analytics or just empty space for now */}
                    <div className="lg:col-span-2 hidden lg:flex items-center justify-center p-6 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl text-gray-400">
                        <div className="text-center">
                            <Icons.Chart size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Advanced sentiment analysis coming soon.</p>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h4 className="font-bold flex items-center gap-2">
                            <Icons.Bookmark size={18} />
                            Detailed Logs
                        </h4>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total {reviews.length} entries</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1000px]">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Customer</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Review</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-center">Rating</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-center">Recommend</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Date</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Status</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {reviews.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">No reviews found.</td>
                                    </tr>
                                ) : (
                                    reviews.map(review => (
                                        <tr key={review.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-4 w-64">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">{review.user_name}</span>
                                                    <span className="text-xs text-gray-500">{review.user_email}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 min-w-[300px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200 break-words">{review.title}</span>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words line-clamp-2 md:line-clamp-none">{review.comment}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1 text-amber-500">
                                                    <span>★</span>
                                                    <span className="text-sm font-bold">{review.rating}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {review.recommend === true ? (
                                                    <span className="text-green-500 font-bold text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">YES</span>
                                                ) : review.recommend === false ? (
                                                    <span className="text-red-500 font-bold text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">NO</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    review.is_approved ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                }`}>
                                                    {review.is_approved ? 'Approved' : 'Hidden'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleToggleStatus(review.id)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                                                        review.is_approved 
                                                        ? 'text-amber-600 border-amber-200 hover:bg-amber-50' 
                                                        : 'text-green-600 border-green-200 hover:bg-green-50'
                                                    }`}
                                                >
                                                    {review.is_approved ? 'Hide Review' : 'Approve'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;

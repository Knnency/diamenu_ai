import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BloodSugarLog } from '../types';
import { getBloodSugarLogs, saveBloodSugarLog, deleteBloodSugarLog } from '../services/bloodSugarService';
import { generateHealthAdvice } from '../services/geminiService';
import { Icons } from '../constants';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<BloodSugarLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const prevLogsRef = useRef<number>(0);

  const [newLog, setNewLog] = useState<Partial<BloodSugarLog>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    value: ' ',
    context: 'Fasting',
    notes: ''
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dbLogs = await getBloodSugarLogs();
      setLogs(dbLogs);
    } catch (err: any) {
      console.error("Failed to fetch logs", err);
      setError(err.message || "Failed to load blood sugar logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Effect to handle AI Advice generation when logs change
  useEffect(() => {
    if (isLoading) return; // Wait for initial fetch

    // Check if the number of logs has changed or we don't have advice yet explicitly
    if (logs.length > 0 && (logs.length !== prevLogsRef.current || !aiAdvice)) {
      prevLogsRef.current = logs.length; // Update the ref
      fetchAiAdvice(logs);
    } else if (logs.length === 0) {
      setAiAdvice("No blood sugar data yet. Log your first reading to get personalized advice!");
    }
  }, [logs, isLoading]);

  const fetchAiAdvice = async (currentLogs: BloodSugarLog[]) => {
    setIsAiLoading(true);
    try {
      const advice = await generateHealthAdvice(currentLogs);
      setAiAdvice(advice);
    } catch (err) {
      console.error("Failed to generate AI advice", err);
      setAiAdvice("AI Assistant is currently unavailable.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLog(prev => ({ ...prev, [name]: name === 'value' ? Number(value) : value }));
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.value || !newLog.date || !newLog.time) return;

    try {
      // Use the API to save the log
      const savedLog = await saveBloodSugarLog({
        date: newLog.date as string,
        time: newLog.time as string,
        value: newLog.value as number,
        context: newLog.context as any,
        notes: newLog.notes || ''
      });

      // Update the local list and sort
      const updatedLogs = [...logs, savedLog].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime(); // Sort descending
      });

      setLogs(updatedLogs);

      // Reset form but keep date/time current
      setNewLog({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        value: 100,
        context: 'Fasting',
        notes: ''
      });
    } catch (err: any) {
      console.error("Failed to save log:", err);
      toast.error(err.message || 'Failed to save the new reading. Please try again.');
    }
  };

  const handleDeleteLog = async (id: string | number) => {
    try {
      await deleteBloodSugarLog(id);

      const updatedLogs = logs.filter(log => log.id !== id);
      setLogs(updatedLogs);
    } catch (err: any) {
      console.error("Failed to delete log:", err);
      toast.error(err.message || 'Failed to delete reading. Please try again.');
    }
  };

  // Prepare data for the chart
  const chartData = [...logs].reverse().map(log => ({
    ...log,
    dateTime: `${log.date} ${log.time}`,
    displayDate: new Date(`${log.date}T${log.time}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }));

  const getStatusColor = (value: number, context: string) => {
    if (context === 'Fasting' || context === 'Before Meal') {
      if (value < 70) return 'text-red-600 dark:text-red-400'; // Hypo
      if (value <= 130) return 'text-green-600 dark:text-green-400'; // Target
      return 'text-yellow-600 dark:text-yellow-400'; // High
    } else {
      // After Meal or Bedtime
      if (value < 70) return 'text-red-600 dark:text-red-400'; // Hypo
      if (value <= 180) return 'text-green-600 dark:text-green-400'; // Target
      return 'text-yellow-600 dark:text-yellow-400'; // High
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Statistics & Trends</h1>
        <p className="text-gray-500 dark:text-gray-400">Track your blood sugar trends and AI health insights.</p>
      </div>

      {/* AI Assistant Card */}
      <div className="bg-gradient-to-r from-primary-light dark:from-primary/20 to-blue-50 dark:to-gray-800 p-6 rounded-2xl shadow-md border border-primary/30 dark:border-primary/30">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-primary/10 text-primary dark:text-accent shrink-0">
            <Icons.Doctor />
          </div>
          <div className="flex-grow">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              AI Health Assistant
              {isAiLoading && <div className="animate-pulse w-2 h-2 rounded-full bg-primary" />}
            </h2>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {isAiLoading ? (
                <div className="space-y-2 animate-pulse mt-1">
                  <div className="h-4 bg-gray-200/60 dark:bg-gray-700/60 rounded w-full"></div>
                  <div className="h-4 bg-gray-200/60 dark:bg-gray-700/60 rounded w-5/6"></div>
                </div>
              ) : (
                <p>{aiAdvice || "Ready to analyze your trends."}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Blood Sugar Trends</h2>

          {logs.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => value.split(',')[0]} // Just show date
                    minTickGap={30}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    domain={['dataMin - 20', 'dataMax + 20']}
                    label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Low (70)', fill: '#EF4444', fontSize: 10 }} />
                  <ReferenceLine y={180} stroke="#F59E0B" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'High Target (180)', fill: '#F59E0B', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Blood Sugar (mg/dL)"
                    stroke="#0EA5E9"
                    strokeWidth={3}
                    activeDot={{ r: 8, fill: '#0EA5E9', stroke: '#fff', strokeWidth: 2 }}
                    dot={{ r: 4, fill: '#0EA5E9', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">No data logged yet. Add a reading to see your trends.</p>
            </div>
          )}
        </div>

        {/* Log Form Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Log Reading</h2>

          <form onSubmit={handleAddLog} className="space-y-4 flex-grow">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newLog.date}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-primary dark:focus:border-accent focus:ring-1 focus:ring-primary sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                <input
                  type="time"
                  name="time"
                  value={newLog.time}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-primary dark:focus:border-accent focus:ring-1 focus:ring-primary sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Sugar (mg/dL)</label>
              <div className="relative">
                <input
                  type="number"
                  name="value"
                  value={newLog.value}
                  onChange={handleInputChange}
                  min="20"
                  max="600"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-primary dark:focus:border-accent focus:ring-1 focus:ring-primary sm:text-sm text-lg font-semibold"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">mg/dL</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Context</label>
              <select
                name="context"
                value={newLog.context}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-primary dark:focus:border-accent focus:ring-1 focus:ring-primary sm:text-sm"
              >
                <option value="Fasting">Fasting (Waking up)</option>
                <option value="Before Meal">Before Meal</option>
                <option value="After Meal">After Meal (2 hrs)</option>
                <option value="Bedtime">Bedtime</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
              <input
                type="text"
                name="notes"
                value={newLog.notes}
                onChange={handleInputChange}
                placeholder="e.g., Felt dizzy, ate cake"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 shadow-sm focus:border-primary dark:focus:border-accent focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-white bg-primary hover:bg-teal-700 shadow-md transition-colors"
              >
                Save Reading
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* History Table */}
      {logs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Logs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reading</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Context</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[...logs].reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(`${log.date}T${log.time}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {log.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${getStatusColor(log.value, log.context)}`}>
                        {log.value} mg/dL
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.context}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {log.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-red-600 dark:text-red-500 hover:text-red-900 dark:hover:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

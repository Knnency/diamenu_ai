import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BloodSugarLog } from '../types';

const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<BloodSugarLog[]>([]);
  const [newLog, setNewLog] = useState<Partial<BloodSugarLog>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    value: 100,
    context: 'Fasting',
    notes: ''
  });

  useEffect(() => {
    // Load logs from local storage
    const savedLogs = localStorage.getItem('bloodSugarLogs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    } else {
      // Add some dummy data for demonstration
      const dummyData: BloodSugarLog[] = [
        { id: '1', date: '2023-10-20', time: '07:00', value: 110, context: 'Fasting' },
        { id: '2', date: '2023-10-20', time: '14:00', value: 145, context: 'After Meal' },
        { id: '3', date: '2023-10-21', time: '07:30', value: 105, context: 'Fasting' },
        { id: '4', date: '2023-10-21', time: '13:30', value: 130, context: 'After Meal' },
        { id: '5', date: '2023-10-22', time: '07:15', value: 115, context: 'Fasting' },
        { id: '6', date: '2023-10-22', time: '19:00', value: 155, context: 'After Meal' },
        { id: '7', date: '2023-10-23', time: '07:00', value: 98, context: 'Fasting' },
      ];
      setLogs(dummyData);
      localStorage.setItem('bloodSugarLogs', JSON.stringify(dummyData));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLog(prev => ({ ...prev, [name]: name === 'value' ? Number(value) : value }));
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.value || !newLog.date || !newLog.time) return;

    const logEntry: BloodSugarLog = {
      id: Date.now().toString(),
      date: newLog.date as string,
      time: newLog.time as string,
      value: newLog.value as number,
      context: newLog.context as any,
      notes: newLog.notes || ''
    };

    const updatedLogs = [...logs, logEntry].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    setLogs(updatedLogs);
    localStorage.setItem('bloodSugarLogs', JSON.stringify(updatedLogs));

    // Reset form but keep date/time current
    setNewLog({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      value: 100,
      context: 'Fasting',
      notes: ''
    });
  };

  const handleDeleteLog = (id: string) => {
    const updatedLogs = logs.filter(log => log.id !== id);
    setLogs(updatedLogs);
    localStorage.setItem('bloodSugarLogs', JSON.stringify(updatedLogs));
  };

  // Prepare data for the chart
  const chartData = logs.map(log => ({
    ...log,
    dateTime: `${log.date} ${log.time}`,
    displayDate: new Date(`${log.date}T${log.time}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }));

  const getStatusColor = (value: number, context: string) => {
    if (context === 'Fasting' || context === 'Before Meal') {
      if (value < 70) return 'text-red-600'; // Hypo
      if (value <= 130) return 'text-green-600'; // Target
      return 'text-yellow-600'; // High
    } else {
      // After Meal or Bedtime
      if (value < 70) return 'text-red-600'; // Hypo
      if (value <= 180) return 'text-green-600'; // Target
      return 'text-yellow-600'; // High
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
        <p className="text-gray-500">Track your blood sugar trends over time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Blood Sugar Trends</h2>
          
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
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500">No data logged yet. Add a reading to see your trends.</p>
            </div>
          )}
        </div>

        {/* Log Form Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Log Reading</h2>
          
          <form onSubmit={handleAddLog} className="space-y-4 flex-grow">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newLog.date}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  name="time"
                  value={newLog.time}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Sugar (mg/dL)</label>
              <div className="relative">
                <input
                  type="number"
                  name="value"
                  value={newLog.value}
                  onChange={handleInputChange}
                  min="20"
                  max="600"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm text-lg font-semibold"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">mg/dL</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Context</label>
              <select
                name="context"
                value={newLog.context}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
              >
                <option value="Fasting">Fasting (Waking up)</option>
                <option value="Before Meal">Before Meal</option>
                <option value="After Meal">After Meal (2 hrs)</option>
                <option value="Bedtime">Bedtime</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <input
                type="text"
                name="notes"
                value={newLog.notes}
                onChange={handleInputChange}
                placeholder="e.g., Felt dizzy, ate cake"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Logs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reading</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...logs].reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(`${log.date}T${log.time}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {log.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${getStatusColor(log.value, log.context)}`}>
                        {log.value} mg/dL
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.context}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-red-600 hover:text-red-900"
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

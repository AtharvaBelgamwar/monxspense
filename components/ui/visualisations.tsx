'use client';

import React, { useState, useEffect } from 'react';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartOptions } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { format } from 'date-fns'; // For formatting dates

// Register necessary Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  recurring?: boolean;
}

export function Visualizations() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // To store selected month

  useEffect(() => {
    // Fetch transactions from the backend
    fetch('http://localhost:5000/auth/user', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.user.transactions || []);
      })
      .catch((err) => console.error('Error fetching transactions', err));
  }, []);

  // Get unique months from transactions
  const uniqueMonths = Array.from(new Set(transactions.map(transaction => format(new Date(transaction.date), 'MMMM yyyy'))));

  // Filter transactions based on the selected month
  const filteredTransactions = selectedMonth
    ? transactions.filter(transaction => format(new Date(transaction.date), 'MMMM yyyy') === selectedMonth)
    : transactions;

  // Data aggregation for Pie Chart (spending by category for the selected month)
  const categorySpending: { [key: string]: number } = {};

  filteredTransactions.forEach(transaction => {
    const category = transaction.description || 'Other';
    if (!categorySpending[category]) {
      categorySpending[category] = 0;
    }
    categorySpending[category] += transaction.amount;
  });

  const pieData = {
    labels: Object.keys(categorySpending),
    datasets: [
      {
        label: 'Expenses',
        data: Object.values(categorySpending),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }
    ]
  };

  const pieOptions: ChartOptions<'pie'> = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(event.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Month Selector */}
        <div className="mb-4">
          <label className="text-white text-lg">Select Month:</label>
          <select 
            className="ml-4 p-2 rounded-md text-purple-600"  // Text color set to purple
            value={selectedMonth}
            onChange={handleMonthChange}
          >
            <option value="">All Months</option>
            {uniqueMonths.map((month, index) => (
              <option key={index} value={month}>{month}</option>
            ))}
          </select>
        </div>

        {/* Pie Chart */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl transition-all duration-300 ease-in-out hover:shadow-2xl">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">Expenses Breakdown (Pie Chart)</h2>
          </CardHeader>
          <CardContent>
            <div className="relative" style={{ height: '300px', width: '300px', margin: '0 auto' }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

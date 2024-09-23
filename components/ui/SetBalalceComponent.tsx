'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";

export function SetBalanceComponent() {
    const [balance, setBalance] = useState('');
    const [error, setError] = useState('');  // To handle error message
    const [loading, setLoading] = useState(false); // To handle loading state
    const [success, setSuccess] = useState(false); // To show success message

    const handleSubmit = async () => {
        if (!balance || isNaN(Number(balance))) {
            setError('Please enter a valid balance');
            return;
        }
    
        setLoading(true);
        setError('');
    
        try {
            // Send the balance to the backend to be saved
            const response = await fetch('http://localhost:5000/auth/set_balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include credentials (cookies) with the request
                body: JSON.stringify({ balance: parseFloat(balance) }),
               
            });
    
            if (response.ok) {
                console.log('Balance saved successfully');
                window.location.href = '/main';
            } else {
                const data = await response.json();
                console.error('Error from backend:', data);  // Log the exact backend error
                setError(data.error || 'Failed to save balance. Please try again.');
            }
        } catch (err) {
            console.error('Error in request:', err);
            setError('An error occurred while saving balance. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Set Your Initial Balance</h2>

                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">Balance saved successfully!</p>}
                
                <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="p-2 border rounded text-gray-800 w-full mb-4"
                    placeholder="Enter your balance"
                />

                <Button onClick={handleSubmit} className="bg-blue-500 text-black w-full" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Balance'}
                </Button>
            </div>
        </div>
    );
}

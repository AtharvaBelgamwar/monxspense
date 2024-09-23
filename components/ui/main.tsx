// @ts-nocheck
// @ts-ignore
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { PlusCircle, DollarSign, PieChart, Clock } from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  recurring?: boolean;
  type?: "credit" | "debit"; // Add type for transaction (credit or debit)
}

export function ExpenseTrackerMainPage() {
  const [category, setCategory] = useState<string>(""); // Set types explicitly
  const [amount, setAmount] = useState<string>(""); // Store amount as string for input handling
  const [date, setDate] = useState<string>(""); // Store date as string
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  ); // Array of transactions
  const [balance, setBalance] = useState<number>(0); // Add balance state
  const [needsBalance, setNeedsBalance] = useState<boolean>(false); // Track if user needs to set balance
  const [newBalance, setNewBalance] = useState<string>(""); // For input of new balance as a string
  const [addBalance, setAddBalance] = useState<string>("");
  const [transactionType, setTransactionType] = useState<"credit" | "debit">(
    "credit",
  ); // Add state for credit/debit selection

  useEffect(() => {
    // Fetch user data when the component mounts
    fetch("http://localhost:5000/auth/user", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.needs_balance) {
          setNeedsBalance(true); // Show prompt to set balance
        } else {
          setBalance(data.user.total_balance || 0); // Set total balance
        }
        setRecentTransactions(data.user.transactions || []); // Fetch user transactions
      })
      .catch((err) => console.error("Error fetching user data", err));
  }, []);

  // Handle setting the total balance
  const handleSetBalance = () => {
    const parsedBalance = parseFloat(newBalance);
    if (isNaN(parsedBalance)) {
      alert("Please enter a valid number for the balance.");
      return;
    }

    fetch("/auth/set_balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ total_balance: parsedBalance }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Total balance set successfully") {
          setBalance(parsedBalance); // Update balance on frontend
          setNeedsBalance(false); // Hide the prompt
        }
      })
      .catch((err) => console.error("Error setting total balance", err));
  };

  const handleAddBalance = async () => {
    const additionalBalance = parseFloat(addBalance);
    if (isNaN(additionalBalance) || additionalBalance <= 0) {
      alert("Please enter a valid number greater than 0");
      return;
    }

    // Call backend to update the balance
    await fetch("http://localhost:5000/auth/add_balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include credentials for the request
      body: JSON.stringify({ additional_balance: additionalBalance }),
    });

    // Update the balance on the frontend
    setBalance((prevBalance) => prevBalance + additionalBalance);
    setAddBalance(""); // Clear the input field after updating

    // Also add a transaction for the additional balance
    const newTransaction: Transaction = {
      id: recentTransactions.length + 1,
      description: "Added to Balance",
      amount: additionalBalance,
      date: new Date().toISOString().split("T")[0], // current date
      recurring: false,
      type: "credit", // Mark this as a credit transaction
    };

    // Add the transaction to the recent transactions
    setRecentTransactions([...recentTransactions, newTransaction]);

    // Optionally send the transaction to the backend as well
    await fetch("http://localhost:5000/auth/add_transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(newTransaction),
    });
  };

  const handleToggle = () => {
    setIsRecurring(!isRecurring);
  };

  const handleAddTransaction = () => {
    const parsedAmount = parseFloat(amount);
    if (!category || isNaN(parsedAmount) || !date) {
      alert("Please fill all fields with valid data.");
      return;
    }

    // Determine whether to subtract or add to balance based on transaction type
    const transactionAmount =
      transactionType === "debit" ? -parsedAmount : parsedAmount;

    const newTransaction: Transaction = {
      id: recentTransactions.length + 1,
      description: category,
      amount: transactionAmount,
      date: date,
      recurring: isRecurring,
      type: transactionType, // Add transaction type (credit/debit)
    };

    // Update recent transactions locally
    setRecentTransactions([...recentTransactions, newTransaction]);

    // Adjust the balance based on whether the amount is credit or debit
    setBalance((prevBalance) => prevBalance + transactionAmount);

    // Send the new transaction to the backend
    fetch("http://localhost:5000/auth/add_transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(newTransaction),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Transaction added:", data);
      })
      .catch((err) => console.error("Error adding transaction", err));

    // Reset form
    setCategory("");
    setAmount("");
    setDate("");
    setIsRecurring(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-white text-center flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">MonXpense</h1>
            <p className="text-xl">Welcome back, User!</p>
          </div>

          {/* Logout Button */}
          <Button
            onClick={() =>
              (window.location.href = "http://localhost:5000/auth/logout")
            }
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Logout
          </Button>
        </header>

        {/* Check if user needs to set total balance */}
        {needsBalance ? (
          <div className="bg-white p-4 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Set Your Total Balance
            </h2>
            <input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="border border-gray-300 p-2 rounded w-full mb-4"
              placeholder="Enter your total balance"
            />
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white w-full"
              onClick={handleSetBalance}
            >
              Set Balance
            </Button>
          </div>
        ) : (
          <>
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Total Balance Card with Add Balance Input and Button */}
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl transition-all duration-300 ease-in-out hover:shadow-2xl">
                  <CardHeader className="text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-green-500" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      Total Balance
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-center text-gray-900">
                      ${balance.toFixed(2)}
                    </p>
                    <div className="mt-4">
                      <input
                        type="number"
                        value={addBalance}
                        onChange={(e) => setAddBalance(e.target.value)}
                        className="p-2 border rounded text-gray-800 w-full mb-4"
                        placeholder="Enter amount to add"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="text-center">
                    <Button
                      onClick={handleAddBalance}
                      className="bg-green-500 hover:bg-green-600 text-white w-full"
                    >
                      Add Balance
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-white/90 backdrop-blur-sm shadow-xl flex flex-col items-center justify-center transition-all duration-300 ease-in-out hover:shadow-2xl">
                  <CardHeader className="text-center">
                    <PieChart className="w-8 h-8 mx-auto text-blue-500" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      This Month
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-center text-gray-900">
                      $
                      {recentTransactions
                        .filter((transaction) => {
                          const transactionDate = new Date(transaction.date);
                          const currentDate = new Date();
                          return (
                            transactionDate.getMonth() ===
                              currentDate.getMonth() &&
                            transactionDate.getFullYear() ===
                              currentDate.getFullYear()
                          );
                        })
                        .reduce(
                          (acc, transaction) => acc + transaction.amount,
                          0,
                        )
                        .toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-sm shadow-xl flex flex-col items-center justify-center transition-all duration-300 ease-in-out hover:shadow-2xl">
                  <CardHeader className="text-center">
                    <Clock className="w-8 h-8 mx-auto text-purple-500" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      Last Transaction
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold text-center text-gray-900">
                      $
                      {recentTransactions[
                        recentTransactions.length - 1
                      ]?.amount.toFixed(2) || 0}
                    </p>
                    <p className="text-sm text-center text-gray-600">
                      {recentTransactions[recentTransactions.length - 1]
                        ?.description || "No Transactions"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Add Transaction Section */}
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl transition-all duration-300 ease-in-out hover:shadow-2xl">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Add New Transaction
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label
                        htmlFor="category"
                        className="text-sm font-semibold text-gray-800"
                      >
                        Category
                      </label>
                      <input
                        id="category"
                        type="text"
                        className="p-2 border rounded"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Enter category (e.g. Food, Salary)"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        htmlFor="amount"
                        className="text-sm font-semibold text-gray-800"
                      >
                        Amount
                      </label>
                      <input
                        id="amount"
                        type="number"
                        className="p-2 border rounded"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        htmlFor="date"
                        className="text-sm font-semibold text-gray-800"
                      >
                        Date
                      </label>
                      <input
                        id="date"
                        type="date"
                        className="p-2 border rounded"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    {/* Toggle Bar for Recurring */}
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="recurring"
                        className="text-sm font-semibold text-gray-800 cursor-pointer"
                        onClick={handleToggle}
                      >
                        Mark as Recurring
                      </label>

                      <div
                        className="relative inline-block w-12 h-6 cursor-pointer"
                        onClick={handleToggle}
                      >
                        <input
                          type="checkbox"
                          id="recurring"
                          className="opacity-0 w-0 h-0"
                          checked={isRecurring}
                          readOnly
                        />
                        <span
                          className={`absolute top-0 left-0 right-0 bottom-0 bg-gray-400 rounded-full transition duration-300 ease-in-out ${isRecurring ? "bg-green-500" : ""}`}
                        ></span>
                        <span
                          className={`absolute left-0 top-0 bottom-0 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out transform ${isRecurring ? "translate-x-6" : ""}`}
                        ></span>
                      </div>
                    </div>

                    {/* Transaction Type Selector */}
                    <div className="flex items-center space-x-4 mb-4">
                      <Button
                        className={`px-4 py-2 rounded ${transactionType === "credit" ? "bg-green-500" : "bg-gray-300"}`}
                        onClick={() => setTransactionType("credit")}
                      >
                        Credit
                      </Button>
                      <Button
                        className={`px-4 py-2 rounded ${transactionType === "debit" ? "bg-red-500" : "bg-gray-300"}`}
                        onClick={() => setTransactionType("debit")}
                      >
                        Debit
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleAddTransaction}
                  >
                    Add Transaction
                  </Button>
                </CardFooter>
              </Card>

              {/* Recent Transactions Section */}
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl transition-all duration-300 ease-in-out hover:shadow-2xl">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Recent Transactions
                  </h2>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <li
                        key={transaction.id}
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            {transaction.date}
                          </p>
                        </div>
                        <span
                          className={`font-bold ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.amount >= 0 ? "+" : ""}
                          {transaction.amount.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    View All Transactions
                  </Button>
                </CardFooter>
              </Card>

              <div className="fixed bottom-6 right-6 flex space-x-4">
                <div className="relative group">
                  <Button
                    className="rounded-full w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transition-all duration-300 ease-in-out group-hover:w-48 flex items-center justify-center overflow-hidden"
                    onClick={() =>
                      (window.location.href = "http://localhost:3000/ai_chat")
                    }
                  >
                    {/* Initially shown small "AI" */}
                    <span className="absolute text-lg group-hover:hidden">
                      AI
                    </span>

                    {/* Centered AI Suggestion when hovered */}
                    <span className="absolute text-sm font-semibold opacity-0 group-hover:opacity-100 group-hover:text-lg transition-all duration-300 ease-in-out">
                      AI Suggestion
                    </span>
                  </Button>
                </div>
              </div>
              <div className="fixed bottom-6 left-6">
                {/* New Button for Pie Chart Page */}
                <div className="relative group">
                  <Button
                    className="rounded-full w-16 h-16 bg-gradient-to-r from-green-500 to-yellow-500 text-white shadow-lg transition-all duration-300 ease-in-out group-hover:w-48 flex items-center justify-center overflow-hidden"
                    onClick={() =>
                      (window.location.href =
                        "http://localhost:3000/visualisations")
                    }
                  >
                    {/* Initially shown small "Pie" */}
                    <span className="absolute text-lg group-hover:hidden">
                      Pie
                    </span>

                    {/* Centered Pie Chart Text when hovered */}
                    <span className="absolute text-sm font-semibold opacity-0 group-hover:opacity-100 group-hover:text-lg transition-all duration-300 ease-in-out">
                      Pie Chart
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calculator, DollarSign, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';
import { Goat } from '../../types';

interface SaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  goat: Goat;
}

interface SaleFormData {
  salePrice: number;
  saleDate: string;
  buyer: string;
  notes: string;
}

export const SaleForm: React.FC<SaleFormProps> = ({ isOpen, onClose, goat }) => {
  const { sellGoat, expenses, caretakers, goats, healthRecords } = useApp();
  const { activeBusiness } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [isProfitLossExpanded, setIsProfitLossExpanded] = useState(false);
  const [isProfitSharingExpanded, setIsProfitSharingExpanded] = useState(false);
  const [profitCalculation, setProfitCalculation] = useState({
    totalExpenses: 0,
    netProfit: 0,
    ownerShare: 0,
    caretakerShare: 0,
    profitMargin: 0
  });

  const caretaker = goat.caretakerId ? caretakers.find(c => c.id === goat.caretakerId) : null;
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SaleFormData>({
    defaultValues: {
      salePrice: 0,
      saleDate: new Date().toISOString().split('T')[0],
      buyer: '',
      notes: ''
    }
  });

  const watchedSalePrice = watch('salePrice');

  // Calculate suggested sale price based on multiple factors
  useEffect(() => {
    const calculateSuggestedPrice = () => {
      const basePrice = goat.purchasePrice;
      const daysSincePurchase = Math.floor((new Date().getTime() - goat.purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthsOnFarm = Math.max(1, Math.floor(daysSincePurchase / 30));
      
      // Care duration adjustment (5% per month, max 50%)
      const careDurationAdjustment = Math.min(0.5, monthsOnFarm * 0.05);
      
      // Weight adjustment (based on current weight vs average for breed)
      const averageWeight = 35; // Average goat weight
      const weightFactor = goat.currentWeight > averageWeight ? 0.1 : goat.currentWeight < (averageWeight * 0.8) ? -0.1 : 0;
      
      // Health factor (assume healthy if no recent health issues)
      const healthFactor = 0.05; // 5% bonus for healthy goats
      
      // Investment recovery (total expenses + 20% margin)
      const goatExpenses = expenses.filter(e => e.goatId === goat.id);
      const totalExpenses = goatExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const investmentRecovery = totalExpenses * 1.2; // 20% margin on expenses
      
      const suggested = basePrice * (1 + careDurationAdjustment + weightFactor + healthFactor) + investmentRecovery;
      setSuggestedPrice(Math.round(suggested));
    };

    calculateSuggestedPrice();
  }, [goat, expenses]);

  // Calculate profit/loss when sale price changes
  useEffect(() => {
    if (watchedSalePrice > 0 && activeBusiness) {
      // Calculate specific expenses for this goat
      const specificExpenses = expenses.filter(e => e.goatId === goat.id).reduce((sum, e) => sum + e.amount, 0);
      
      // Calculate shared expenses (expenses without specific goat assignment)
      const generalExpenses = expenses.filter(e => !e.goatId).reduce((sum, e) => sum + e.amount, 0);
      const activeGoats = goats.filter(g => g.status === 'Active');
      const totalActiveGoats = activeGoats.length;
      const sharedExpensePerGoat = totalActiveGoats > 0 ? generalExpenses / totalActiveGoats : 0;
      
      // Calculate health expenses for this goat
      const healthExpenses = healthRecords.filter(h => h.goatId === goat.id).reduce((sum, h) => sum + h.cost, 0);
      
      const totalExpenses = specificExpenses + sharedExpensePerGoat + healthExpenses;
      const netProfit = watchedSalePrice - goat.purchasePrice - totalExpenses;
      const profitMargin = watchedSalePrice > 0 ? (netProfit / watchedSalePrice) * 100 : 0;

      let ownerShare = netProfit;
      let caretakerShare = 0;

      if (caretaker) {
        // Use actual payment model from business context
        if (activeBusiness.paymentModelType === 'percentage') {
          caretakerShare = (netProfit * activeBusiness.paymentModelAmount) / 100;
        } else {
          // For monthly payment model, caretaker doesn't get profit share
          caretakerShare = 0;
        }
        ownerShare = netProfit - caretakerShare;
      }

      setProfitCalculation({
        totalExpenses,
        netProfit,
        ownerShare,
        caretakerShare,
        profitMargin
      });
    }
  }, [watchedSalePrice, goat, expenses, caretaker, goats, healthRecords, activeBusiness]);

  const onSubmit = async (data: SaleFormData) => {
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    setError(null);

    try {
      await sellGoat(goat.id, Number(data.salePrice), new Date(data.saleDate), data.buyer);
      onClose();
      // No need to reset form as this is a one-time sale operation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const useSuggestedPrice = () => {
    setValue('salePrice', suggestedPrice);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-700 pb-20">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Sell Goat</h2>
            <p className="text-gray-600 dark:text-neutral-400">{goat.tagNumber} - {goat.nickname || 'Unnamed'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-50 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sale Form */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-emerald-900">Suggested Sale Price</h3>
                  <Calculator className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-emerald-700 mb-2">
                  ₹{suggestedPrice.toLocaleString()}
                </div>
                <p className="text-sm text-emerald-600 mb-4">
                  Based on care duration, weight, health, and investment recovery
                </p>
                <button
                  type="button"
                  onClick={useSuggestedPrice}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  Use Suggested Price
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Sale Price (₹) *
                  </label>
                  <input
                    {...register('salePrice', { 
                      required: 'Sale price is required',
                      min: { value: 1, message: 'Price must be greater than 0' }
                    })}
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold"
                    placeholder="Enter sale price"
                  />
                  {errors.salePrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.salePrice.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Sale Date *
                  </label>
                  <input
                    {...register('saleDate', { required: 'Sale date is required' })}
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.saleDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.saleDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Buyer Name
                  </label>
                  <input
                    {...register('buyer')}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter buyer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Additional notes about the sale..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-6 py-3 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !watchedSalePrice}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing Sale...' : 'Complete Sale'}
                  </button>
                </div>
              </form>
            </div>

            {/* Profit/Loss Calculation */}
            <div className="space-y-6">
              {/* Profit/Loss Analysis - Collapsible */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsProfitLossExpanded(!isProfitLossExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Profit/Loss Analysis</h3>
                  </div>
                  {isProfitLossExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>

                <div className={`transition-all duration-300 overflow-hidden ${
                  isProfitLossExpanded ? 'max-h-screen' : 'max-h-0'
                }`}>
                  <div className="p-4 pt-0 border-t border-gray-100">

                    <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Sale Price:</span>
                    <span className="font-semibold text-gray-900">₹{watchedSalePrice?.toLocaleString() || '0'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Purchase Price:</span>
                    <span className="font-semibold text-red-600">-₹{goat.purchasePrice.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Expenses:</span>
                    <span className="font-semibold text-red-600">-₹{profitCalculation.totalExpenses.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">Net Profit/Loss:</span>
                    <span className={`text-xl font-bold ${profitCalculation.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ₹{profitCalculation.netProfit.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Profit Margin:</span>
                    <span className={`font-semibold ${profitCalculation.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {profitCalculation.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Sharing - Collapsible */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsProfitSharingExpanded(!isProfitSharingExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-blue-100/50 transition-colors"
                >
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Profit Sharing</h3>
                  </div>
                  {isProfitSharingExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>

                <div className={`transition-all duration-300 overflow-hidden ${
                  isProfitSharingExpanded ? 'max-h-screen' : 'max-h-0'
                }`}>
                  <div className="p-4 pt-0 border-t border-blue-200">

                    <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700">Owner's Share:</span>
                    <span className={`font-bold text-lg ${profitCalculation.ownerShare >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ₹{profitCalculation.ownerShare.toLocaleString()}
                    </span>
                  </div>
                  
                  {caretaker && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">
                        Caretaker's Share ({activeBusiness?.paymentModelType === 'percentage' ? `${activeBusiness.paymentModelAmount}%` : 'Fixed Monthly'}):
                      </span>
                      <span className={`font-bold text-lg ${profitCalculation.caretakerShare >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{profitCalculation.caretakerShare.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {caretaker && (
                    <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Caretaker:</strong> {caretaker.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Payment Model:</strong> {activeBusiness?.paymentModelType === 'percentage' 
                          ? `${activeBusiness.paymentModelAmount}% profit sharing`
                          : `₹${activeBusiness?.paymentModelAmount} monthly (no profit share)`
                        }
                      </p>
                    </div>
                  )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Investment Summary */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Investment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-neutral-400">Days on Farm:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {Math.floor((new Date().getTime() - goat.purchaseDate.getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-neutral-400">Current Weight:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{goat.currentWeight}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-neutral-400">Breed:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{goat.breed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
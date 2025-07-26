import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calculator, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [profitCalculation, setProfitCalculation] = useState({
    totalExpenses: 0,
    netProfit: 0,
    ownerShare: 0,
    caretakerShare: 0,
    profitMargin: 0
  });

  const caretaker = goat.caretakerId ? caretakers.find(c => c.id === goat.caretakerId) : null;
  
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<SaleFormData>({
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
      const careDurationAdjustment = Math.min(0.5, monthsOnFarm * 0.05);
      const averageWeight = 35;
      const weightFactor = goat.currentWeight > averageWeight ? 0.1 : goat.currentWeight < (averageWeight * 0.8) ? -0.1 : 0;
      const healthFactor = 0.05;
      const goatExpenses = expenses.filter(e => e.goatId === goat.id);
      const totalExpenses = goatExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const investmentRecovery = totalExpenses * 1.2;
      const suggested = basePrice * (1 + careDurationAdjustment + weightFactor + healthFactor) + investmentRecovery;
      setSuggestedPrice(Math.round(suggested));
    };
    calculateSuggestedPrice();
  }, [goat, expenses]);

  // Calculate profit/loss when sale price changes
  useEffect(() => {
    if (watchedSalePrice > 0) {
      const specificExpenses = expenses.filter(e => e.goatId === goat.id).reduce((sum, e) => sum + e.amount, 0);
      const generalExpenses = expenses.filter(e => !e.goatId).reduce((sum, e) => sum + e.amount, 0);
      const activeGoats = goats.filter(g => g.status === 'Active');
      const totalActiveGoats = activeGoats.length;
      const sharedExpensePerGoat = totalActiveGoats > 0 ? generalExpenses / totalActiveGoats : 0;
      const healthExpenses = healthRecords.filter(h => h.goatId === goat.id).reduce((sum, h) => sum + h.cost, 0);
      const totalExpenses = specificExpenses + sharedExpensePerGoat + healthExpenses;
      const netProfit = watchedSalePrice - goat.purchasePrice - totalExpenses;
      const profitMargin = watchedSalePrice > 0 ? (netProfit / watchedSalePrice) * 100 : 0;

      let ownerShare = netProfit;
      let caretakerShare = 0;

      if (caretaker && caretaker.paymentModel.type === 'percentage') {
        caretakerShare = (netProfit * caretaker.paymentModel.amount) / 100;
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
  }, [watchedSalePrice, goat, expenses, caretaker, goats, healthRecords]);

  const onSubmit = async (data: SaleFormData) => {
    setLoading(true);
    setError(null);

    try {
      await sellGoat(goat.id, Number(data.salePrice), new Date(data.saleDate), data.buyer, data.notes);
      reset();
      onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl pb-24 md:pb-8"
        style={{ scrollPaddingBottom: '6rem' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sell Goat</h2>
            <p className="text-gray-600">{goat.tagNumber} - {goat.nickname || 'Unnamed'}</p>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="p-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    onClick={() => { reset(); onClose(); }}
                    disabled={loading}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Profit/Loss Analysis</h3>
                </div>

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

              {/* Profit Sharing */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Profit Sharing</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700">Owner's Share:</span>
                    <span className={`font-bold text-lg ${profitCalculation.ownerShare >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ₹{profitCalculation.ownerShare.toLocaleString()}
                    </span>
                  </div>
                  
                  {caretaker && caretaker.paymentModel.type === 'percentage' && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">
                        Caretaker's Share ({caretaker.paymentModel.amount}%):
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
                        <strong>Payment Model:</strong> {caretaker.paymentModel.type === 'percentage' 
                          ? `${caretaker.paymentModel.amount}% profit sharing`
                          : `₹${caretaker.paymentModel.amount} fixed payment`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Investment Summary */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Investment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days on Farm:</span>
                    <span className="font-medium">
                      {Math.floor((new Date().getTime() - goat.purchaseDate.getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Weight:</span>
                    <span className="font-medium">{goat.currentWeight}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breed:</span>
                    <span className="font-medium">{goat.breed}</span>
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
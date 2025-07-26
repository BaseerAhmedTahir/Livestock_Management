import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useIsMobile } from './useIsMobile'; // Adjust path if needed

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TransactionFormData {
  type: 'Expense';
  goatId: string;
  amount: number;
  date: string;
  description: string;
  category: string;
}

const steps = [
  'Details',
  'Description',
];

const stepFields: (keyof TransactionFormData)[][] = [
  ['category', 'goatId', 'amount', 'date'], // Step 0
  ['description'],                          // Step 1
];

export const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose }) => {
  const { goats, addExpense } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const isMobile = useIsMobile();

  const methods = useForm<TransactionFormData>({
    defaultValues: {
      type: 'Expense',
      goatId: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: 'Feed',
    },
    mode: 'onTouched',
  });

  const { register, handleSubmit, trigger, reset, formState: { errors } } = methods;

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    setError(null);

    try {
      await addExpense({
        goatId: data.goatId || undefined,
        category: data.category as 'Feed' | 'Medicine' | 'Transport' | 'Veterinary' | 'Other',
        amount: Number(data.amount),
        date: new Date(data.date),
        description: data.description,
      });

      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Step navigation
  const nextStep = async () => {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Add Expense</h2>
          <button
            onClick={() => { reset(); onClose(); }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Progress bar for mobile */}
        {isMobile && (
          <div className="flex items-center justify-center gap-2 mt-4 mb-2">
            {steps.map((label, idx) => (
              <div
                key={label}
                className={`h-2 w-8 rounded-full ${idx <= step ? 'bg-emerald-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-4">
            <div className="space-y-6">
              {/* Step 1: Details */}
              {(step === 0 || !isMobile) && (
                <div>
                  <h3 className="font-semibold text-emerald-700 mb-2 text-base">Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <input
                        type="text"
                        value="Expense"
                        disabled
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('category', { required: 'Category is required' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="Feed">Feed</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Transport">Transport</option>
                        <option value="Veterinary">Veterinary</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.category && (
                        <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goat (Optional)
                      </label>
                      <select
                        {...register('goatId')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select Goat (Optional)</option>
                        {goats.map(goat => (
                          <option key={goat.id} value={goat.id}>
                            {goat.tagNumber} - {goat.nickname || 'Unnamed'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('amount', {
                          required: 'Amount is required',
                          min: { value: 1, message: 'Amount must be greater than 0' },
                        })}
                        type="number"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="1000"
                      />
                      {errors.amount && (
                        <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('date', { required: 'Date is required' })}
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      {errors.date && (
                        <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Description */}
              {(step === 1 || !isMobile) && (
                <div>
                  <h3 className="font-semibold text-emerald-700 mb-2 text-base">Description</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Describe the transaction..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step navigation for mobile */}
            {isMobile && (
              <div className="flex justify-between pt-4">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                ) : <div />}
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    {loading ? 'Saving...' : 'Add Expense'}
                  </button>
                )}
              </div>
            )}

            {/* Desktop: show actions at the end */}
            {!isMobile && (
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { reset(); onClose(); }}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {loading ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
};
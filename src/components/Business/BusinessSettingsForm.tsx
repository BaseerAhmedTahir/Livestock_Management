import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBusiness } from '../../context/BusinessContext';
import { Edit3, Save, X, Building2 } from 'lucide-react';

interface BusinessFormData {
  name: string;
  description: string;
  address: string;
  payment_model_type: 'percentage' | 'monthly';
  payment_model_amount: number;
}

export function BusinessSettingsForm() {
  const { activeBusiness, updateBusinessSettings } = useBusiness();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BusinessFormData>();

  // Sync form with activeBusiness changes
  React.useEffect(() => {
    if (activeBusiness) {
      reset({
        name: activeBusiness.name || '',
        description: activeBusiness.description || '',
        address: activeBusiness.address || '',
        payment_model_type: activeBusiness.paymentModelType || 'percentage',
        payment_model_amount: activeBusiness.paymentModelAmount || 15
      });
    }
  }, [activeBusiness, reset]);

  const onSubmit = async (data: BusinessFormData) => {
    if (!activeBusiness) return;

    console.log('Submitting form data:', data);
    setLoading(true);
    try {
      await updateBusinessSettings(activeBusiness.id, {
        name: data.name,
        description: data.description,
        address: data.address,
        payment_model_type: data.payment_model_type,
        payment_model_amount: data.payment_model_amount
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating business:', error);
      alert('Failed to update business settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      name: activeBusiness?.name || '',
      description: activeBusiness?.description || '',
      address: activeBusiness?.address || '',
      payment_model_type: activeBusiness?.paymentModelType || 'percentage',
      payment_model_amount: activeBusiness?.paymentModelAmount || 15
    });
    setIsEditing(false);
  };

  if (!activeBusiness) return null;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-medium transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          Business Settings
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
            Business Name
          </label>
          {isEditing ? (
            <input
              {...register('name', { required: 'Business name is required' })}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-300"
            />
          ) : (
            <p className="text-neutral-900 dark:text-neutral-100 py-2 font-medium">{activeBusiness.name}</p>
          )}
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
            Description
          </label>
          {isEditing ? (
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-300"
            />
          ) : (
            <p className="text-neutral-900 dark:text-neutral-100 py-2 font-medium">{activeBusiness.description || 'No description'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
            Address
          </label>
          {isEditing ? (
            <input
              {...register('address', { required: 'Address is required' })}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-300"
            />
          ) : (
            <p className="text-neutral-900 dark:text-neutral-100 py-2 font-medium">{activeBusiness.address}</p>
          )}
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
            Payment Model
          </label>
          {isEditing ? (
            <select
              {...register('payment_model_type')}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-300"
            >
              <option value="percentage">Percentage</option>
              <option value="monthly">Monthly</option>
            </select>
          ) : (
            <p className="text-neutral-900 dark:text-neutral-100 py-2 font-medium capitalize">{activeBusiness.paymentModelType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
            Payment Amount
          </label>
          {isEditing ? (
            <input
              {...register('payment_model_amount', { 
                required: 'Payment amount is required',
                min: { value: 0, message: 'Amount must be positive' }
              })}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-300"
            />
          ) : (
            <p className="text-neutral-900 dark:text-neutral-100 py-2 font-medium">
              {activeBusiness.paymentModelAmount}
              {activeBusiness.paymentModelType === 'percentage' ? '%' : ' (Monthly)'}
            </p>
          )}
          {errors.payment_model_amount && (
            <p className="text-red-500 text-sm mt-1">{errors.payment_model_amount.message}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
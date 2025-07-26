import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HealthRecord } from '../../types';
import { useIsMobile } from './useIsMobile'; // Adjust path as needed

interface HealthRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  goatId?: string;
  healthRecord?: HealthRecord;
  isEdit?: boolean;
}

interface HealthRecordFormData {
  goatId: string;
  type: 'Vaccination' | 'Illness' | 'Injury' | 'Deworming' | 'Checkup' | 'Reproductive';
  date: string;
  description: string;
  treatment: string;
  veterinarian: string;
  cost: number;
  notes: string;
  status: 'Healthy' | 'Under Treatment' | 'Recovered';
  nextDueDate: string;
}

const steps = [
  'Basic Info',
  'Details',
  'Additional',
];

const stepFields: (keyof HealthRecordFormData)[][] = [
  ['goatId', 'type', 'date', 'status', 'cost'], // Step 0
  ['description'],                              // Step 1
  [],                                           // Step 2 (all optional)
];

export const HealthRecordForm: React.FC<HealthRecordFormProps> = ({
  isOpen,
  onClose,
  goatId,
  healthRecord,
  isEdit = false,
}) => {
  const { goats, addHealthRecord, updateHealthRecord } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const isMobile = useIsMobile();

  const methods = useForm<HealthRecordFormData>({
    defaultValues: healthRecord
      ? {
          goatId: healthRecord.goatId,
          type: healthRecord.type,
          date: healthRecord.date.toISOString().split('T')[0],
          description: healthRecord.description,
          treatment: healthRecord.treatment || '',
          veterinarian: healthRecord.veterinarian || '',
          cost: healthRecord.cost,
          notes: healthRecord.notes || '',
          status: healthRecord.status,
          nextDueDate: healthRecord.nextDueDate?.toISOString().split('T')[0] || '',
        }
      : {
          goatId: goatId || '',
          type: 'Vaccination',
          date: new Date().toISOString().split('T')[0],
          description: '',
          treatment: '',
          veterinarian: '',
          cost: 0,
          notes: '',
          status: 'Healthy',
          nextDueDate: '',
        },
    mode: 'onTouched',
  });

  const { register, handleSubmit, trigger, formState: { errors }, reset } = methods;

  const onSubmit = async (data: HealthRecordFormData) => {
    setLoading(true);
    setError(null);

    try {
      const recordData = {
        goatId: data.goatId,
        type: data.type,
        date: new Date(data.date),
        description: data.description,
        treatment: data.treatment || undefined,
        veterinarian: data.veterinarian || undefined,
        cost: Number(data.cost),
        notes: data.notes || undefined,
        status: data.status,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
      };

      if (isEdit && healthRecord) {
        await updateHealthRecord(healthRecord.id, recordData);
      } else {
        await addHealthRecord(recordData);
      }

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

  // Reset step on open/close
  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg w-full max-w-lg md:max-w-2xl max-h-[95vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Health Record' : 'Add Health Record'}
          </h2>
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
              {/* Step 1: Basic Info */}
              {(step === 0 || !isMobile) && (
                <div>
                  <h3 className="font-semibold text-emerald-700 mb-2 text-base">Basic Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goat <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('goatId', { required: 'Please select a goat' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select Goat</option>
                        {goats.filter(g => g.status === 'Active').map(goat => (
                          <option key={goat.id} value={goat.id}>
                            {goat.tagNumber} - {goat.nickname || 'Unnamed'}
                          </option>
                        ))}
                      </select>
                      {errors.goatId && (
                        <p className="text-red-500 text-xs mt-1">{errors.goatId.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('type', { required: 'Type is required' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="Vaccination">Vaccination</option>
                        <option value="Illness">Illness</option>
                        <option value="Injury">Injury</option>
                        <option value="Deworming">Deworming</option>
                        <option value="Checkup">Checkup</option>
                        <option value="Reproductive">Reproductive</option>
                      </select>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('status', { required: 'Status is required' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="Healthy">Healthy</option>
                        <option value="Under Treatment">Under Treatment</option>
                        <option value="Recovered">Recovered</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('cost', {
                          required: 'Cost is required',
                          min: { value: 0, message: 'Cost must be 0 or greater' },
                        })}
                        type="number"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="500"
                      />
                      {errors.cost && (
                        <p className="text-red-500 text-xs mt-1">{errors.cost.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Next Due Date
                      </label>
                      <input
                        {...register('nextDueDate')}
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {(step === 1 || !isMobile) && (
                <div>
                  <h3 className="font-semibold text-emerald-700 mb-2 text-base">Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Describe the health record..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Additional */}
              {(step === 2 || !isMobile) && (
                <div>
                  <h3 className="font-semibold text-emerald-700 mb-2 text-base">Additional</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Treatment
                      </label>
                      <input
                        {...register('treatment')}
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Treatment given..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Veterinarian
                      </label>
                      <input
                        {...register('veterinarian')}
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Dr. Ahmed Khan"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Additional notes..."
                    />
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
                    {loading ? 'Saving...' : isEdit ? 'Update Record' : 'Add Record'}
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
                  {loading ? 'Saving...' : isEdit ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
};
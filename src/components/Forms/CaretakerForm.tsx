import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Caretaker } from '../../types';

interface CaretakerFormProps {
  isOpen: boolean;
  onClose: () => void;
  caretaker?: Caretaker;
  isEdit?: boolean;
}

interface CaretakerFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  paymentType: 'fixed' | 'percentage';
  paymentAmount: number;
}

export const CaretakerForm: React.FC<CaretakerFormProps> = ({
  isOpen,
  onClose,
  caretaker,
  isEdit = false,
}) => {
  const { addCaretaker, updateCaretaker } = useApp();
  const [selectedImage, setSelectedImage] = React.useState<string>(
    caretaker?.photo || ''
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<CaretakerFormData>({
    mode: 'onChange',
    defaultValues: caretaker
      ? {
          name: caretaker.name,
          phone: caretaker.contactInfo.phone,
          email: caretaker.contactInfo.email || '',
          password: caretaker.loginCredentials?.password || '',
          address: caretaker.contactInfo.address,
          paymentType: caretaker.paymentModel.type,
          paymentAmount: caretaker.paymentModel.amount,
        }
      : {
          name: '',
          phone: '',
          email: '',
          password: '',
          address: '',
          paymentType: 'percentage',
          paymentAmount: 0,
        },
  });

  React.useEffect(() => {
    if (caretaker) {
      reset({
        name: caretaker.name,
        phone: caretaker.contactInfo.phone,
        email: caretaker.contactInfo.email || '',
        password: caretaker.loginCredentials?.password || '',
        address: caretaker.contactInfo.address,
        paymentType: caretaker.paymentModel.type,
        paymentAmount: caretaker.paymentModel.amount,
      });
      setSelectedImage(caretaker.photo || '');
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        password: '',
        address: '',
        paymentType: 'percentage',
        paymentAmount: 0,
      });
      setSelectedImage('');
    }
  }, [caretaker, reset]);

  const paymentType = watch('paymentType');

  // Step management
  const [step, setStep] = React.useState(1);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addSampleImage = () => {
    const sampleImages = [
      'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    ];
    const randomImage =
      sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setSelectedImage(randomImage);
  };

  const onSubmit = (data: CaretakerFormData) => {
    const caretakerData = {
      name: data.name,
      contactInfo: {
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
      },
      paymentModel: {
        type: data.paymentType,
        amount: Number(data.paymentAmount),
      },
      photo: selectedImage || undefined,
      loginCredentials:
        data.email && data.password
          ? {
              email: data.email,
              password: data.password,
              hasAccount: true,
              lastLogin: undefined,
            }
          : undefined,
    };

    if (isEdit && caretaker) {
      updateCaretaker(caretaker.id, caretakerData);
    } else {
      addCaretaker(caretakerData);
    }

    reset();
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  // Validate current step fields before advancing
  const nextStep = async () => {
    let valid = false;
    if (step === 1) {
      // Validate name, phone
      valid = await trigger(['name', 'phone']);
    } else if (step === 2) {
      // Validate email and password (required if either entered)
      // but since both are required, validate both
      valid = await trigger(['email', 'password']);
    } else if (step === 3) {
      // Validate address
      valid = await trigger('address');
    }
    if (valid) setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-md max-h-full overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Caretaker' : 'Add New Caretaker'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-4"
          noValidate
        >
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ahmed Hassan"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  {...register('phone', { required: 'Phone is required' })}
                  type="tel"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+92-300-1234567"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Step 2: Login Info */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required for login credentials',
                    pattern: {
                      value:
                        /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                      message: 'Invalid email format',
                    },
                  })}
                  type="email"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ahmed@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  {...register('password', {
                    required: 'Password is required for login credentials',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type="password"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="At least 6 characters"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  This will be used as login credentials for the caretaker to
                  access the system
                </p>
              </div>
            </>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                {...register('address', { required: 'Address is required' })}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Village Kalar Kahar, Punjab"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Payment & Photo */}
          {step === 4 && (
            <>
              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="h-4 w-4 inline mr-2" />
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={addSampleImage}
                      className="text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      Use Sample Photo
                    </button>
                    {selectedImage && (
                      <button
                        type="button"
                        onClick={() => setSelectedImage('')}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Model *
                </label>
                <select
                  {...register('paymentType', {
                    required: 'Payment type is required',
                  })}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.paymentType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="percentage">Percentage of Profit</option>
                  <option value="fixed">Fixed Amount per Goat</option>
                </select>
                {errors.paymentType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.paymentType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {paymentType === 'percentage'
                    ? 'Percentage (%) *'
                    : 'Amount (₹) *'}
                </label>
                <input
                  {...register('paymentAmount', {
                    required: 'Payment amount is required',
                    min: {
                      value: 1,
                      message: 'Amount must be greater than 0',
                    },
                  })}
                  type="number"
                  step={paymentType === 'percentage' ? 0.1 : 1}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.paymentAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={paymentType === 'percentage' ? '15' : '5000'}
                />
                {errors.paymentAmount && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.paymentAmount.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
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
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {isEdit ? 'Update Caretaker' : 'Add Caretaker'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

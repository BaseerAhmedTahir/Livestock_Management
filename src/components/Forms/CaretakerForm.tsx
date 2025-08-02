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
}

export const CaretakerForm: React.FC<CaretakerFormProps> = ({ 
  isOpen, 
  onClose, 
  caretaker, 
  isEdit = false 
}) => {
  const { addCaretaker, updateCaretaker } = useApp();
  const [selectedImage, setSelectedImage] = React.useState<string>(caretaker?.photo || '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CaretakerFormData>({
    defaultValues: caretaker ? {
      name: caretaker.name,
      phone: caretaker.contactInfo.phone,
      email: caretaker.contactInfo.email || '',
      password: ''
    } : {
      name: '',
      phone: '',
      email: '',
      password: ''
    }
  });

  // Update form when caretaker prop changes
  React.useEffect(() => {
    if (caretaker) {
      reset({
        name: caretaker.name,
        phone: caretaker.contactInfo.phone,
        email: caretaker.contactInfo.email || '',
        password: ''
      });
      setSelectedImage(caretaker.photo || '');
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        password: ''
      });
      setSelectedImage('');
    }
  }, [caretaker, reset]);

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
      'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg'
    ];
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setSelectedImage(randomImage);
  };

  const onSubmit = async (data: CaretakerFormData) => {
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    setError(''); // Clear previous errors
    const caretakerData = {
      name: data.name,
      contactInfo: {
        phone: data.phone,
        email: data.email || undefined
      },
      photo: selectedImage || undefined,
      loginCredentials: !isEdit && data.email && data.password ? {
        email: data.email,
        password: data.password,
        hasAccount: true,
        lastLogin: undefined
      } : undefined
    };

    try {
      if (isEdit && caretaker) {
        await updateCaretaker(caretaker.id, caretakerData);
      } else {
        await addCaretaker(caretakerData);
      }
      
      onClose();
      // Reset form after successful submission and modal close
      setTimeout(() => {
        reset();
        setSelectedImage('');
        setError('');
      }, 100);
    } catch (error) {
      console.error('Error saving caretaker:', error);
      // Extract meaningful error message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      // Don't close the form on error, let user retry
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-neutral-200 dark:border-neutral-700 pb-20">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
            {isEdit ? 'Edit Caretaker' : 'Add New Caretaker'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
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
              Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ahmed Hassan"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              {...register('phone', { required: 'Phone is required' })}
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="+92-300-1234567"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  {...register('email', { required: 'Email is required for login credentials' })}
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="ahmed@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  {...register('password', { 
                    required: 'Password is required for login credentials',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="At least 6 characters"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  This will be used as login credentials for the caretaker to access the system
                </p>
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Caretaker' : 'Add Caretaker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
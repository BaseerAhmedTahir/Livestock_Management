import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Goat } from '../../types';

interface GoatFormProps {
  isOpen: boolean;
  onClose: () => void;
  goat?: Goat;
  isEdit?: boolean;
}

interface GoatFormData {
  tagNumber: string;
  nickname: string;
  breed: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  color: string;
  currentWeight: number;
  purchasePrice: number;
  purchaseDate: string;
  caretakerId: string;
}

export const GoatForm: React.FC<GoatFormProps> = ({ isOpen, onClose, goat, isEdit = false }) => {
  const { addGoat, updateGoat, caretakers } = useApp();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedImages, setSelectedImages] = React.useState<string[]>(goat?.photos || []);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoatFormData>({
    defaultValues: goat ? {
      tagNumber: goat.tagNumber,
      nickname: goat.nickname || '',
      breed: goat.breed,
      gender: goat.gender,
      dateOfBirth: goat.dateOfBirth.toISOString().split('T')[0],
      color: goat.color || '',
      currentWeight: goat.currentWeight,
      purchasePrice: goat.purchasePrice,
      purchaseDate: goat.purchaseDate.toISOString().split('T')[0],
      caretakerId: goat.caretakerId || ''
    } : {
      tagNumber: '',
      nickname: '',
      breed: '',
      gender: 'Male',
      dateOfBirth: '',
      color: '',
      currentWeight: 0,
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      caretakerId: ''
    }
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            if (newImages.length === files.length) {
              setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addSampleImage = () => {
    const sampleImages = [
      'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg',
      'https://images.pexels.com/photos/2647051/pexels-photo-2647051.jpeg',
      'https://images.pexels.com/photos/1459978/pexels-photo-1459978.jpeg',
      'https://images.pexels.com/photos/1459979/pexels-photo-1459979.jpeg'
    ];
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setSelectedImages(prev => [...prev, randomImage].slice(0, 5));
  };

  const onSubmit = async (data: GoatFormData) => {
    setLoading(true);
    setError(null);

    try {
      const goatData = {
        tagNumber: data.tagNumber,
        nickname: data.nickname || undefined,
        breed: data.breed,
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth),
        color: data.color || undefined,
        currentWeight: Number(data.currentWeight),
        purchasePrice: Number(data.purchasePrice),
        purchaseDate: new Date(data.purchaseDate),
        caretakerId: data.caretakerId || undefined,
        photos: selectedImages,
        status: goat?.status || 'Active' as const
      };

      if (isEdit && goat) {
        await updateGoat(goat.id, goatData);
      } else {
        await addGoat(goatData);
      }

      reset();
      setSelectedImages([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Goat' : 'Add New Goat'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Photos (Max 5)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Goat photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedImages.length < 5 && (
                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-emerald-500 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={addSampleImage}
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    Add Sample
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500">
              Upload photos of your goat or use sample images for demo purposes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Number *
              </label>
              <input
                {...register('tagNumber', { required: 'Tag number is required' })}
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="GT001"
              />
              {errors.tagNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.tagNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                {...register('nickname')}
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Breed *
              </label>
              <select
                {...register('breed', { required: 'Breed is required' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select Breed</option>
                <option value="Beetal">Beetal</option>
                <option value="Boer">Boer</option>
                <option value="Kamori">Kamori</option>
                <option value="Barbari">Barbari</option>
                <option value="Dera Din Panah">Dera Din Panah</option>
                <option value="Saanen">Saanen</option>
                <option value="Nubian">Nubian</option>
                <option value="Other">Other</option>
              </select>
              {errors.breed && (
                <p className="text-red-500 text-sm mt-1">{errors.breed.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Weight (kg) *
              </label>
              <input
                {...register('currentWeight', { 
                  required: 'Weight is required',
                  min: { value: 1, message: 'Weight must be greater than 0' }
                })}
                type="number"
                step="0.1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="25.5"
              />
              {errors.currentWeight && (
                <p className="text-red-500 text-sm mt-1">{errors.currentWeight.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price (₹) *
              </label>
              <input
                {...register('purchasePrice', { 
                  required: 'Purchase price is required',
                  min: { value: 1, message: 'Price must be greater than 0' }
                })}
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="30000"
              />
              {errors.purchasePrice && (
                <p className="text-red-500 text-sm mt-1">{errors.purchasePrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date *
              </label>
              <input
                {...register('purchaseDate', { required: 'Purchase date is required' })}
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.purchaseDate && (
                <p className="text-red-500 text-sm mt-1">{errors.purchaseDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caretaker
              </label>
              <select
                {...register('caretakerId')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Select Caretaker</option>
                {caretakers.map(caretaker => (
                  <option key={caretaker.id} value={caretaker.id}>
                    {caretaker.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color/Markings
            </label>
            <input
              {...register('color')}
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Brown and White"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? 'Saving...' : isEdit ? 'Update Goat' : 'Add Goat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
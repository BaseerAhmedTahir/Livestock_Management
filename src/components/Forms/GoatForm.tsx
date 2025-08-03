/* GoatForm.tsx – dark-mode ready 🌗 */
import React, { Fragment, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { v4 as uuidv4 } from 'uuid';
import { useForm } from 'react-hook-form';
import { X, Upload, ImagePlus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { uploadImage, deleteImage } from '../../utils/supabaseStorage';
import { compressImage } from '../../utils/imageCompression';
import { Goat } from '../../types';

/* ─────────────────── Types ─────────────────── */
interface GoatFormProps {
  isOpen: boolean;
  onClose: () => void;
  goat?: Goat;
  isEdit?: boolean;
}

interface GoatImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'compressing' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  supabaseUrl: string | null;
  error: string | null;
}

type GoatFormData = {
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
};

/* ───────────────── Component ───────────────── */
export const GoatForm: React.FC<GoatFormProps> = ({
  isOpen, onClose, goat, isEdit = false,
}) => {
  const { addGoat, updateGoat, caretakers } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GoatImage[]>([]);
  const [showAddAnotherOption, setShowAddAnotherOption] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ────────── React-Hook-Form ────────── */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoatFormData>({
    defaultValues: goat
      ? {
          tagNumber: goat.tagNumber,
          nickname: goat.nickname ?? '',
          breed: goat.breed,
          gender: goat.gender,
          dateOfBirth: goat.dateOfBirth.toISOString().split('T')[0],
          color: goat.color ?? '',
          currentWeight: goat.currentWeight,
          purchasePrice: goat.purchasePrice,
          purchaseDate: goat.purchaseDate.toISOString().split('T')[0],
          caretakerId: goat.caretakerId ?? '',
        }
      : {
          tagNumber: '',
          nickname: '',
          breed: '',
          gender: 'Male',
          dateOfBirth: '',
          color: '',
          currentWeight: 0,
          purchasePrice: 0,
          purchaseDate: new Date().toISOString().split('T')[0],
          caretakerId: '',
        },
  });

  // Initialize images for editing existing goat
  React.useEffect(() => {
    if (goat && isEdit && goat.photos && images.length === 0) {
      const initialImages: GoatImage[] = goat.photos.map(url => ({
        id: uuidv4(),
        file: new File([], url.substring(url.lastIndexOf('/') + 1), { type: 'image/jpeg' }),
        previewUrl: url,
        status: 'uploaded',
        progress: 100,
        supabaseUrl: url,
        error: null,
      }));
      setImages(initialImages);
    } else if (!isEdit && images.length > 0) {
      setImages([]);
    }
  }, [goat, isEdit, isOpen]);

  // Reset form with goat data when editing
  React.useEffect(() => {
    if (isEdit && goat && isOpen) {
      reset({
        tagNumber: goat.tagNumber,
        nickname: goat.nickname ?? '',
        breed: goat.breed,
        gender: goat.gender,
        dateOfBirth: goat.dateOfBirth.toISOString().split('T')[0],
        color: goat.color ?? '',
        currentWeight: goat.currentWeight,
        purchasePrice: goat.purchasePrice,
        purchaseDate: goat.purchaseDate.toISOString().split('T')[0],
        caretakerId: goat.caretakerId ?? '',
      });
    } else if (!isEdit && isOpen) {
      // Reset to default values when adding new goat
      reset({
        tagNumber: '',
        nickname: '',
        breed: '',
        gender: 'Male',
        dateOfBirth: '',
        color: '',
        currentWeight: 0,
        purchasePrice: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        caretakerId: '',
      });
    }
  }, [goat, isEdit, isOpen, reset]);

  /* ────────── Helpers ────────── */
  const openPicker = () => fileRef.current?.click();
  
  const removeImg = async (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (!imageToRemove) return;

    // If image was uploaded to Supabase, delete it
    if (imageToRemove.supabaseUrl && imageToRemove.status === 'uploaded') {
      try {
        await deleteImage(imageToRemove.supabaseUrl);
        console.log('Image deleted from Supabase:', imageToRemove.supabaseUrl);
      } catch (err) {
        console.error('Failed to delete image from Supabase:', err);
      }
    }

    setImages(prev => prev.filter(img => img.id !== id));
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: GoatImage[] = files.map(file => ({
      id: uuidv4(),
      file: file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      supabaseUrl: null,
      error: null,
    }));

    setImages(prev => [...prev, ...newImages].slice(0, 5));

    // Start processing images immediately
    newImages.forEach(async (img) => {
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'compressing' } : i));
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'compressing' } : i));
      try {
        // Compress image more aggressively
        const compressedFile = await compressImage(img.file);
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'uploading' } : i));
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'uploading' } : i));

        if (!user?.id) {
          throw new Error('User not authenticated for image upload.');
        }

        // Upload immediately after compression
        const supabaseUrl = await uploadImage(compressedFile, user.id);
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'uploaded', progress: 100, supabaseUrl: supabaseUrl } : i));
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'uploaded', progress: 100, supabaseUrl: supabaseUrl } : i));
      } catch (err) {
        console.error('Image processing/upload error:', err);
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', error: (err as Error).message || 'Upload failed' } : i));
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', error: (err as Error).message || 'Upload failed' } : i));
      }
    });

    e.target.value = '';
  };

  const addSample = () => {
    const sampleImageUrls = [
      'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/2280547/pexels-photo-2280547.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/1459978/pexels-photo-1459978.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    ];
    const randomUrl = sampleImageUrls[Math.floor(Math.random() * sampleImageUrls.length)];

    const sampleFile = new File([], `sample-${uuidv4()}.jpeg`, { type: 'image/jpeg' });

    const newImage: GoatImage = {
      id: uuidv4(),
      file: sampleFile,
      previewUrl: randomUrl,
      status: 'uploaded',
      progress: 100,
      supabaseUrl: randomUrl,
      error: null,
    };

    setImages(prev => [...prev, newImage].slice(0, 5));
  };

  /* ────────── Submit ────────── */
  const onSubmit = async (d: GoatFormData) => {
    setLoading(true);
    setError(null);
    
    const payload = {
      ...d,
      photos: images
        .filter(img => img.status === 'uploaded' && img.supabaseUrl)
        .map(img => img.supabaseUrl!),
      dateOfBirth: new Date(d.dateOfBirth),
      purchaseDate: new Date(d.purchaseDate),
      currentWeight: +d.currentWeight,
      purchasePrice: +d.purchasePrice,
      status: goat?.status ?? ('Active' as const),
      nickname: d.nickname || undefined,
      color: d.color || undefined,
      caretakerId: d.caretakerId || undefined,
    };
    
    try {
      if (isEdit && goat) {
        await updateGoat(goat.id, payload);
        onClose();
      } else {
        await addGoat(payload);
        setSuccessMessage('Goat added successfully!');
        setShowAddAnotherOption(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnother = () => {
    reset();
    setImages([]);
    setError(null);
    setSuccessMessage(null);
    setShowAddAnotherOption(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    setImages([]);
    setError(null);
    setSuccessMessage(null);
    setShowAddAnotherOption(false);
    onClose();
  };

  // Reset form and images when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      reset();
      setImages([]);
      setError(null);
      setSuccessMessage(null);
      setShowAddAnotherOption(false);
    }
  }, [isOpen, reset]);

  // Check if all images are uploaded
  const allImagesUploaded = images.length === 0 || images.every(img => img.status === 'uploaded');
  const hasUploadingImages = images.some(img => ['pending', 'compressing', 'uploading'].includes(img.status));

  /* ───────────────── View ───────────────── */
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={() => !loading && handleClose()} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 flex items-start justify-center p-4 sm:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="flex w-full max-w-full sm:max-w-2xl flex-col overflow-hidden
                                     rounded-2xl bg-white dark:bg-gray-800 shadow-xl ring-1 
                                     ring-black/5 dark:ring-white/10 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {isEdit ? 'Edit Goat' : 'Add New Goat'}
                </Dialog.Title>
                <button
                  onClick={() => !loading && handleClose()}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-20 space-y-6"
              >
                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/40 px-4 py-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="rounded-lg border border-emerald-300 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                    {successMessage}
                  </div>
                )}

                {/* Photos */}
                <section>
                  <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Photos <span className="font-normal text-gray-400 dark:text-gray-500">(max 5)</span>
                  </h3>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.previewUrl}
                          alt={`Goat ${img.id}`}
                          className="aspect-square w-full object-cover rounded-lg ring-1 ring-gray-200 dark:ring-gray-600"
                        />
                        {/* Status Indicator */}
                        {img.status === 'compressing' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                            <span className="text-white text-xs ml-2">Compressing...</span>
                          </div>
                        )}
                        {img.status === 'uploading' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                            <span className="text-white text-xs ml-2">Uploading...</span>
                          </div>
                        )}
                        {img.status === 'uploaded' && (
                          <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-1">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {img.status === 'error' && (
                          <div className="absolute top-1 right-1 bg-red-500 rounded-full p-1">
                            <XCircle className="h-4 w-4 text-white" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeImg(img.id)}
                          className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-red-500 text-white 
                                     flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <button
                        type="button"
                        onClick={openPicker}
                        className="aspect-square flex flex-col items-center justify-center 
                                   rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 
                                   text-gray-400 dark:text-gray-500 hover:border-emerald-600 hover:text-emerald-600 
                                   dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition"
                      >
                        <Upload size={24} />
                        <span className="mt-1 text-xs">Upload</span>
                      </button>
                    )}
                  </div>

                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">JPG / PNG &lt; 250 KB (auto-compressed)</p>
                    {images.length < 5 && (
                      <button
                        type="button"
                        onClick={addSample}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <ImagePlus size={14} /> Add sample
                      </button>
                    )}
                  </div>

                  {/* Upload Progress Indicator */}
                  {hasUploadingImages && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                          Processing and uploading images... Submit button will appear when ready.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Success indicator when all images uploaded */}
                  {images.length > 0 && allImagesUploaded && !hasUploadingImages && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          All images uploaded successfully! Ready to submit.
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                {/* Fields grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Tag Number *"
                    error={errors.tagNumber?.message}
                    input={<input type="text" placeholder="GT001" {...register('tagNumber', { required: 'Tag number is required' })} />}
                  />
                  <Field label="Nickname" input={<input type="text" placeholder="Optional" {...register('nickname')} />} />
                  <Field
                    label="Breed *"
                    error={errors.breed?.message}
                    input={
                      <select {...register('breed', { required: 'Breed is required' })}>
                        <option value="">Select Breed</option>
                        {['Makhi Cheeni','Rajanpuri','Teddy','Sindhi','Khurasani','Lohani','Beetal','Boer','Kamori','Barbari','Dera Din Panah','Saanen','Nubian','Other'].map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    }
                  />
                  <Field
                    label="Gender *"
                    input={
                      <select {...register('gender', { required: true })}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    }
                  />
                  <Field
                    label="Date of Birth *"
                    error={errors.dateOfBirth?.message}
                    input={<input type="date" {...register('dateOfBirth', { required: true })} />}
                  />
                  <Field
                    label="Current Weight (kg) *"
                    error={errors.currentWeight?.message}
                    input={
                      <input
                        type="number"
                        step="0.1"
                        placeholder="25.5"
                        {...register('currentWeight', {
                          required: 'Required',
                          min: { value: 1, message: 'Weight must be > 0' },
                        })}
                      />
                    }
                  />
                  <Field
                    label="Purchase Price (₹) *"
                    error={errors.purchasePrice?.message}
                    input={
                      <input
                        type="number"
                        placeholder="30000"
                        {...register('purchasePrice', {
                          required: 'Required',
                          min: { value: 1, message: 'Price must be > 0' },
                        })}
                      />
                    }
                  />
                  <Field
                    label="Purchase Date *"
                    error={errors.purchaseDate?.message}
                    input={<input type="date" {...register('purchaseDate', { required: true })} />}
                  />
                  <Field
                    label="Caretaker"
                    input={
                      <select {...register('caretakerId')}>
                        <option value="">Select Caretaker</option>
                        {caretakers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    }
                  />
                </section>

                {/* Color */}
                <Field
                  label="Color / Markings"
                  input={<input type="text" placeholder="Brown & White" {...register('color')} />}
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  {showAddAnotherOption ? (
                    <>
                      <button
                        type="button"
                        onClick={handleAddAnother}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500
                                   px-4 py-2 font-medium text-white"
                      >
                        Add Another Goat
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-200
                                   hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleClose}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-200 
                                   hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !allImagesUploaded || hasUploadingImages}
                        className={`rounded-lg focus:ring-2 focus:ring-emerald-500 px-4 py-2 font-medium text-white transition-all duration-300 ${
                          loading || !allImagesUploaded || hasUploadingImages
                            ? 'bg-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95'
                        }`}
                      >
                        {loading ? 'Saving…' : 
                     hasUploadingImages ? 'Uploading Images...' :
                     !allImagesUploaded ? 'Processing Images...' :
                     isEdit ? 'Update Goat' : 'Add Goat'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

/* ───────────────── Field helper ───────────────── */
type FieldProps = { label: string; error?: string; input: React.ReactNode };
const Field: React.FC<FieldProps> = ({ label, error, input }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {React.isValidElement(input)
      ? React.cloneElement(input, {
          className: clsx(
            'w-full rounded-lg border px-3 py-2',
            'bg-white dark:bg-gray-700',
            'border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500',
            input.props.className
          ),
        })
      : input}
    {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

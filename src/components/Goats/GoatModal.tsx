import React, { useState, useEffect } from 'react';
import { X, Camera, QrCode, Scale, Heart, DollarSign, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Goat } from '../../types';
import { useApp } from '../../context/AppContext';
import { GoatForm } from '../Forms/GoatForm';
import { HealthRecordForm } from '../Forms/HealthRecordForm';
import { WeightRecordForm } from '../Forms/WeightRecordForm';
import { SaleForm } from '../Forms/SaleForm';
import { generateQRCodeDataURL } from '../../utils/qrCode';

const TABS = [
  { id: 'profile', name: 'Profile', icon: QrCode },
  { id: 'health', name: 'Health', icon: Heart },
  { id: 'weight', name: 'Weight', icon: Scale },
  { id: 'financial', name: 'Financial', icon: DollarSign },
];

const MODAL_ANIMATION = {
  initial: { opacity: 0, y: 40, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  exit: { opacity: 0, y: 40, scale: 0.98, transition: { duration: 0.2 } },
};

export const GoatModal = ({ isOpen, onClose, goat }) => {
  const { healthRecords, weightRecords, caretakers, expenses, deleteGoat, goats } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isHealthFormOpen, setIsHealthFormOpen] = useState(false);
  const [isWeightFormOpen, setIsWeightFormOpen] = useState(false);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');

  useEffect(() => {
    if (goat && isOpen) {
      generateQRCodeDataURL(goat.qrCode)
        .then(setQrCodeDataURL)
        .catch(console.error);
    }
  }, [goat, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !goat) return null;

  const goatHealthRecords = healthRecords.filter(hr => hr.goatId === goat.id);
  const goatWeightRecords = weightRecords.filter(wr => wr.goatId === goat.id);
  const caretaker = goat.caretakerId ? caretakers.find(c => c.id === goat.caretakerId) : null;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this goat? This action cannot be undone.')) {
      deleteGoat(goat.id);
      onClose();
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const monthsDiff = (today.getFullYear() - birthDate.getFullYear()) * 12 +
      (today.getMonth() - birthDate.getMonth());
    if (monthsDiff < 12) {
      return `${monthsDiff} months`;
    } else {
      const years = Math.floor(monthsDiff / 12);
      const remainingMonths = monthsDiff % 12;
      return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            {...MODAL_ANIMATION}
            className="relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:w-[95vw] md:w-[700px] lg:w-[900px] bg-white rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-y-auto border border-gray-200"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 border-b border-gray-100 flex items-center justify-between px-4 py-3 sm:px-8 sm:py-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100">
                  <QrCode className="h-6 w-6 text-emerald-600" />
                </span>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {goat.tagNumber}
                  {goat.nickname && <span className="text-gray-500 font-normal">/ {goat.nickname}</span>}
                </h2>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full
                  ${goat.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                    goat.status === 'Sold' ? 'bg-blue-100 text-blue-700' :
                      goat.status === 'Deceased' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                  }`}>
                  {goat.status}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsEditFormOpen(true)}
                  className="p-2 hover:bg-emerald-100 rounded-full transition"
                  aria-label="Edit Goat"
                >
                  <Edit className="h-5 w-5 text-emerald-600" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-100 rounded-full transition"
                  aria-label="Delete Goat"
                >
                  <Trash2 className="h-5 w-5 text-red-500" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  aria-label="Close Modal"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-[56px] sm:top-[72px] z-10 bg-white/95 border-b border-gray-100">
              <nav className="flex overflow-x-auto no-scrollbar">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-3 sm:py-4 text-sm font-medium border-b-2 transition
                        ${activeTab === tab.id
                          ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                          : 'border-transparent text-gray-500 hover:text-emerald-600 hover:bg-gray-50'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                      {activeTab === tab.id && (
                        <motion.span
                          layoutId="tab-underline"
                          className="absolute left-0 right-0 -bottom-1 h-1 rounded bg-emerald-400"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                  >
                    {/* Goat Photo */}
                    <div>
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center shadow-sm border border-gray-200">
                        {goat.photos && goat.photos.length > 0 ? (
                          <img
                            src={goat.photos[0]}
                            alt={`${goat.tagNumber} - ${goat.nickname || 'Unnamed'}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full">
                            <Camera className="h-12 w-12 text-gray-300" />
                            <span className="mt-2 text-gray-400 text-sm">No photo</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Goat Info */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500">Breed</label>
                          <p className="text-base font-semibold text-gray-900">{goat.breed}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Gender</label>
                          <p className="text-base font-semibold text-gray-900">{goat.gender}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Age</label>
                          <p className="text-base font-semibold text-gray-900">{calculateAge(goat.dateOfBirth)}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Current Weight</label>
                          <p className="text-base font-semibold text-gray-900">{goat.currentWeight} kg</p>
                        </div>
                      </div>
                      {goat.color && (
                        <div>
                          <label className="block text-xs text-gray-500">Color/Markings</label>
                          <p className="text-base font-semibold text-gray-900">{goat.color}</p>
                        </div>
                      )}
                      {caretaker && (
                        <div>
                          <label className="block text-xs text-gray-500">Caretaker</label>
                          <p className="text-base font-semibold text-gray-900">{caretaker.name}</p>
                          <p className="text-xs text-gray-500">{caretaker.contactInfo.phone}</p>
                        </div>
                      )}
                      {/* QR Code */}
                      <div className="bg-white rounded-xl p-4 flex flex-col items-center border border-dashed border-gray-200 shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <QrCode className="h-5 w-5 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-600">QR Code</span>
                        </div>
                        {qrCodeDataURL ? (
                          <img src={qrCodeDataURL} alt="QR Code" className="w-24 h-24" />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded" />
                        )}
                        <p className="text-xs text-gray-400 mt-2">Scan to access profile</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'health' && (
                  <motion.div
                    key="health"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Health Records</h3>
                      {goat.status === 'Active' && (
                        <button
                          onClick={() => setIsHealthFormOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      )}
                    </div>
                    {goatHealthRecords.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400">No health records found.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {goatHealthRecords.map((record) => (
                          <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{record.type}</h4>
                              <p className="text-xs text-gray-500">{record.description}</p>
                              <div className="text-xs text-gray-600 space-y-1 mt-1">
                                <p><strong>Date:</strong> {format(record.date, 'MMM dd, yyyy')}</p>
                                {record.treatment && <p><strong>Treatment:</strong> {record.treatment}</p>}
                                {record.veterinarian && <p><strong>Veterinarian:</strong> {record.veterinarian}</p>}
                                <p><strong>Cost:</strong> ₹{record.cost}</p>
                                {record.nextDueDate && (
                                  <p><strong>Next Due:</strong> {format(record.nextDueDate, 'MMM dd, yyyy')}</p>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full
                              ${record.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                                record.status === 'Under Treatment' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                              }`}>
                              {record.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'weight' && (
                  <motion.div
                    key="weight"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Weight Records</h3>
                      {goat.status === 'Active' && (
                        <button
                          onClick={() => setIsWeightFormOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      )}
                    </div>
                    {goatWeightRecords.length === 0 ? (
                      <div className="text-center py-8">
                        <Scale className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400">No weight records found.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {goatWeightRecords.map((record) => (
                          <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 gap-2">
                            <div>
                              <p className="font-medium text-gray-900">{record.weight} kg</p>
                              <p className="text-xs text-gray-500">{format(record.date, 'MMM dd, yyyy')}</p>
                              {record.notes && (
                                <p className="text-xs text-gray-500 italic">{record.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'financial' && (
                  <motion.div
                    key="financial"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    {goat.status === 'Active' && (
                      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 shadow">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-emerald-900 mb-1">Ready to Sell?</h4>
                            <p className="text-emerald-700 text-xs">Complete the sale process with automatic profit/loss calculation.</p>
                          </div>
                          <button
                            onClick={() => setIsSaleFormOpen(true)}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                          >
                            Sell Goat
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow">
                        <h4 className="font-medium text-gray-900 mb-2">Purchase Information</h4>
                        <div className="space-y-1 text-xs">
                          <p><strong>Purchase Price:</strong> ₹{goat.purchasePrice.toLocaleString()}</p>
                          <p><strong>Purchase Date:</strong> {format(goat.purchaseDate, 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      {goat.salePrice && goat.saleDate && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 shadow">
                          <h4 className="font-medium text-blue-900 mb-2">Sale Information</h4>
                          <div className="space-y-1 text-xs">
                            <p><strong>Sale Price:</strong> ₹{goat.salePrice.toLocaleString()}</p>
                            <p><strong>Sale Date:</strong> {format(goat.saleDate, 'MMM dd, yyyy')}</p>
                            <p><strong>Gross Profit:</strong> ₹{(goat.salePrice - goat.purchasePrice).toLocaleString()}</p>
                            {(() => {
                              const specificExpenses = expenses.filter(e => e.goatId === goat.id).reduce((sum, e) => sum + e.amount, 0);
                              const generalExpenses = expenses.filter(e => !e.goatId).reduce((sum, e) => sum + e.amount, 0);
                              const activeGoats = goats.filter(g => g.status === 'Active');
                              const totalActiveGoats = activeGoats.length;
                              const sharedExpensePerGoat = totalActiveGoats > 0 ? generalExpenses / totalActiveGoats : 0;
                              const healthExpenses = healthRecords.filter(h => h.goatId === goat.id).reduce((sum, h) => sum + h.cost, 0);
                              const totalExpenses = specificExpenses + sharedExpensePerGoat + healthExpenses;
                              const netProfit = goat.salePrice - goat.purchasePrice - totalExpenses;
                              return (
                                <>
                                  <p><strong>Total Expenses:</strong> ₹{totalExpenses.toLocaleString()}</p>
                                  <p><strong>Net Profit:</strong> <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>₹{netProfit.toLocaleString()}</span></p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FORMS: Rendered INSIDE the modal, with higher z-index */}
            {isEditFormOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center">
                <GoatForm
                  isOpen={isEditFormOpen}
                  onClose={() => setIsEditFormOpen(false)}
                  goat={goat}
                  isEdit={true}
                />
              </div>
            )}
            {isHealthFormOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center">
                <HealthRecordForm
                  isOpen={isHealthFormOpen}
                  onClose={() => setIsHealthFormOpen(false)}
                  goatId={goat?.id}
                />
              </div>
            )}
            {isWeightFormOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center">
                <WeightRecordForm
                  isOpen={isWeightFormOpen}
                  onClose={() => setIsWeightFormOpen(false)}
                  goatId={goat?.id}
                />
              </div>
            )}
            {isSaleFormOpen && goat && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center">
                <SaleForm
                  isOpen={isSaleFormOpen}
                  onClose={() => setIsSaleFormOpen(false)}
                  goat={goat}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
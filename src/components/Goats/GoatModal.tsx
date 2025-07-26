import React, { useState, useEffect } from 'react';
import { X, Camera, QrCode, Scale, Heart, DollarSign, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Goat } from '../../types';
import { useApp } from '../../context/AppContext';
import { GoatForm } from '../Forms/GoatForm';
import { HealthRecordForm } from '../Forms/HealthRecordForm';
import { WeightRecordForm } from '../Forms/WeightRecordForm';
import { SaleForm } from '../Forms/SaleForm';
import { generateQRCodeDataURL } from '../../utils/qrCode';

interface GoatModalProps {
  isOpen: boolean;
  onClose: () => void;
  goat: Goat | null;
}

export const GoatModal: React.FC<GoatModalProps> = ({ isOpen, onClose, goat }) => {
  const { healthRecords, weightRecords, caretakers, expenses, deleteGoat, goats } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isHealthFormOpen, setIsHealthFormOpen] = useState(false);
  const [isWeightFormOpen, setIsWeightFormOpen] = useState(false);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');

  useEffect(() => {
    if (goat && isOpen) {
      generateQRCodeDataURL(goat.qrCode)
        .then(setQrCodeDataURL)
        .catch(console.error);
    }
  }, [goat, isOpen]);

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

  const tabs = [
    { id: 'profile', name: 'Profile', icon: QrCode },
    { id: 'health', name: 'Health', icon: Heart },
    { id: 'weight', name: 'Weight', icon: Scale },
    { id: 'financial', name: 'Financial', icon: DollarSign },
  ];

  const calculateAge = (dateOfBirth: Date) => {
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
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">{goat.tagNumber} - {goat.nickname}</h2>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                goat.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                goat.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
                goat.status === 'Deceased' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {goat.status}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditFormOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Edit Goat"
              >
                <Edit className="h-5 w-5 text-gray-500" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
                title="Delete Goat"
              >
                <Trash2 className="h-5 w-5 text-red-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4">
                      {goat.photos && goat.photos.length > 0 ? (
                        <img
                          src={goat.photos[0]}
                          alt={`${goat.tagNumber} - ${goat.nickname || 'Unnamed'}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="h-12 w-12 text-gray-400" />
                          <span className="ml-2 text-gray-500">No photo available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Breed</label>
                        <p className="text-lg font-semibold text-gray-900">{goat.breed}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Gender</label>
                        <p className="text-lg font-semibold text-gray-900">{goat.gender}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Age</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {calculateAge(goat.dateOfBirth)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Current Weight</label>
                        <p className="text-lg font-semibold text-gray-900">{goat.currentWeight}kg</p>
                      </div>
                    </div>

                    {goat.color && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Color/Markings</label>
                        <p className="text-lg font-semibold text-gray-900">{goat.color}</p>
                      </div>
                    )}

                    {caretaker && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Caretaker</label>
                        <p className="text-lg font-semibold text-gray-900">{caretaker.name}</p>
                        <p className="text-sm text-gray-600">{caretaker.contactInfo.phone}</p>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <QrCode className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-600">QR Code</span>
                      </div>
                      <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300 text-center">
                        {qrCodeDataURL ? (
                          <img src={qrCodeDataURL} alt="QR Code" className="mx-auto" />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 mx-auto rounded"></div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Scan to access this goat's profile</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'health' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Health Records</h3>
                  {goat.status === 'Active' && (
                    <button 
                      onClick={() => setIsHealthFormOpen(true)}
                      className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </button>
                  )}
                </div>
                
                {goatHealthRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No health records found for this goat.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goatHealthRecords.map((record) => (
                      <div key={record.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{record.type}</h4>
                            <p className="text-sm text-gray-600">{record.description}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.status === 'Healthy' ? 'bg-emerald-100 text-emerald-800' :
                            record.status === 'Under Treatment' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Date:</strong> {format(record.date, 'MMM dd, yyyy')}</p>
                          {record.treatment && <p><strong>Treatment:</strong> {record.treatment}</p>}
                          {record.veterinarian && <p><strong>Veterinarian:</strong> {record.veterinarian}</p>}
                          <p><strong>Cost:</strong> ₹{record.cost}</p>
                          {record.nextDueDate && (
                            <p><strong>Next Due:</strong> {format(record.nextDueDate, 'MMM dd, yyyy')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'weight' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Weight Records</h3>
                  {goat.status === 'Active' && (
                    <button 
                      onClick={() => setIsWeightFormOpen(true)}
                      className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Weight
                    </button>
                  )}
                </div>

                {goatWeightRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Scale className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No weight records found for this goat.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goatWeightRecords.map((record) => (
                      <div key={record.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-gray-900">{record.weight}kg</p>
                          <p className="text-sm text-gray-600">{format(record.date, 'MMM dd, yyyy')}</p>
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600 italic">{record.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                {goat.status === 'Active' && (
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-emerald-900 mb-2">Ready to Sell?</h4>
                        <p className="text-emerald-700 text-sm">
                          Complete the sale process with automatic profit/loss calculation and profit sharing.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsSaleFormOpen(true)}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                      >
                        Sell Goat
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <h4 className="font-medium text-emerald-900 mb-2">Purchase Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Purchase Price:</strong> ₹{goat.purchasePrice.toLocaleString()}</p>
                      <p><strong>Purchase Date:</strong> {format(goat.purchaseDate, 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {goat.salePrice && goat.saleDate && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Sale Information</h4>
                      <div className="space-y-1 text-sm">
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
              </div>
            )}
          </div>
        </div>
      </div>

      <GoatForm
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        goat={goat}
        isEdit={true}
      />

      <HealthRecordForm
        isOpen={isHealthFormOpen}
        onClose={() => setIsHealthFormOpen(false)}
        goatId={goat?.id}
      />

      <WeightRecordForm
        isOpen={isWeightFormOpen}
        onClose={() => setIsWeightFormOpen(false)}
        goatId={goat?.id}
      />

      {goat && (
        <SaleForm
          isOpen={isSaleFormOpen}
          onClose={() => setIsSaleFormOpen(false)}
          goat={goat}
        />
      )}
    </>
  );
};
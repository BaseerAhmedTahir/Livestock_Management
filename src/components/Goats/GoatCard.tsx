import React from 'react';
import { Calendar, Scale, MapPin, QrCode, DollarSign, Eye, Skull, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Goat } from '../../types';

interface GoatCardProps {
  goat: Goat;
  caretakerName: string;
  onViewDetails: () => void;
  onSellGoat: () => void;
  onMarkDeceased: () => void;
}

export const GoatCard: React.FC<GoatCardProps> = ({ goat, caretakerName, onViewDetails, onSellGoat, onMarkDeceased }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800';
      case 'Sold':
        return 'bg-blue-100 text-blue-800';
      case 'Deceased':
        return 'bg-red-100 text-red-800';
      case 'Archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking action buttons
    if ((e.target as HTMLElement).closest('.action-button')) return;
    onViewDetails();
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all"
    >
      <div className="relative">
        <img
          src={goat.photos && goat.photos.length > 0 ? goat.photos[0] : 'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg'}
          alt={`${goat.tagNumber} - ${goat.nickname}`}
          className="w-full h-48 object-cover rounded-t-lg"
          onClick={handleCardClick}
        />
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(goat.status)}`}>
            {goat.status}
          </span>
        </div>
        <div className="absolute top-3 left-3">
          <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
            {goat.tagNumber}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={handleCardClick}
        >
          <h3 className="text-lg font-semibold text-gray-900">{goat.nickname || 'Unnamed'}</h3>
          <QrCode className="h-5 w-5 text-gray-400" />
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{goat.breed} • {goat.gender}</p>
        
        <div 
          className="space-y-2 cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{calculateAge(goat.dateOfBirth)} old</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Scale className="h-4 w-4 mr-2" />
            <span>{goat.currentWeight}kg</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{caretakerName}</span>
          </div>
        </div>

        <div 
          className="mt-4 pt-3 border-t border-gray-100 cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Purchase Price:</span>
            <span className="font-medium text-gray-900">₹{goat.purchasePrice.toLocaleString()}</span>
          </div>
          {goat.salePrice && (
            <>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Sale Price:</span>
                <span className="font-medium text-emerald-600">₹{goat.salePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Gross Profit:</span>
                <span className={`font-medium ${(goat.salePrice - goat.purchasePrice) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ₹{(goat.salePrice - goat.purchasePrice).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={onViewDetails}
              className="action-button flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </button>
            
            {goat.status === 'Active' && (
              <>
                <button
                  onClick={onSellGoat}
                  className="action-button flex-1 flex items-center justify-center px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Sell Goat
                </button>
                
                <button
                  onClick={onMarkDeceased}
                  className="action-button flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  title="Mark as Deceased"
                >
                  <Skull className="h-4 w-4" />
                </button>
              </>
            )}
            
            {goat.status === 'Sold' && (
              <div className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                <DollarSign className="h-4 w-4 mr-1" />
                Sold
              </div>
            )}
            
            {goat.status === 'Deceased' && (
              <div className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-lg">
                <Skull className="h-4 w-4 mr-1" />
                Deceased
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
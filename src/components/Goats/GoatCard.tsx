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
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
    >
      <div className="relative group">
        <img
          src={goat.photos && goat.photos.length > 0 ? goat.photos[0] : 'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg'}
          alt={`${goat.tagNumber} - ${goat.nickname}`}
          className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
          onClick={handleCardClick}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="absolute top-3 right-3 transform transition-transform duration-300 hover:scale-105">
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full shadow-sm ${getStatusColor(goat.status)}`}>
            {goat.status}
          </span>
        </div>
        
        <div className="absolute top-3 left-3 transform transition-transform duration-300 hover:scale-105">
          <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
            {goat.tagNumber}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer group/title"
          onClick={handleCardClick}
        >
          <h3 className="text-lg font-semibold text-gray-900 group-hover/title:text-emerald-600 transition-colors">
            {goat.nickname || 'Unnamed'}
          </h3>
          <QrCode className="h-5 w-5 text-gray-400 group-hover/title:text-emerald-600 transition-colors" />
        </div>
        
        <p className="text-sm text-gray-600 mb-4 font-medium">{goat.breed} • {goat.gender}</p>
        
        <div 
          className="space-y-3 cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors">
            <Calendar className="h-4 w-4 mr-2.5" />
            <span>{calculateAge(goat.dateOfBirth)} old</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors">
            <Scale className="h-4 w-4 mr-2.5" />
            <span>{goat.currentWeight}kg</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors">
            <MapPin className="h-4 w-4 mr-2.5" />
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
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onViewDetails}
              className="action-button flex-1 flex items-center justify-center px-4 py-2.5 bg-gradient-to-r 
                       from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg
                       hover:from-blue-600 hover:to-blue-700 transition-all duration-300
                       shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </button>
            
            {goat.status === 'Active' && (
              <>
                <button
                  onClick={onSellGoat}
                  className="action-button flex-1 flex items-center justify-center px-4 py-2.5
                           bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-lg
                           hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300
                           shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Sell Goat
                </button>
                
                <button
                  onClick={onMarkDeceased}
                  className="action-button flex items-center justify-center px-4 py-2.5
                           bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg
                           hover:from-red-600 hover:to-red-700 transition-all duration-300
                           shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  title="Mark as Deceased"
                >
                  <Skull className="h-4 w-4" />
                </button>
              </>
            )}
            
            {goat.status === 'Sold' && (
              <div className="flex-1 flex items-center justify-center px-4 py-2.5
                            bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-sm font-medium rounded-lg">
                <DollarSign className="h-4 w-4 mr-2" />
                Sold
              </div>
            )}
            
            {goat.status === 'Deceased' && (
              <div className="flex-1 flex items-center justify-center px-4 py-2.5
                            bg-gradient-to-r from-red-50 to-red-100 text-red-600 text-sm font-medium rounded-lg">
                <Skull className="h-4 w-4 mr-2" />
                Deceased
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
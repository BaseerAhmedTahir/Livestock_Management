import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';

interface BulkGoatImportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GoatImportData {
  tagNumber: string;
  nickname?: string;
  breed: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  color?: string;
  currentWeight: number;
  purchasePrice: number;
  purchaseDate: string;
  caretakerId?: string;
}

export const BulkGoatImport: React.FC<BulkGoatImportProps> = ({ isOpen, onClose }) => {
  const { addGoat, caretakers } = useApp();
  const { activeBusiness } = useBusiness();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importData, setImportData] = useState<GoatImportData[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = [
      'tagNumber',
      'nickname',
      'breed',
      'gender',
      'dateOfBirth',
      'color',
      'currentWeight',
      'purchasePrice',
      'purchaseDate',
      'caretakerName'
    ];

    const sampleData = [
      'GT001,Brownie,Beetal,Female,2023-01-15,Brown & White,25.5,30000,2023-01-15,Ahmed Hassan',
      'GT002,Whitey,Boer,Male,2023-02-10,White,28.0,35000,2023-02-10,',
      'GT003,,Sindhi,Female,2023-03-05,Black,22.5,28000,2023-03-05,Ahmed Hassan'
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'goat_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): GoatImportData[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });

      // Find caretaker ID by name
      let caretakerId = undefined;
      if (row.caretakerName) {
        const caretaker = caretakers.find(c => 
          c.name.toLowerCase() === row.caretakerName.toLowerCase()
        );
        caretakerId = caretaker?.id;
      }

      return {
        tagNumber: row.tagNumber,
        nickname: row.nickname || undefined,
        breed: row.breed,
        gender: row.gender as 'Male' | 'Female',
        dateOfBirth: row.dateOfBirth,
        color: row.color || undefined,
        currentWeight: parseFloat(row.currentWeight) || 0,
        purchasePrice: parseFloat(row.purchasePrice) || 0,
        purchaseDate: row.purchaseDate,
        caretakerId
      };
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(uploadedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsed = parseCSV(csvText);
        setImportData(parsed);
        setStep('preview');
      } catch (err) {
        setError('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleImport = async () => {
    if (!importData.length) return;

    setStep('importing');
    setLoading(true);
    setError(null);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const goatData of importData) {
      try {
        await addGoat({
          tagNumber: goatData.tagNumber,
          nickname: goatData.nickname,
          breed: goatData.breed,
          gender: goatData.gender,
          dateOfBirth: new Date(goatData.dateOfBirth),
          color: goatData.color,
          currentWeight: goatData.currentWeight,
          purchasePrice: goatData.purchasePrice,
          purchaseDate: new Date(goatData.purchaseDate),
          caretakerId: goatData.caretakerId,
          photos: [],
          status: 'Active'
        });
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`${goatData.tagNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setLoading(false);
    
    if (errorCount === 0) {
      setSuccess(`Successfully imported ${successCount} goats!`);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } else {
      setError(`Imported ${successCount} goats. ${errorCount} failed:\n${errors.join('\n')}`);
    }
  };

  const resetForm = () => {
    setFile(null);
    setImportData([]);
    setStep('upload');
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
            Bulk Import Goats
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
                  Import Goats from CSV
                </h3>
                <p className="text-gray-600 dark:text-neutral-400 mb-6">
                  Upload a CSV file to add multiple goats at once
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">CSV Format Requirements:</h4>
                <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                  <li>• First row must contain headers</li>
                  <li>• Required columns: tagNumber, breed, gender, dateOfBirth, currentWeight, purchasePrice, purchaseDate</li>
                  <li>• Optional columns: nickname, color, caretakerName</li>
                  <li>• Date format: YYYY-MM-DD (e.g., 2023-01-15)</li>
                  <li>• Gender: Male or Female</li>
                </ul>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV File
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                  Preview Import Data
                </h3>
                <button
                  onClick={() => setStep('upload')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Upload Different File
                </button>
              </div>

              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Found {importData.length} goats to import
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tag</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Breed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Gender</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Weight</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {importData.map((goat, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{goat.tagNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{goat.nickname || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{goat.breed}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{goat.gender}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{goat.currentWeight}kg</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">₹{goat.purchasePrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Import {importData.length} Goats
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
                  Importing Goats...
                </h3>
                <p className="text-gray-600 dark:text-neutral-400">
                  Please wait while we add your goats to the system
                </p>
              </div>

              {success && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <p className="text-green-700 dark:text-green-300">{success}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-700 dark:text-red-300 font-medium">Import completed with errors:</p>
                  </div>
                  <pre className="text-red-600 dark:text-red-400 text-xs whitespace-pre-wrap">{error}</pre>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

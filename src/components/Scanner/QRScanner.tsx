import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, CheckCircle, QrCode } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useApp } from '../../context/AppContext';
import { parseQRCode } from '../../utils/qrCode';

export const QRScanner: React.FC = () => {
  const { goats } = useApp();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [foundGoat, setFoundGoat] = useState<any>(null);

  const startScanner = () => {
    setError(null);
    setScanResult(null);
    setFoundGoat(null);
    setIsScanning(true);

    // Use setTimeout to ensure the DOM element is rendered
    setTimeout(() => {
      const element = document.getElementById("qr-reader");
      if (!element) {
        setError('Scanner element not found. Please try again.');
        setIsScanning(false);
        return;
      }

      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        supportedScanTypes: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false);

      const onScanSuccess = (decodedText: string) => {
        console.log(`QR Code detected: ${decodedText}`);
        setScanResult(decodedText);
        
        // Parse QR code and find matching goat
        const parsed = parseQRCode(decodedText);
        if (parsed && parsed.type === 'GOAT') {
          const matchingGoat = goats.find(g => g.tagNumber === parsed.tagNumber || g.id === parsed.id);
          if (matchingGoat) {
            setFoundGoat(matchingGoat);
          }
        }
        
        // Stop scanning after successful scan
        stopScanner();
      };

      const onScanError = (errorMessage: string) => {
        // Only log actual errors, not "no QR code found" messages
        if (!errorMessage.includes('No QR code found') && 
            !errorMessage.includes('QR code parse error')) {
          console.warn(`QR Code scan error: ${errorMessage}`);
        }
      };

      try {
        scannerRef.current.render(onScanSuccess, onScanError);
      } catch (err) {
        console.error('Failed to start QR scanner:', err);
        setError('Failed to start camera. Please check camera permissions and try again.');
        setIsScanning(false);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error clearing scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const resetScanner = () => {
    stopScanner();
    setScanResult(null);
    setFoundGoat(null);
    setError(null);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Scanner</h2>
        <p className="text-gray-600">Scan QR codes to quickly access goat information</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {!isScanning && !scanResult && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Scan</h3>
            <p className="text-gray-600 mb-6">
              Click the button below to start scanning QR codes. Make sure to allow camera access when prompted.
            </p>
            <button
              onClick={startScanner}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Camera className="h-5 w-5 mr-2" />
              Start Camera
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Camera Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={resetScanner}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scanning for QR Code</h3>
              <p className="text-gray-600 text-sm mb-4">
                Position the QR code within the frame below. The camera will automatically detect and scan it.
              </p>
            </div>
            
            <div className="flex justify-center">
              <div 
                id="qr-reader" 
                className="w-full max-w-md"
                style={{ 
                  border: '2px solid #3b82f6',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              />
            </div>

            <div className="text-center">
              <button
                onClick={stopScanner}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg"
              >
                Stop Scanning
              </button>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Scanned Successfully!</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Scanned Data:</h4>
              <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
                {scanResult}
              </p>
            </div>

            {foundGoat ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">Goat Found!</h4>
                <div className="flex items-center space-x-4">
                  <img
                    src={foundGoat.photos[0] || 'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg'}
                    alt={foundGoat.tagNumber}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h5 className="font-semibold text-green-900">
                      {foundGoat.tagNumber} - {foundGoat.nickname || 'Unnamed'}
                    </h5>
                    <p className="text-green-700 text-sm">{foundGoat.breed} • {foundGoat.gender}</p>
                    <p className="text-green-600 text-sm">Weight: {foundGoat.currentWeight}kg</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                      foundGoat.status === 'Active' ? 'bg-green-100 text-green-800' :
                      foundGoat.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {foundGoat.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">QR Code Scanned</h4>
                <p className="text-yellow-700 text-sm">
                  The QR code was scanned successfully, but no matching goat was found in your inventory.
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={resetScanner}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Scan Another QR Code
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How to Use QR Scanner</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Click "Start Camera" to begin scanning</li>
          <li>• Allow camera access when prompted by your browser</li>
          <li>• Point your camera at a QR code</li>
          <li>• The scanner will automatically detect and process the code</li>
          <li>• If the QR code belongs to one of your goats, detailed information will be displayed</li>
        </ul>
      </div>
    </div>
  );
};
/* ----------------------------------------------------------------
   QRScanner.tsx
   Modern, responsive QR-code scanner for LivestockPro.
----------------------------------------------------------------- */

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import {
  Html5QrcodeScanner,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode';
import clsx from 'clsx';

import { useApp } from '../../context/AppContext';
import { parseQRCode } from '../../utils/qrCode';

/* -------------------------  UI helpers  ------------------------ */

type MsgProps = {
  variant?: 'info' | 'error' | 'success' | 'warning';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};
const MessageBox: React.FC<MsgProps> = ({
  variant = 'info',
  icon,
  children,
  className,
}) => {
  const palette: Record<string, string> = {
    info: 'blue',
    error: 'red',
    success: 'green',
    warning: 'yellow',
  };
  const color = palette[variant] ?? 'gray';
  return (
    <div
      className={clsx(
        `bg-${color}-50 border border-${color}-200 rounded-lg p-4 flex gap-3`,
        className,
      )}
    >
      {icon}
      <div className={clsx(`text-${color}-700 text-sm`)}>{children}</div>
    </div>
  );
};

const ActionButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }
> = ({ icon, children, className, ...rest }) => (
  <button
    {...rest}
    className={clsx(
      'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
      className,
    )}
  >
    {icon}
    {children}
  </button>
);

/* ------------------------  Main component  --------------------- */

export const QRScanner: React.FC = () => {
  /* global state */
  const { goats } = useApp();

  /* refs & local state */
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [foundGoat, setFoundGoat] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ----------------------  scanner helpers  -------------------- */

  const clearScannerInstance = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (err) {
        console.warn('QR-scanner clear error:', err);
      }
      scannerRef.current = null;
    }
  };

  const stopScanner = () => {
    clearScannerInstance();
    setIsScanning(false);
  };

  const resetAll = () => {
    stopScanner();
    setScanResult(null);
    setFoundGoat(null);
    setError(null);
  };

  const startScanner = () => {
    resetAll();
    setIsScanning(true);

    // Allow next tick so #qr-reader is mounted
    setTimeout(() => {
      const container = document.getElementById('qr-reader');
      if (!container) {
        setError('Failed to initialise camera. Please retry.');
        setIsScanning(false);
        return;
      }

      /* ---- init new scanner instance ---- */
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        supportedScanTypes: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      };

      scannerRef.current = new Html5QrcodeScanner('qr-reader', config, false);

      const onSuccess = (decoded: string) => {
        setScanResult(decoded);
        const parsed = parseQRCode(decoded);
        if (parsed?.type === 'GOAT') {
          const match =
            goats.find(
              (g) => g.tagNumber === parsed.tagNumber || g.id === parsed.id,
            ) ?? null;
          setFoundGoat(match);
        }
        stopScanner(); // auto-stop on first success
      };

      const onError = (msg: string) => {
        if (
          !msg.includes('No QR code found') &&
          !msg.includes('QR code parse error')
        ) {
          console.warn('QR-scan error:', msg);
        }
      };

      try {
        scannerRef.current.render(onSuccess, onError);
      } catch (err) {
        console.error(err);
        setError(
          'Unable to access camera — check permissions or try a different device.',
        );
        setIsScanning(false);
      }
    }, 100);
  };

  /* Cleanup on unmount */
  useEffect(() => clearScannerInstance, []);

  /* ---------------------------  UI  ---------------------------- */

  return (
    <section className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Heading */}
      <header>
        <h2 className="text-2xl font-extrabold text-gray-900">
          QR-Code Scanner
        </h2>
        <p className="text-sm text-gray-600">
          Scan a tag to instantly pull up livestock details.
        </p>
      </header>

      {/* Main card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
        {/* 1️⃣ Not scanning yet */}
        {!isScanning && !scanResult && !error && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <QrCode className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-gray-700">
              Ready when you are — tap the button below and grant camera
              permission.
            </p>
            <ActionButton
              onClick={startScanner}
              icon={<Camera className="w-5 h-5" />}
              className="bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-600"
            >
              Start Camera
            </ActionButton>
          </div>
        )}

        {/* 2️⃣ Camera / scanning */}
        {isScanning && (
          <div className="space-y-4 text-center">
            <p className="text-gray-700">
              Point your camera at a QR code. It will scan automatically.
            </p>

            <div className="flex justify-center">
              <div
                id="qr-reader"
                className="w-full max-w-sm aspect-square rounded-lg overflow-hidden ring-2 ring-blue-500"
              />
            </div>

            <ActionButton
              onClick={stopScanner}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400"
            >
              Stop Scanning
            </ActionButton>
          </div>
        )}

        {/* 3️⃣ Error */}
        {error && (
          <MessageBox
            variant="error"
            icon={<AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />}
          >
            <p className="font-medium">Camera Error</p>
            <p>{error}</p>
            <button
              onClick={resetAll}
              className="mt-2 underline text-red-700 hover:text-red-900"
            >
              Try again
            </button>
          </MessageBox>
        )}

        {/* 4️⃣ Result */}
        {scanResult && (
          <div className="space-y-6">
            <MessageBox
              variant="success"
              icon={
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              }
            >
              <p className="font-medium">QR code scanned!</p>
            </MessageBox>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">Raw Data</h4>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto">
                {scanResult}
              </pre>
            </div>

            {foundGoat ? (
              <MessageBox
                variant="success"
                className="flex-col sm:flex-row items-start"
                icon={null}
              >
                <h4 className="font-semibold text-green-900 mb-2">
                  Goat matched!
                </h4>
                <div className="flex gap-4 w-full sm:w-auto">
                  <img
                    src={
                      foundGoat.photos?.[0] ??
                      'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg'
                    }
                    alt={foundGoat.tagNumber}
                    className="w-20 h-20 rounded-md object-cover"
                  />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-800">
                      {foundGoat.tagNumber} – {foundGoat.nickname || 'Unnamed'}
                    </p>
                    <p className="text-gray-600">
                      {foundGoat.breed} • {foundGoat.gender}
                    </p>
                    <p className="text-gray-600">
                      Weight: {foundGoat.currentWeight} kg
                    </p>
                    <span
                      className={clsx(
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                        foundGoat.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : foundGoat.status === 'Sold'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800',
                      )}
                    >
                      {foundGoat.status}
                    </span>
                  </div>
                </div>
              </MessageBox>
            ) : (
              <MessageBox variant="warning">
                No matching goat found in your inventory.
              </MessageBox>
            )}

            <div className="text-center">
              <ActionButton
                onClick={resetAll}
                icon={<RefreshCw className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-600"
              >
                Scan Another
              </ActionButton>
            </div>
          </div>
        )}
      </div>

      {/* Helper tips */}
      <MessageBox variant="info">
        <h4 className="font-semibold text-blue-900 mb-1">
          How to use the scanner
        </h4>
        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-blue-800">
          <li>Tap “Start Camera”, then grant browser permission.</li>
          <li>Hold the QR code steady inside the frame.</li>
          <li>
            The scanner auto-detects the code and displays animal info if
            matched.
          </li>
        </ul>
      </MessageBox>
    </section>
  );
};
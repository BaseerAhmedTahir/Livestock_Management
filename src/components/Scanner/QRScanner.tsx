/* ────────────────────────────────────────────────────────────────────────────
   src/components/Goats/QRScanner.tsx
   ––– Sleek, mobile-first QR scanner with Tailwind 3.x
──────────────────────────────────────────────────────────────────────────── */
import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  AlertCircle,
  CheckCircle,
  QrCode,
  Loader2
} from 'lucide-react';
import {
  Html5QrcodeScanner,
  Html5QrcodeSupportedFormats
} from 'html5-qrcode';

import { useApp } from '../../context/AppContext';
import { parseQRCode } from '../../utils/qrCode';

/* tiny helper for status badge */
const statusStyle = (s: string) =>
  ({
    Active:
      'bg-emerald-600 text-white shadow-sm',
    Sold:
      'bg-sky-600 text-white shadow-sm',
    Deceased:
      'bg-rose-600 text-white shadow-sm'
  }[s] ||
    'bg-neutral-600 text-white shadow-sm');

export const QRScanner: React.FC = () => {
  const { goats } = useApp();

  /* refs + state */
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanData, setScanData] = useState<string | null>(null);
  const [goat, setGoat] = useState<typeof goats[0] | null>(null);

  /* ── controls ── */
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => void 0);
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const reset = () => {
    stopScanner();
    setError(null);
    setScanData(null);
    setGoat(null);
  };

  const startScanner = () => {
    reset();
    setIsScanning(true);

    // give DOM a tick ⏱️
    setTimeout(() => {
      const el = document.getElementById('qr-reader');
      if (!el) return setError('Camera element not found.');

      /* clear any old scanner */
      scannerRef.current?.clear().catch(() => void 0);
      scannerRef.current = null;

      /* config – mobile-first, torch & zoom if supported */
      const cfg = {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        supportedScanTypes: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true }
      };

      scannerRef.current = new Html5QrcodeScanner('qr-reader', cfg, false);

      /* success handler */
      const onSuccess = (txt: string) => {
        setScanData(txt);

        /* find goat by parsed info */
        const parsed = parseQRCode(txt);
        if (parsed?.type === 'GOAT') {
          const match =
            goats.find(g => g.id === parsed.id) ??
            goats.find(g => g.tagNumber === parsed.tagNumber);
          if (match) setGoat(match);
        }
        stopScanner();
      };

      /* lower-level errors are spammy – we filter */
      const onErr = (msg: string) => {
        if (
          !msg.includes('No QR code found') &&
          !msg.includes('QR code parse error')
        )
          console.warn('[qr] ', msg);
      };

      try {
        scannerRef.current.render(onSuccess, onErr);
      } catch (e) {
        console.error(e);
        setError(
          'Unable to access camera. Check permissions and try again.'
        );
        stopScanner();
      }
    }, 80);
  };

  /* cleanup when component unmounts */
  useEffect(() => stopScanner, []);

  /* ──────────────────────────  UI  ────────────────────────── */
  return (
    <section className="space-y-8 pb-24">
      {/* heading */}
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-gradient">
          QR Scanner
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Scan a goat’s QR tag to open its profile instantly
        </p>
      </header>

      {/* card */}
      <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 sm:p-6 shadow-lg backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-800/90 hover:shadow-xl transition-all duration-300">
        {/* idle state */}
        {!isScanning && !scanData && !error && (
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 shadow-lg">
              <QrCode className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Ready to scan
            </h3>
            <p className="max-w-xs text-sm text-neutral-600 dark:text-neutral-400">
              Tap the button, allow camera access, then point to a QR code.
            </p>
            <button
              onClick={startScanner}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Start camera
            </button>
          </div>
        )}

        {/* error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-700 dark:bg-rose-900/30 shadow-inner">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-300" />
              <div className="flex-1">
                <h4 className="font-semibold text-rose-800 dark:text-rose-200">
                  Camera error
                </h4>
                <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                  {error}
                </p>
                <button
                  onClick={reset}
                  className="mt-4 text-sm font-medium text-rose-700 underline decoration-dotted hover:text-rose-900 dark:text-rose-300"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* scanning */}
        {isScanning && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                Scanning…
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Align the QR code inside the frame.
              </p>
            </div>

            <div className="mx-auto max-w-xs overflow-hidden rounded-xl ring-2 ring-primary-500/70">
              <div id="qr-reader" className="aspect-square w-full" />
            </div>

            <div className="text-center">
              <button
                onClick={stopScanner}
                className="btn-outline text-sm px-4 py-2"
              >
                Stop scanning
              </button>
            </div>
          </div>
        )}

        {/* result */}
        {scanData && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 shadow-lg">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                QR scanned!
              </h3>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/40 shadow-inner">
              <h4 className="mb-2 font-medium text-neutral-900 dark:text-neutral-100">
                Raw data
              </h4>
              <pre className="whitespace-pre-wrap break-words rounded bg-white p-2 text-xs dark:bg-neutral-800">
                {scanData}
              </pre>
            </div>

            {/* goat match */}
            {goat ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-900/20 shadow-inner">
                <h4 className="mb-3 font-medium text-emerald-900 dark:text-emerald-300">
                  Goat found
                </h4>
                <div className="flex items-center gap-4">
                  <img
                    src={
                      goat.photos?.[0] ??
                      'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg'
                    }
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                      {goat.tagNumber} – {goat.nickname || 'Unnamed'}
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                      {goat.breed} • {goat.gender}
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      {goat.currentWeight} kg
                    </p>
                    <span
                      className={clsx(
                        'mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        statusStyle(goat.status)
                      )}
                    >
                      {goat.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20 shadow-inner">
                <h4 className="mb-2 font-medium text-amber-900 dark:text-amber-300">
                  No matching goat
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  The QR code data did not match any goat in your inventory.
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={reset}
                className="btn-primary inline-flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Scan another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* tips */}
      <aside className="rounded-xl border border-primary-200 bg-primary-50 p-4 sm:p-5 text-sm leading-relaxed dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-200 shadow-inner">
        <h4 className="mb-2 font-semibold text-primary-900 dark:text-primary-100">
          Tips
        </h4>
        <ul className="list-disc space-y-1 pl-5">
          <li>Tap “Start camera” and grant permission.</li>
          <li>
            Hold the tag steady in good light; autofocus may take a second.
          </li>
          <li>
            Torch and zoom controls appear on supported mobile browsers.
          </li>
          <li>
            Want to print QR tags? Use “Generate QR” inside a goat’s profile.
          </li>
        </ul>
      </aside>
    </section>
  );
};
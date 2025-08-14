/* ────────────────────────────────────────────────────────────────────────────
   src/components/Goats/GoatModal.tsx
──────────────────────────────────────────────────────────────────────────── */
import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Camera,
  QrCode,
  Scale,
  Heart,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  Skull,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

import { Goat } from '../../types';
import { useApp } from '../../context/AppContext';
import { HealthRecordForm } from '../Forms/HealthRecordForm';
import { WeightRecordForm } from '../Forms/WeightRecordForm';
import { SaleForm } from '../Forms/SaleForm';
import { GoatDuplicateForm } from '../Forms/GoatDuplicateForm';
import { generateQRCodeDataURL } from '../../utils/qrCode';

/* ── tiny stateless helpers ─────────────────────────────────────────────── */
const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Active:
      'bg-emerald-600 text-white shadow-sm',
    Sold:
      'bg-sky-600 text-white shadow-sm',
    Deceased:
      'bg-rose-600 text-white shadow-sm'
  };
  const cls =
    map[status ?? ''] ??
    'bg-neutral-600 text-white shadow-sm';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
};

const TabBtn: React.FC<{
  id: string;
  label: string;
  Icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors ${
      isActive
        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
    }`}
  >
    <Icon className="h-4 w-4" /> {label}
  </button>
);

const EmptyState: React.FC<{ icon: React.ElementType; msg: string }> = ({
  icon: Icon,
  msg
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
    <Icon className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
    <p className="text-sm text-neutral-500 dark:text-neutral-400">{msg}</p>
  </div>
);

/* ── Image Slider Component ─────────────────────────────────────────────── */
const ImageSlider: React.FC<{ photos: string[]; tagNumber: string }> = ({ photos, tagNumber }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  // Reset to first image when photos change
  useEffect(() => {
    setCurrentIndex(0);
  }, [photos]);

  if (!photos || photos.length === 0) {
    return (
      <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2 py-10 rounded-xl bg-neutral-100 dark:bg-neutral-700">
        <Camera className="h-12 w-12 text-neutral-400" />
        <p className="text-sm text-neutral-500">No photos available</p>
      </div>
    );
  }

  return (
    <div className="relative group rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-700 min-h-[20rem]">
      {/* Main Image */}
      <div className="relative h-full min-h-[20rem] overflow-hidden">
        <img
          src={photos[currentIndex]}
          alt={`${tagNumber} photo ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-500 ease-in-out"
        />
        
        {/* Image overlay with gradient for better button visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Navigation Buttons - Only show if more than 1 image */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 backdrop-blur-sm"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Image Counter */}
      {photos.length > 1 && (
        <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Dot Indicators - Only show if more than 1 image */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-125 ${
                index === currentIndex
                  ? 'bg-white shadow-lg scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Keyboard navigation hint */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-3 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
            ← → to navigate
          </span>
        </div>
      )}
    </div>
  );
};
/* ── main component ─────────────────────────────────────────────────────── */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  goat: Goat | null;
  onEdit?: (goat: Goat) => void;
}

export const GoatModal: React.FC<Props> = ({ isOpen, onClose, goat, onEdit }) => {
  const {
    healthRecords,
    weightRecords,
    expenses,
    caretakers,
    goats,
    deleteGoat
  } = useApp();

  const [tab, setTab] = useState<
    'profile' | 'health' | 'weight' | 'financial'
  >('profile');

  const [healthOpen, setHealthOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [qr, setQr] = useState('');

  /* generate QR on open */
  useEffect(() => {
    if (goat && isOpen) {
      generateQRCodeDataURL(goat.qrCode)
        .then(setQr)
        .catch(console.error);
    }
  }, [goat, isOpen]);

  /* keyboard navigation for image slider */
  useEffect(() => {
    if (!isOpen || tab !== 'profile') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, tab, onClose]);
  /* derived data */
  const goatHealth = useMemo(
    () => (goat ? healthRecords.filter(r => r.goatId === goat.id) : []),
    [healthRecords, goat]
  );
  const goatWeight = useMemo(
    () => (goat ? weightRecords.filter(r => r.goatId === goat.id) : []),
    [weightRecords, goat]
  );

  const caretaker = useMemo(
    () =>
      goat && goat.caretakerId
        ? caretakers.find(c => c.id === goat.caretakerId)
        : null,
    [goat, caretakers]
  );

  const age = useMemo(() => {
    if (!goat) return '';
    const diff =
      (new Date().getFullYear() -
        new Date(goat.dateOfBirth).getFullYear()) *
        12 +
      new Date().getMonth() -
      new Date(goat.dateOfBirth).getMonth();
    if (diff < 12) return `${diff} mo`;
    const y = Math.floor(diff / 12);
    const m = diff % 12;
    return m ? `${y}y ${m}m` : `${y} years`;
  }, [goat]);

  const money = (n: number) =>
    `PKR ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

  const finance = useMemo(() => {
    if (!goat) return null;
    const specific = expenses
      .filter(e => e.goatId === goat.id)
      .reduce((s, e) => s + e.amount, 0);

    const shared =
      expenses.filter(e => !e.goatId).reduce((s, e) => s + e.amount, 0) /
      (goats.filter(g => g.status === 'Active').length || 1);

    const health = healthRecords
      .filter(h => h.goatId === goat.id)
      .reduce((s, h) => s + h.cost, 0);

    const totalExp = specific + shared + health;
    const gross = (goat.salePrice ?? 0) - goat.purchasePrice;
    return { totalExp, gross, net: gross - totalExp };
  }, [goat, expenses, goats, healthRecords]);

  /* early exit */
  if (!isOpen || !goat) return null;

  /* ── Render ── */
  return (
    <>
      {/* overlay that scrolls if content taller than screen */}
      <div className="fixed inset-0 z-40 overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm sm:p-8">
        <div className="mx-auto w-full max-w-3xl">
          {/* Modal container */}
          <div className="relative flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white/80 shadow-xl dark:border-neutral-700 dark:bg-neutral-800/90">
            {/* HEADER */}
            <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {goat.tagNumber}
                  {goat.nickname && ` – ${goat.nickname}`}
                </h2>
                <StatusBadge status={goat.status} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit?.(goat)}
                  title="Edit"
                  className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <Edit className="h-5 w-5 text-neutral-500 dark:text-neutral-300" />
                </button>

                <button
                  onClick={() => setDuplicateOpen(true)}
                  title="Duplicate"
                  className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <Copy className="h-5 w-5 text-neutral-500 dark:text-neutral-300" />
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Delete this goat?')) {
                      deleteGoat(goat.id);
                      onClose();
                    }
                  }}
                  title="Delete"
                  className="rounded-full p-2 hover:bg-rose-200/60 dark:hover:bg-rose-700/40"
                >
                  <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </button>

                <button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <X className="h-5 w-5 text-neutral-500 dark:text-neutral-300" />
                </button>
              </div>
            </header>

            {/* TABS */}
            <nav className="flex shrink-0 gap-8 overflow-x-auto border-b border-neutral-200 px-6 dark:border-neutral-700">
              {[
                { id: 'profile', label: 'Profile', Icon: QrCode },
                { id: 'health', label: 'Health', Icon: Heart },
                { id: 'weight', label: 'Weight', Icon: Scale },
                { id: 'financial', label: 'Financial', Icon: DollarSign }
              ].map(t => (
                <TabBtn
                  key={t.id}
                  {...t}
                  isActive={tab === (t.id as any)}
                  onClick={() => setTab(t.id as any)}
                />
              ))}
            </nav>

            {/* BODY — independent scroll */}
            <div className="flex-1 overflow-y-auto space-y-8 px-6 py-6 pb-32">
              {/* PROFILE TAB */}
              {tab === 'profile' && (
                <section className="grid gap-6 lg:grid-cols-2">
                  {/* Image Slider */}
                  <div className="rounded-xl overflow-hidden shadow-lg">
                    <ImageSlider photos={goat.photos || []} tagNumber={goat.tagNumber} />
                  </div>

                  {/* Meta data */}
                  <div className="space-y-5 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <p>
                        <span className="text-neutral-500">Breed</span>
                        <br />
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {goat.breed}
                        </span>
                      </p>
                      <p>
                        <span className="text-neutral-500">Gender</span>
                        <br />
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {goat.gender}
                        </span>
                      </p>
                      <p>
                        <span className="text-neutral-500">Age</span>
                        <br />
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {age}
                        </span>
                      </p>
                      <p>
                        <span className="text-neutral-500">Weight</span>
                        <br />
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {goat.currentWeight} kg
                        </span>
                      </p>
                      <p>
                        <span className="text-neutral-500">Purchase Price</span>
                        <br />
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {money(goat.purchasePrice)}
                        </span>
                      </p>
                      {goat.salePrice && (
                        <p>
                          <span className="text-neutral-500">Sale Price</span>
                          <br />
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {money(goat.salePrice)}
                          </span>
                        </p>
                      )}
                    </div>

                    {goat.color && (
                      <p>
                        <span className="text-neutral-500">Colour / markings</span>
                        <br />
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {goat.color}
                        </span>
                      </p>
                    )}

                    {caretaker && (
                      <p>
                        <span className="text-neutral-500">Caretaker</span>
                        <br />
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {caretaker.name}
                        </span>
                        <br />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {caretaker.contactInfo?.phone}
                        </span>
                      </p>
                    )}

                    <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-center dark:border-neutral-600">
                      {qr ? (
                        <img src={qr} alt="QR" className="mx-auto h-32 w-32" />
                      ) : (
                        <div className="mx-auto h-32 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-600" />
                      )}
                      <p className="mt-2 text-xs text-neutral-500">
                        Scan for goat profile
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* HEALTH TAB */}
              {tab === 'health' && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Health Records
                    </h3>
                    {goat.status === 'Active' && (
                      <button
                        onClick={() => setHealthOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-emerald-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    )}
                  </div>

                  {goatHealth.length ? (
                    <ul className="space-y-3">
                      {goatHealth.map(r => (
                        <li
                          key={r.id}
                          className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                {r.type}
                              </h4>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {r.description}
                              </p>
                            </div>
                            <StatusBadge status={r.status} />
                          </div>
                          <div className="mt-2 grid gap-1 text-xs text-neutral-600 dark:text-neutral-400 sm:grid-cols-2">
                            <p>Date: {format(r.date, 'MMM dd, yyyy')}</p>
                            <p>Cost: {money(r.cost)}</p>
                            {r.nextDueDate && (
                              <p>Next: {format(r.nextDueDate, 'MMM dd, yyyy')}</p>
                            )}
                            {r.treatment && <p>Treat: {r.treatment}</p>}
                            {r.veterinarian && <p>Vet: {r.veterinarian}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState icon={Heart} msg="No health records." />
                  )}
                </section>
              )}

              {/* WEIGHT TAB */}
              {tab === 'weight' && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Weight Records
                    </h3>
                    {goat.status === 'Active' && (
                      <button
                        onClick={() => setWeightOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-emerald-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    )}
                  </div>

                  {goatWeight.length ? (
                    <ul className="space-y-3">
                      {goatWeight.map(w => (
                        <li
                          key={w.id}
                          className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/40"
                        >
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                              {w.weight} kg
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {format(w.date, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          {w.notes && (
                            <p className="max-w-[12rem] truncate text-xs italic text-neutral-500 dark:text-neutral-400">
                              {w.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState icon={Scale} msg="No weight records." />
                  )}
                </section>
              )}

              {/* FINANCIAL TAB */}
              {tab === 'financial' && finance && (
                <section className="space-y-6">
                  {goat.status === 'Active' && (
                    <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50 p-6 dark:border-emerald-700 dark:from-emerald-900/20 dark:to-sky-900/20">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="font-semibold text-emerald-900 dark:text-emerald-300">
                            Ready to sell?
                          </h4>
                          <p className="text-sm text-emerald-700 dark:text-emerald-400">
                            Record a sale &amp; auto-calculate profit.
                          </p>
                        </div>
                        <button
                          onClick={() => setSaleOpen(true)}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
                        >
                          Sell goat
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-900/20">
                      <h4 className="mb-2 font-medium text-emerald-900 dark:text-emerald-300">
                        Purchase
                      </h4>
                      <p className="text-sm">Price: {money(goat.purchasePrice)}</p>
                      <p className="text-sm">
                        Date: {format(goat.purchaseDate, 'MMM dd, yyyy')}
                      </p>
                    </div>

                    {goat.salePrice && goat.saleDate && (
                      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-700 dark:bg-sky-900/20">
                        <h4 className="mb-2 font-medium text-sky-900 dark:text-sky-300">
                          Sale
                        </h4>
                        <p className="text-sm">Price: {money(goat.salePrice)}</p>
                        <p className="text-sm">
                          Date: {format(goat.saleDate, 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm">Gross: {money(finance.gross)}</p>
                        <p className="text-sm">Expenses: {money(finance.totalExp)}</p>
                        <p
                          className={`text-sm font-semibold ${
                            finance.net >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          Net: {money(finance.net)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* nested forms (portals / separate modals) */}
      <HealthRecordForm
        isOpen={healthOpen}
        onClose={() => setHealthOpen(false)}
        goatId={goat.id}
      />
      <WeightRecordForm
        isOpen={weightOpen}
        onClose={() => setWeightOpen(false)}
        goatId={goat.id}
      />
      <SaleForm
        isOpen={saleOpen}
        onClose={() => setSaleOpen(false)}
        goat={goat}
      />
      <GoatDuplicateForm
        isOpen={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        sourceGoat={goat}
      />
    </>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   src/components/Goats/GoatCard.tsx
──────────────────────────────────────────────────────────────────────────── */
import React, { useMemo } from 'react';
import {
  Calendar,
  Scale,
  MapPin,
  QrCode,
  DollarSign,
  Eye,
  Skull
} from 'lucide-react';
import { Goat } from '../../types';

/* ╭───────────────────────────────────────────────────────────────────────────╮
   │ Small helpers                                                            │
   ╰───────────────────────────────────────────────────────────────────────────╯ */
const Badge: React.FC<{ label: string; className: string }> = ({
  label,
  className
}) => (
  <span
    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${className}`}
  >
    {label}
  </span>
);

const InfoRow: React.FC<{ icon: React.ElementType; text: string }> = ({
  icon: Icon,
  text
}) => (
  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-700">
      <Icon className="h-4 w-4 text-neutral-500" />
    </span>
    {text}
  </div>
);

/* ╭───────────────────────────────────────────────────────────────────────────╮
   │ GoatCard                                                                 │
   ╰───────────────────────────────────────────────────────────────────────────╯ */
interface Props {
  goat: Goat;
  caretakerName: string;
  onViewDetails: () => void;
  onSellGoat: () => void;
  onMarkDeceased: () => void;
}

export const GoatCard: React.FC<Props> = ({
  goat,
  caretakerName,
  onViewDetails,
  onSellGoat,
  onMarkDeceased
}) => {
  /* status theme */
  const statusStyle = useMemo(() => {
    return {
      Active:
        'bg-emerald-600 text-white ring-emerald-200 shadow-sm',
      Sold:
        'bg-sky-600 text-white ring-sky-200 shadow-sm',
      Deceased:
        'bg-rose-600 text-white ring-rose-200 shadow-sm',
      Archived:
        'bg-neutral-600 text-white ring-neutral-200 shadow-sm'
    }[goat.status]!;
  }, [goat.status]);

  /* age calc */
  const ageLabel = useMemo(() => {
    const today = new Date();
    const dob = new Date(goat.dateOfBirth);
    const months =
      (today.getFullYear() - dob.getFullYear()) * 12 +
      today.getMonth() -
      dob.getMonth();
    if (months < 12) return `${months} mo`;
    const yrs = Math.floor(months / 12);
    const rem = months % 12;
    return rem ? `${yrs}y ${rem}m` : `${yrs} years`;
  }, [goat.dateOfBirth]);

  const gross =
    goat.salePrice !== undefined
      ? goat.salePrice - goat.purchasePrice
      : undefined;

  /* sold / deceased visual modifiers */
  const isInactive = goat.status !== 'Active';

  /* ── render ── */
  return (
    <article className={`group relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isInactive ? 'bg-white/50 dark:bg-neutral-800/50 border-transparent ring-1 ring-neutral-200 dark:ring-neutral-700' : 'bg-white/80 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800'}`}>
      {/* ribbon for sold / deceased */}
      {isInactive && (
        <span
          className={`pointer-events-none absolute left-[-60px] top-4 rotate-[-45deg] select-none bg-opacity-90 px-20 py-1 text-center text-xs font-bold tracking-wide text-white
            ${goat.status === 'Sold' ? 'bg-sky-600' : 'bg-rose-600'}`}
        >
          {goat.status}
        </span>
      )}

      {/* image block */}
      <div className="relative">
        <img
          src={
            goat.photos?.[0] ??
            'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg'
          }
          alt={goat.tagNumber}
          className={`h-40 w-full object-cover transition-transform duration-700 group-hover:scale-110
                      ${isInactive ? 'grayscale-[40%] opacity-80' : ''}`}
          onClick={onViewDetails}
        />

        {/* darken overlay on hover only when active */}
        {!isInactive && (
          <div className="pointer-events-none absolute inset-0 rounded-t-2xl bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}

        {/* tag # */}
        <span className="absolute left-3 top-3 rounded-xl bg-black/70 backdrop-blur-sm px-3 py-1 text-sm font-bold text-white shadow-lg">
          {goat.tagNumber}
        </span>

        {/* status badge (small, bottom-left) */}
        <Badge
          label={goat.status}
          className={`absolute bottom-3 left-3 ring-1 ring-inset shadow-lg ${statusStyle}`}
        />
      </div>

      {/* card body */}
      <div className="space-y-6 p-4 sm:p-5">
        {/* name + qr */}
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={onViewDetails}
        >
          <h3 className="truncate text-lg font-bold text-neutral-900 transition-colors group-hover:text-emerald-600 dark:text-neutral-100 dark:group-hover:text-emerald-400">
            {goat.nickname || 'Unnamed'}
          </h3>
          <QrCode className="h-5 w-5 text-neutral-400 group-hover:text-emerald-500" />
        </div>

        {/* quick info */}
        <div
          className="space-y-3 cursor-pointer"
          onClick={onViewDetails}
        >
          <InfoRow icon={Calendar} text={`${ageLabel} old`} />
          <InfoRow icon={Scale} text={`${goat.currentWeight} kg`} />
          <InfoRow icon={MapPin} text={caretakerName} />
        </div>

        {/* purchase / sale */}
        <div
          className="cursor-pointer space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-700"
          onClick={onViewDetails}
        >
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              Purchase
            </span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              PKR {goat.purchasePrice.toLocaleString()}
            </span>
          </div>

          {goat.salePrice && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Sale
                </span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  PKR {goat.salePrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Gross&nbsp;profit
                </span>
                <span
                  className={`font-semibold ${
                    gross! >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  PKR {gross!.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* actions */}
        <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700 sm:flex-row">
          {/* view */}
          <button
            onClick={onViewDetails}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Eye className="h-4 w-4" />
            View
          </button>

          {/* ACTIVE ACTIONS */}
          {goat.status === 'Active' && (
            <>
              <button
                onClick={onSellGoat}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <DollarSign className="h-4 w-4" />
                Sell
              </button>

              <button
                onClick={onMarkDeceased}
                title="Mark deceased"
                className="flex items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-white shadow transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <Skull className="h-4 w-4" />
              </button>
            </>
          )}

          {/* SOLD / DECEASED STATIC PILL */}
          {goat.status === 'Sold' && (
            <div className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sky-100 px-3 py-2 text-sm font-medium text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-700/40">
              <DollarSign className="h-4 w-4" />
              Sold
            </div>
          )}

          {goat.status === 'Deceased' && (
            <div className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-700/40">
              <Skull className="h-4 w-4" />
              Deceased
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format an amount as a currency string, with a color based on the sign.
 *
 * @example formatAmount(100)
 * <span className="text-green-600">$100.00</span>
 * @example formatAmount(-100)
 * <span className="text-red-600">-$100.00</span>
 * @param {number} amount
 * @returns {JSX.Element}
 */
export const formatAmount = (amount) => {
  return (
    <span className={amount > 0 ? "text-green-600" : "text-red-600"}>
      {formatCurrency(amount)}
    </span>
  );
}

/**
 * Format a date as a string.
 *
 * @example formatDate('2021-01-01')
 * 'Jan 1, 2021'
 *
 * @param {string} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Convert a Python date string to a JavaScript date object.
 *
 * @example dateFromPyDate('2021-01-01')
 * Date(2021, 0, 1)
 * 
 * @param {string} date
 * @returns {Date}
 */
export const dateFromPyDate = (dateString) => {
  if (!dateString) return '-';

  const [year, month] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

export const getDateKey = (dateString) => {
  if (!dateString) return '-';

  const [year, month] = dateString.split('-').map(Number);
  return `${year}-${String(month).padStart(2, '0')}`;
}

Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

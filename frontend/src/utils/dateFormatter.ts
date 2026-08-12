import { useAuthStore } from '../store/useAuthStore';

/**
 * Format a UTC date string/number/Date object into the Warung's configured Timezone (Default: Asia/Jakarta - UTC+7 WIB)
 */
export const formatDateTimeInTimeZone = (
  dateInput: string | number | Date | null | undefined,
  timeZoneOverride?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return '-';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '-';

    const user = useAuthStore.getState().user;
    const timeZone = timeZoneOverride || user?.timeZone || 'Asia/Jakarta';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      ...options,
    };

    return new Intl.DateTimeFormat('id-ID', defaultOptions).format(date);
  } catch {
    return String(dateInput);
  }
};

export const formatDateInTimeZone = (
  dateInput: string | number | Date | null | undefined,
  timeZoneOverride?: string
): string => {
  return formatDateTimeInTimeZone(dateInput, timeZoneOverride, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: undefined,
    minute: undefined,
    second: undefined,
  });
};

export const formatTimeInTimeZone = (
  dateInput: string | number | Date | null | undefined,
  timeZoneOverride?: string
): string => {
  return formatDateTimeInTimeZone(dateInput, timeZoneOverride, {
    year: undefined,
    month: undefined,
    day: undefined,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

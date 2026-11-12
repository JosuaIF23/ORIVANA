import dayjs from '@/utils/dayjs';

interface DateDisplayProps {
  date: string | Date;
  format?: string;
  className?: string;
}

export function DateDisplay({
  date,
  format = 'DD MMM YYYY',
  className = '',
}: DateDisplayProps) {
  return <span className={className}>{dayjs.utc(date).local().format(format)}</span>;
}


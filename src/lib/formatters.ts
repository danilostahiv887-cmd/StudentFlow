export const formatDate = (value: string) => new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
export const formatDateOnly = (value: string) => new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
export const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

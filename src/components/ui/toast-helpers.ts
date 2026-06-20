let toastFn: ((message: string) => void) | null = null;

export function setToastFn(fn: (message: string) => void) {
  toastFn = fn;
}

export function showToast(message: string) {
  toastFn?.(message);
}

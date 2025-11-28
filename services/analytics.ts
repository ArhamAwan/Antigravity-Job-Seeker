// Declare gtag as a global function
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const trackConversion = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      'send_to': 'AW-17760121269/S5VeCJW1hMcbELXj15RC'
    });
    console.log('Conversion event tracked: AW-17760121269/S5VeCJW1hMcbELXj15RC');
  } else {
    console.warn('Google Tag (gtag) not found. Conversion not tracked.');
  }
};

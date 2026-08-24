import { useState, useEffect } from 'react';

const LOGO_STORAGE_KEY = 'b4boat_platform_logo_url';
const FAVICON_STORAGE_KEY = 'b4boat_platform_favicon_url';

export const compressImageBase64 = (base64Str: string, maxWidth = 300, maxHeight = 150): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      return resolve(base64Str);
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png', 0.85));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const getStoredLogoUrl = (): string => {
  try {
    const saved = localStorage.getItem(LOGO_STORAGE_KEY);
    if (saved) return saved;
    const settings = localStorage.getItem('b4boat_admin_system_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.logoUrl) return parsed.logoUrl;
    }
  } catch (e) {}
  return '';
};

export const setStoredLogoUrl = (url: string) => {
  try {
    if (url) {
      localStorage.setItem(LOGO_STORAGE_KEY, url);
    } else {
      localStorage.removeItem(LOGO_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('localStorage quota warning when storing logo:', e);
  }
  try {
    window.dispatchEvent(new CustomEvent('b4boat_logo_changed', { detail: url }));
  } catch (e) {}
};

export const usePlatformLogo = () => {
  const [logoUrl, setLogoUrl] = useState<string>(() => getStoredLogoUrl());

  useEffect(() => {
    const handleLogoChange = (e: any) => {
      if (e.detail !== undefined) {
        setLogoUrl(e.detail);
      } else {
        setLogoUrl(getStoredLogoUrl());
      }
    };

    window.addEventListener('b4boat_logo_changed', handleLogoChange);
    window.addEventListener('storage', handleLogoChange);
    return () => {
      window.removeEventListener('b4boat_logo_changed', handleLogoChange);
      window.removeEventListener('storage', handleLogoChange);
    };
  }, []);

  return logoUrl;
};

// ── FAVICON MANAGEMENT ──────────────────────────────────────────────

export const getStoredFaviconUrl = (): string => {
  try {
    const saved = localStorage.getItem(FAVICON_STORAGE_KEY);
    if (saved) return saved;
    const settings = localStorage.getItem('b4boat_admin_system_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.faviconUrl) return parsed.faviconUrl;
    }
  } catch (e) {}
  return '';
};

export const updateBrowserFavicon = (url: string) => {
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (url) {
      link.href = url;
    } else {
      link.href = '/favicon.ico';
    }
  } catch (e) {}
};

export const setStoredFaviconUrl = (url: string) => {
  try {
    if (url) {
      localStorage.setItem(FAVICON_STORAGE_KEY, url);
    } else {
      localStorage.removeItem(FAVICON_STORAGE_KEY);
    }
    updateBrowserFavicon(url);
    window.dispatchEvent(new CustomEvent('b4boat_favicon_changed', { detail: url }));
  } catch (e) {}
};

export const useFavicon = () => {
  const [faviconUrl, setFaviconUrl] = useState<string>(() => getStoredFaviconUrl());

  useEffect(() => {
    const initialUrl = getStoredFaviconUrl();
    if (initialUrl) {
      updateBrowserFavicon(initialUrl);
    }

    const handleFaviconChange = (e: any) => {
      const url = e.detail !== undefined ? e.detail : getStoredFaviconUrl();
      setFaviconUrl(url);
      updateBrowserFavicon(url);
    };

    window.addEventListener('b4boat_favicon_changed', handleFaviconChange);
    window.addEventListener('storage', handleFaviconChange);
    return () => {
      window.removeEventListener('b4boat_favicon_changed', handleFaviconChange);
      window.removeEventListener('storage', handleFaviconChange);
    };
  }, []);

  return faviconUrl;
};


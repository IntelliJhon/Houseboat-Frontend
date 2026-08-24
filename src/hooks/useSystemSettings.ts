import { useState, useEffect } from 'react';

const APP_NAME_KEY = 'b4boat_platform_app_name';
const DARK_MODE_KEY = 'b4boat_platform_dark_mode';

// ── APP NAME MANAGEMENT ──────────────────────────────────────────

export const getStoredAppName = (): string => {
  try {
    const saved = localStorage.getItem(APP_NAME_KEY);
    if (saved) return saved;
    const settings = localStorage.getItem('b4boat_admin_system_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.appName) return parsed.appName;
    }
  } catch (e) {}
  return 'b4boat';
};

export const setStoredAppName = (name: string) => {
  try {
    const cleanName = name.trim() || 'b4boat';
    localStorage.setItem(APP_NAME_KEY, cleanName);
    document.title = `${cleanName} - Luxury Houseboat Booking Portal`;
    window.dispatchEvent(new CustomEvent('b4boat_app_name_changed', { detail: cleanName }));
  } catch (e) {}
};

export const useAppName = () => {
  const [appName, setAppName] = useState<string>(() => getStoredAppName());

  useEffect(() => {
    const handleNameChange = (e: any) => {
      if (e.detail !== undefined) {
        setAppName(e.detail);
      } else {
        setAppName(getStoredAppName());
      }
    };

    window.addEventListener('b4boat_app_name_changed', handleNameChange);
    window.addEventListener('storage', handleNameChange);
    return () => {
      window.removeEventListener('b4boat_app_name_changed', handleNameChange);
      window.removeEventListener('storage', handleNameChange);
    };
  }, []);

  return appName;
};

// ── DARK MODE MANAGEMENT ──────────────────────────────────────────

export const getStoredDarkMode = (): boolean => {
  try {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) return saved === 'true';
    const settings = localStorage.getItem('b4boat_admin_system_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (typeof parsed.darkMode === 'boolean') return parsed.darkMode;
    }
  } catch (e) {}
  return false;
};

export const applyDarkModeToDOM = (enabled: boolean) => {
  try {
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
};

export const setStoredDarkMode = (enabled: boolean) => {
  try {
    localStorage.setItem(DARK_MODE_KEY, String(enabled));
    applyDarkModeToDOM(enabled);
    window.dispatchEvent(new CustomEvent('b4boat_dark_mode_changed', { detail: enabled }));
  } catch (e) {}
};

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => getStoredDarkMode());

  useEffect(() => {
    const initialMode = getStoredDarkMode();
    applyDarkModeToDOM(initialMode);

    const handleDarkModeChange = (e: any) => {
      const mode = e.detail !== undefined ? Boolean(e.detail) : getStoredDarkMode();
      setDarkMode(mode);
      applyDarkModeToDOM(mode);
    };

    window.addEventListener('b4boat_dark_mode_changed', handleDarkModeChange);
    window.addEventListener('storage', handleDarkModeChange);
    return () => {
      window.removeEventListener('b4boat_dark_mode_changed', handleDarkModeChange);
      window.removeEventListener('storage', handleDarkModeChange);
    };
  }, []);

  return { darkMode, setDarkMode: setStoredDarkMode };
};

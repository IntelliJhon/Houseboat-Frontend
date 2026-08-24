import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'en' | 'es' | 'ml' | 'de' | 'fr';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = 'b4boat_app_language';

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Nav & Admin Menu
    overview: 'Overview',
    verify_vessels: 'Verify Vessels',
    manage_hosts: 'Manage Hosts',
    bookings_ledger: 'Bookings Ledger',
    reports_analytics: 'Reports & Analytics',
    notifications: 'Notifications',
    reviews_trust: 'Reviews & Trust',
    support_center: 'Support Center',
    settings: 'Settings',
    sign_out: 'Sign Out',
    
    // Settings
    platform_settings: 'Platform System Settings',
    general_branding: 'General & Branding',
    pricing_policies: 'Pricing & Policies',
    roles_permissions: 'Roles & Permissions',
    app_name: 'Application Name',
    default_language: 'Default Language',
    save_settings: 'Save Settings',
    reset_default: 'Reset Default',
    export_config: 'Export Configuration',
    system_theme: 'System Theme mode',
    platform_commission: 'Platform Commission %',
    applicable_gst: 'Applicable GST %',
    booking_fee: 'Booking Fee (₹)',
    cancellation_policy: 'Cancellation Policy Framework',
    
    // Dashboard Stats
    total_revenue: 'Total Revenue',
    active_bookings: 'Active Bookings',
    approved_vessels: 'Approved Vessels',
    active_hosts: 'Active Hosts',
    pending_approvals: 'Pending Approvals'
  },
  es: {
    // Nav & Admin Menu
    overview: 'Resumen General',
    verify_vessels: 'Verificar Embarcaciones',
    manage_hosts: 'Gestionar Anfitriones',
    bookings_ledger: 'Libro de Reservas',
    reports_analytics: 'Informes y Analítica',
    notifications: 'Notificaciones',
    reviews_trust: 'Reseñas y Confianza',
    support_center: 'Centro de Soporte',
    settings: 'Configuración',
    sign_out: 'Cerrar Sesión',
    
    // Settings
    platform_settings: 'Configuración del Sistema',
    general_branding: 'General y Marca',
    pricing_policies: 'Precios y Políticas',
    roles_permissions: 'Roles y Permisos',
    app_name: 'Nombre de la Aplicación',
    default_language: 'Idioma Predeterminado',
    save_settings: 'Guardar Configuración',
    reset_default: 'Restablecer',
    export_config: 'Exportar Configuración',
    system_theme: 'Modo de Tema del Sistema',
    platform_commission: 'Comisión de la Plataforma %',
    applicable_gst: 'IVA / Impuesto %',
    booking_fee: 'Tarifa de Reserva (₹)',
    cancellation_policy: 'Política de Cancelación',
    
    // Dashboard Stats
    total_revenue: 'Ingresos Totales',
    active_bookings: 'Reservas Activas',
    approved_vessels: 'Embarcaciones Aprobadas',
    active_hosts: 'Anfitriones Activos',
    pending_approvals: 'Aprobaciones Pendientes'
  },
  ml: {
    // Nav & Admin Menu
    overview: 'അവലോകനം',
    verify_vessels: 'ഹൗസ്ബോട്ടുകൾ പരിശോധിക്കുക',
    manage_hosts: 'ഹോസ്റ്റുകളെ നിയന്ത്രിക്കുക',
    bookings_ledger: 'ബുക്കിംഗ് ലെഡ്ജർ',
    reports_analytics: 'റിപ്പോർട്ടുകളും അനലിറ്റിക്സും',
    notifications: 'അറിയിപ്പുകൾ',
    reviews_trust: 'അഭിപ്രായങ്ങളും വിശ്വാസ്യതയും',
    support_center: 'സപ്പോർട്ട് സെന്റർ',
    settings: 'സെറ്റിംഗ്സ്',
    sign_out: 'സൈൻ ഔട്ട്',
    
    // Settings
    platform_settings: 'പ്ലാറ്റ്ഫോം സിസ്റ്റം സെറ്റിംഗ്സ്',
    general_branding: 'ജനറൽ & ബ്രാൻഡിംഗ്',
    pricing_policies: 'വിലയും നയങ്ങളും',
    roles_permissions: 'പങ്കുകളും അനുമതികളും',
    app_name: 'ആപ്ലിക്കേഷൻ പേര്',
    default_language: 'ഡിഫോൾട്ട് ഭാഷ',
    save_settings: 'സെറ്റിംഗ്സ് സേവ് ചെയ്യുക',
    reset_default: 'റീസെറ്റ് ചെയ്യുക',
    export_config: 'കോൺഫിഗറേഷൻ എക്സ്പോർട്ട് ചെയ്യുക',
    system_theme: 'സിസ്റ്റം തീം മോഡ്',
    platform_commission: 'പ്ലാറ്റ്ഫോം കമ്മീഷൻ %',
    applicable_gst: 'ജിഎസ്ടി %',
    booking_fee: 'ബുക്കിംഗ് ഫീസ് (₹)',
    cancellation_policy: 'ക്യാൻസലേഷൻ പോളിസി',
    
    // Dashboard Stats
    total_revenue: 'ആകെ വരുമാനം',
    active_bookings: 'ആക്ടീവ് ബുക്കിംഗുകൾ',
    approved_vessels: 'അംഗീകൃത ബോട്ടുകൾ',
    active_hosts: 'ആക്ടീവ് ഹോസ്റ്റുകൾ',
    pending_approvals: 'തീർപ്പുകൽപ്പിക്കാത്തവ'
  },
  de: {
    // Nav & Admin Menu
    overview: 'Übersicht',
    verify_vessels: 'Schiffe Überprüfen',
    manage_hosts: 'Gastgeber Verwalten',
    bookings_ledger: 'Buchungsbuch',
    reports_analytics: 'Berichte & Analysen',
    notifications: 'Benachrichtigungen',
    reviews_trust: 'Bewertungen & Vertrauen',
    support_center: 'Support-Center',
    settings: 'Einstellungen',
    sign_out: 'Abmelden',
    
    // Settings
    platform_settings: 'Plattform-Systemeinstellungen',
    general_branding: 'Allgemein & Branding',
    pricing_policies: 'Preise & Richtlinien',
    roles_permissions: 'Rollen & Berechtigungen',
    app_name: 'Anwendungsname',
    default_language: 'Standardsprache',
    save_settings: 'Einstellungen Speichern',
    reset_default: 'Zurücksetzen',
    export_config: 'Konfiguration Exportieren',
    system_theme: 'System-Designmodus',
    platform_commission: 'Plattform-Provision %',
    applicable_gst: 'MwSt. / GST %',
    booking_fee: 'Buchungsgebühr (₹)',
    cancellation_policy: 'Stornierungsbedingungen',
    
    // Dashboard Stats
    total_revenue: 'Gesamteinnahmen',
    active_bookings: 'Aktive Buchungen',
    approved_vessels: 'Genehmigte Schiffe',
    active_hosts: 'Aktive Gastgeber',
    pending_approvals: 'Ausstehende Genehmigungen'
  },
  fr: {
    // Nav & Admin Menu
    overview: 'Aperçu',
    verify_vessels: 'Vérifier les Bateaux',
    manage_hosts: 'Gérer les Hôtes',
    bookings_ledger: 'Registre des Réservations',
    reports_analytics: 'Rapports et Analyses',
    notifications: 'Notifications',
    reviews_trust: 'Avis et Confiance',
    support_center: 'Centre d\'Assistance',
    settings: 'Paramètres',
    sign_out: 'Déconnexion',
    
    // Settings
    platform_settings: 'Paramètres du Système',
    general_branding: 'Général et Image de Marque',
    pricing_policies: 'Tarifs et Politiques',
    roles_permissions: 'Rôles et Autorisations',
    app_name: 'Nom de l\'Application',
    default_language: 'Langue par Défaut',
    save_settings: 'Enregistrer les Paramètres',
    reset_default: 'Réinitialiser',
    export_config: 'Exporter la Configuration',
    system_theme: 'Mode Thème du Système',
    platform_commission: 'Commission Plateforme %',
    applicable_gst: 'TVA / GST %',
    booking_fee: 'Frais de Réservation (₹)',
    cancellation_policy: 'Politique d\'Annulation',
    
    // Dashboard Stats
    total_revenue: 'Revenu Total',
    active_bookings: 'Réservations Actives',
    approved_vessels: 'Bateaux Approuvés',
    active_hosts: 'Hôtes Actifs',
    pending_approvals: 'Approbations en Attente'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as LanguageCode) || 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: string): string => {
    const langDict = translations[language] || translations['en'];
    return langDict[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (k: string) => k
    };
  }
  return context;
};

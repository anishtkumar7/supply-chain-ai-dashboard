import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

const ExportRegistrationContext = createContext(null);

export function ExportRegistrationProvider({ children }) {
  const factoriesRef = useRef({});

  const register = useCallback((moduleId, factory) => {
    factoriesRef.current[moduleId] = factory;
    return () => {
      delete factoriesRef.current[moduleId];
    };
  }, []);

  const getSnapshot = useCallback((moduleId) => {
    const fn = factoriesRef.current[moduleId];
    if (!fn) return null;
    try {
      return fn();
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(() => ({ register, getSnapshot }), [register, getSnapshot]);

  return (
    <ExportRegistrationContext.Provider value={value}>
      {children}
    </ExportRegistrationContext.Provider>
  );
}

export function useExportRegistrationContext() {
  const ctx = useContext(ExportRegistrationContext);
  if (!ctx) {
    throw new Error('useExportRegistrationContext must be used within ExportRegistrationProvider');
  }
  return ctx;
}

/**
 * Registers a factory that returns the latest export snapshot for this route.
 * Snapshot: { rows?, filterNote?, extraSheets?, pdfModel? }
 */
export function useExportRegistration(moduleId, factory) {
  const { register } = useExportRegistrationContext();
  const factoryRef = useRef(factory);
  factoryRef.current = factory;
  useEffect(() => {
    return register(moduleId, () => factoryRef.current());
  }, [moduleId, register]);
}

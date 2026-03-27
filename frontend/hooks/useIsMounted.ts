import { useEffect, useState } from 'react';
import { useResumeStore } from '@/store/useResumeStore';

export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);
  const _hasHydrated = useResumeStore((state) => state._hasHydrated);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted && _hasHydrated;
}

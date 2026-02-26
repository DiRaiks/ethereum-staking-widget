import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToId = (id: string) => {
  const [opened, setOpened] = useState(false);
  const { hash } = useLocation();

  useEffect(() => {
    const hashId = hash.replace('#', '');
    if (hashId === id) {
      setOpened(true);
    }
  }, [hash, id]);

  return { id, opened };
};

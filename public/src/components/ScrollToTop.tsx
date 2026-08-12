import { useEffect } from 'react';
import { useLocation } from 'react_router-dom'; // or 'react-router' depending on your package

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
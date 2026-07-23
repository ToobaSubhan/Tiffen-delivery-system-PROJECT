import { useEffect, useRef, useState } from 'react';

const useScrollReveal = (delay = 0) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    const timeout = window.setTimeout(() => observer.observe(node), delay);
    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [delay]);

  return { ref, visible };
};

export default useScrollReveal;

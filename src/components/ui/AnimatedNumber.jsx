import React, { useEffect, useState } from 'react';

export const AnimatedNumber = ({ value, formatter }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    
    const duration = 600; // 600ms ease-out
    const startTime = performance.now();

    const updateNumber = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease out: 1 - Math.pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const current = start + (end - start) * easeProgress;
      setCurrentValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        setCurrentValue(end);
      }
    };

    requestAnimationFrame(updateNumber);
  }, [value]);

  return <>{formatter ? formatter(currentValue) : currentValue.toFixed(2)}</>;
};

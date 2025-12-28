
import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  precision?: number;
  prefix?: string;
  className?: string;
  isInteger?: boolean;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 2000, 
  precision = 2,
  prefix = "",
  className = "",
  isInteger = false
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    startValueRef.current = displayValue;

    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const current = startValueRef.current + (value - startValueRef.current) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const format = (val: number) => {
    const formatted = isInteger 
      ? Math.round(val).toLocaleString('en-IN')
      : val.toLocaleString('en-IN', {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        });
    return `${prefix}${formatted}`;
  };

  return <span className={className}>{format(displayValue)}</span>;
};

export default AnimatedNumber;

import * as React from 'react';
import { useRef, useImperativeHandle, forwardRef } from 'react';
import { DEFAULTS } from './constants';

type _HolyProgressHandle = {
  start: () => void;
  end: () => void;
  set: (progress: number) => void;
};

/**
 * Custom React hook to manage and return HolyProgress component and its control functions.
 *
 * @returns {Object} An object containing 'start' and 'end' functions, and the 'HolyProgress' component.
 */
export const useHolyProgress = (): {
  start: () => void;
  end: () => void;
  set: (progress: number) => void;
  HolyProgress: React.ForwardRefExoticComponent<
    HolyProgressProps & React.RefAttributes<_HolyProgressHandle>
  >;
} => {
  const ref = useRef<_HolyProgressHandle>(null);

  // eslint-disable-next-line react/display-name
  const HolyProgress = React.memo(
    React.forwardRef<_HolyProgressHandle, HolyProgressProps>(
      (props, forwardedRef) => {
        return <HolyProgressComponent ref={forwardedRef ?? ref} {...props} />;
      },
    ),
  );

  return {
    start: () => ref.current?.start(),
    end: () => ref.current?.end(),
    set: (progress: number) => ref.current?.set(progress),
    HolyProgress,
  };
};

/**
 * Type definition for HolyProgressProps. Defines the properties for the HolyProgressComponent.
 *
 * @typedef {object} HolyProgressProps
 * @property {number} [initialPosition] - Initial position of the progress bar.
 * @property {string} [easing] - CSS easing type for progress animation.
 * @property {number} [speed] - Animation speed in milliseconds.
 * @property {string} [color] - Color of the progress bar.
 * @property {number|string} [height] - Height of the progress bar.
 * @property {number} [zIndex] - Z-index of the progress bar.
 * @property {React.CSSProperties} [style] - Custom CSS styles.
 */
type HolyProgressProps = {
  initialPosition?: number;
  easing?: string;
  speed?: number;
  color?: string;
  height?: number | string;
  zIndex?: number;
  style?: React.CSSProperties;
};

/**
 * HolyProgressComponent, a React forward reference component.
 * Renders a customizable, animatable progress bar.
 *
 * @component
 * @param {HolyProgressProps} props - Props for customizing the progress bar.
 * @param {React.Ref<HolyProgressHandle>} ref - Ref object for the component.
 * @returns {JSX.Element} The rendered progress bar component.
 */
const HolyProgressComponent = forwardRef<
  _HolyProgressHandle,
  HolyProgressProps
>(
  (
    {
      initialPosition = DEFAULTS.initialPosition,
      easing = DEFAULTS.easing,
      speed = DEFAULTS.speed,
      color = DEFAULTS.color,
      height = DEFAULTS.height,
      zIndex = DEFAULTS.zIndex,
      style = {},
    },
    ref,
  ) => {
    const progressRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);

    /**
     * Sets the progress of the progress bar.
     *
     * @param {number} progress - The new progress value.
     */
    const setProgress = (progress: number): void => {
      if (progressRef.current === null) {
        return;
      }

      progressRef.current.style.transform = `translate3d(${
        (-1 + progress) * 100
      }%, 0, 0)`;
    };

    /**
     * Function to calculate the increment for the progress value.
     * Used to create a smooth animation effect.
     *
     * @param {number} status - The current progress status.
     * @returns {number} The calculated increment value.
     */
    // TODO: replace with smoothing func
    const calculateIncrement = (status: number): number => {
      if (status < 0.2) return 0.1;
      if (status < 0.5) return 0.04;
      if (status < 0.8) return 0.02;
      if (status < 0.99) return 0.005;
      return 0;
    };

    /**
     * Function to animate the progress bar using a trickle effect.
     */
    const animateTrickle = (): void => {
      if (progressRef.current?.dataset.progress === undefined) {
        return;
      }

      const currentProgress = parseFloat(progressRef.current.dataset.progress);
      const newProgress = Math.min(
        currentProgress + calculateIncrement(currentProgress),
        1,
      );
      progressRef.current.dataset.progress = String(newProgress);
      setProgress(newProgress);

      if (newProgress < 1) {
        requestRef.current = requestAnimationFrame(animateTrickle);
      }
    };

    /**
     * Triggers a repaint on the specified HTML element.
     * This function is used to ensure that CSS transitions are properly triggered.
     *
     * @param {HTMLElement} obj - The HTML element to repaint.
     */
    const repaint = (obj: HTMLElement): void => {
      void obj.offsetWidth;
    };

    /**
     * The useImperativeHandle hook is used to customize the instance value
     * that is exposed to parent components when using ref. This allows the parent
     * components to invoke the methods on the HolyProgressComponent.
     */
    useImperativeHandle(ref, () => ({
      set: (progress: number) => {
        if (progressRef.current === null) {
          return;
        }
        progressRef.current.dataset.progress = String(progress);
        setProgress(progress);
      },
      start: () => {
        if (progressRef.current === null) {
          return;
        }
        progressRef.current.style.transition = '';
        progressRef.current.style.opacity = '1';
        progressRef.current.dataset.progress = '0';
        setProgress(initialPosition);

        repaint(progressRef.current);

        progressRef.current.style.transition = `${speed}ms ${easing}`;
        requestRef.current = requestAnimationFrame(animateTrickle);
      },
      end: () => {
        if (progressRef.current === null || requestRef.current === null) {
          return;
        }
        progressRef.current.dataset.progress = '0.999';
        setProgress(0.999);

        repaint(progressRef.current);

        setTimeout(() => {
          cancelAnimationFrame(requestRef.current);

          /**
           * this uses direct DOM manipulation instead of React state,
           * as the HolyProgress component can get mounted/unmounted on page transition,
           * causing progressRef.current to be null.
           *
           * TODO: it could be replaced by a css animation, which then requires a style sheet
           */
          const holyProgress = document.getElementById('holy-progress');
          if (holyProgress !== null) {
            holyProgress.style.opacity = '0';
          }
        }, speed);
      },
    }));

    const barStyle = {
      position: 'fixed' as 'fixed',
      top: 0,
      left: 0,
      zIndex,
      height,
      width: '100%',
      transition: `${speed}ms ${easing}`,
      opacity: 1,
      backgroundColor: color ?? '#fff',
      ...style,
    };

    return <div ref={progressRef} style={barStyle} id="holy-progress" />;
  },
);

HolyProgressComponent.displayName = 'HolyProgressComponent';
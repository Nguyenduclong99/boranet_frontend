import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

const Popover = ({
  children,
  content,
  className,
  trigger = 'click', // 'click' | 'hover'
  placement = 'bottom', // 'top' | 'bottom' | 'left' | 'right'
  offset = 8, // khoảng cách giữa popover và trigger
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  trigger?: 'click' | 'hover';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const handleOpen = useCallback(() => {
    if (trigger === 'hover') {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      openTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, 100);
    }
    else {
      setIsOpen(true);
    }

  }, [trigger]);

  const handleClose = useCallback(() => {
    if (trigger === 'hover') {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 100);
    }
    else {
      setIsOpen(false);
    }
  }, [trigger]);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Tính toán vị trí của popover
  const getPopoverPosition = useCallback(() => {
    if (!containerRef.current || !contentRef.current) {
      return { top: 0, left: 0 };
    }

    const triggerRect = containerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - contentRect.height - offset;
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        left = triggerRect.left - contentRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        left = triggerRect.right + offset;
        break;
      default:
        top = triggerRect.bottom + offset;
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
    }

    // Đảm bảo popover không bị tràn ra ngoài màn hình (tối giản)
    if (left < 0) left = 10;
    if (top < 0) top = 10;

    return { top: Math.round(top), left: Math.round(left) };
  }, [placement, offset]);

  const position = getPopoverPosition();

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={trigger === 'hover' ? handleOpen : undefined}
      onMouseLeave={trigger === 'hover' ? handleClose : undefined}
    >
      <div
        onClick={trigger === 'click' ? toggleOpen : undefined}
        className="cursor-pointer"
      >
        {children}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 100,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={cn(
              "bg-white border rounded-md shadow-lg",
              "min-w-[200px]", // Đặt chiều rộng tối thiểu
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Popover;
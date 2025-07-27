"use client";

import { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "./button";

interface ImageViewerProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageViewer({ src, alt = "", isOpen, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      // 배경 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      // 배경 스크롤 복원
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 컨트롤 버튼들 */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          onClick={(e) => {
            e.stopPropagation();
            handleRotate();
          }}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
        >
          초기화
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 줌 레벨 표시 */}
      <div className="absolute top-4 left-4 bg-white/20 text-white px-3 py-1 rounded text-sm">
        {Math.round(scale * 100)}%
      </div>

      {/* 이미지 */}
      <div 
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className={`max-w-full max-h-full object-contain select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          draggable={false}
        />
      </div>

      {/* 모바일용 제스처 안내 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center md:hidden">
        이미지를 터치해서 확대/축소하고 드래그해서 이동하세요
      </div>
    </div>
  );
}
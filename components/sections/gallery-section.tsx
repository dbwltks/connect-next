import React from 'react';
import { Section } from '@/components/admin/section-manager';

interface GallerySectionProps {
  section: Section;
  className?: string;
}

// 갤러리 섹션: 이미지 썸네일 그리드 예시
export default function GallerySection({ section, className = '' }: GallerySectionProps) {
  // 샘플 이미지 데이터
  const images = [
    { url: '/sample/gallery1.jpg', title: '갤러리 1' },
    { url: '/sample/gallery2.jpg', title: '갤러리 2' },
    { url: '/sample/gallery3.jpg', title: '갤러리 3' },
    { url: '/sample/gallery4.jpg', title: '갤러리 4' },
  ];

  return (
    <section className={`mb-8 ${className}`}>
      <h2 className="text-2xl font-bold mb-2">{section.title || '갤러리'}</h2>
      <p className="text-muted-foreground mb-4">{section.description || '사진 갤러리입니다.'}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img, i: any) => (
          <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden shadow">
            <img src={img.url} alt={img.title} className="object-cover w-full h-full" />
            <div className="text-center text-xs mt-1">{img.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

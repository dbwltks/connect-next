"use client";

import { useEffect } from 'react';

export default function HideHeader() {
  useEffect(() => {
    // 기존 헤더와 푸터를 숨김
    const header = document.querySelector('body > div > header');
    const footer = document.querySelector('body > div > footer');
    
    if (header) {
      header.setAttribute('style', 'display: none !important');
    }
    
    if (footer) {
      footer.setAttribute('style', 'display: none !important');
    }
    
    // 컴포넌트가 언마운트될 때 원래대로 복원
    return () => {
      if (header) {
        header.removeAttribute('style');
      }
      
      if (footer) {
        footer.removeAttribute('style');
      }
    };
  }, []);
  
  return null;
}

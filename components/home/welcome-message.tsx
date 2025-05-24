"use client";

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface WelcomeMessageProps {
  churchInfo: any;
}

export default function WelcomeMessage({ churchInfo }: WelcomeMessageProps) {
  // 교회 정보가 없을 경우 기본값 사용
  const defaultInfo = {
    pastorName: '김목사',
    pastorMessage: '저희 교회는 하나님의 말씀을 중심으로 모든 성도들이 그리스도 안에서 성장하고 서로 사랑하며 세상을 섬기는 공동체입니다. 주님의 사랑과 은혜가 여러분과 함께하기를 기도합니다.',
  };

  const info = churchInfo || defaultInfo;

  return (
    <section className="py-12">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold mb-4">담임목사 인사말</h2>
            <h3 className="text-xl text-blue-600 mb-6">{info.pastorName} 목사</h3>
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {info.pastorMessage}
              </p>
            </div>
            <Button asChild>
              <Link href="/about/pastor">
                더 알아보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="order-1 md:order-2 relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            {info.pastorImageUrl ? (
              <Image 
                src={info.pastorImageUrl} 
                alt={`${info.pastorName} 목사님`} 
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
                <span className="text-xl text-blue-600 dark:text-blue-300">목사님 사진</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

interface ChurchHeroProps {
  churchInfo: any;
}

export default function ChurchHero({ churchInfo }: ChurchHeroProps) {
  // 교회 정보가 없을 경우 기본값 사용
  const defaultInfo = {
    name: '커넥트 교회',
    description: '하나님과 사람, 사람과 사람을 연결하는 교회',
    address: '서울시 강남구 테헤란로 123',
    serviceTime: {
      sunday: [
        { name: '1부 예배', time: '오전 9:00' },
        { name: '2부 예배', time: '오전 11:00' },
      ],
      wednesday: [{ name: '수요 예배', time: '오후 7:30' }],
      friday: [{ name: '금요 기도회', time: '오후 8:00' }],
    },
    bannerUrl: '/images/church-banner.jpg',
  };

  const info = churchInfo || defaultInfo;
  const mainService = info.serviceTime?.sunday?.[1] || { name: '주일 예배', time: '오전 11:00' };

  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 bg-black/40 z-10" />
      {info.bannerUrl ? (
        <Image
          src={info.bannerUrl}
          alt={info.name}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900" />
      )}

      {/* 텍스트 콘텐츠 */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">{info.name}</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl">{info.description}</p>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>{info.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>{mainService.name}: {mainService.time}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
            <Link href="/about">교회 소개 <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
            <Link href="/visit">
              <Calendar className="mr-2 h-4 w-4" /> 방문 안내
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

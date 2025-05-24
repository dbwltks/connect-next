"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Calendar, Book } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface LatestSermonProps {
  sermon: any;
}

export default function LatestSermon({ sermon }: LatestSermonProps) {
  // 설교 정보가 없을 경우 기본값 사용
  const defaultSermon = {
    title: '하나님의 은혜',
    scripture: '로마서 8:28-39',
    preacher: '김목사',
    date: new Date().toISOString(),
    thumbnailUrl: '',
  };

  const sermonData = sermon || defaultSermon;
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5 text-blue-600" />
          최근 설교
        </CardTitle>
        <CardDescription>
          {formatDate(sermonData.date)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="relative h-48 mb-4 rounded-md overflow-hidden">
          {sermonData.thumbnailUrl ? (
            <Image
              src={sermonData.thumbnailUrl}
              alt={sermonData.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
              <Book className="h-10 w-10 text-blue-600 dark:text-blue-300" />
            </div>
          )}
          
          {sermonData.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 bg-white/80 hover:bg-white text-blue-600">
                <Play className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{sermonData.title}</h3>
        <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-medium">본문:</span>
            <span>{sermonData.scripture}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">설교자:</span>
            <span>{sermonData.preacher}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/sermons">
            모든 설교 보기
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

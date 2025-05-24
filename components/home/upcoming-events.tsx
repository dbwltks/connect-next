"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface UpcomingEventsProps {
  events: any[];
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  // 이벤트가 없을 경우 기본값 사용
  const defaultEvents = [
    {
      id: '1',
      title: '가을 말씀 축제',
      description: '하나님의 말씀으로 충만한 가을 말씀 축제에 여러분을 초대합니다.',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 일주일 후
      location: '본당',
      imageUrl: '',
    },
    {
      id: '2',
      title: '청년부 수련회',
      description: '청년들을 위한 특별한 수련회가 준비되어 있습니다.',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2주일 후
      location: '교회 수련원',
      imageUrl: '',
    },
  ];

  const eventsData = events?.length > 0 ? events : defaultEvents;
  
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
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">다가오는 행사</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/events">
            모든 행사 보기 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventsData.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <div className="relative h-48">
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-blue-600 dark:text-blue-300" />
                </div>
              )}
            </div>
            
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{event.description}</p>
              
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
              
              <Button asChild className="w-full mt-4">
                <Link href={`/events/${event.id}`}>
                  자세히 보기
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, ArrowRight, Pin } from 'lucide-react';
import Link from 'next/link';

interface AnnouncementsProps {
  announcements: any[];
}

export default function Announcements({ announcements }: AnnouncementsProps) {
  // 공지사항이 없을 경우 기본값 사용
  const defaultAnnouncements = [
    {
      id: '1',
      title: '추수감사절 예배 안내',
      content: '다가오는 추수감사절 예배는 11월 셋째 주일에 진행됩니다. 모든 성도님들의 참여를 바랍니다.',
      publishDate: new Date().toISOString(),
      isPinned: true,
      users: { name: '관리자' },
    },
    {
      id: '2',
      title: '성가대원 모집',
      content: '주일 예배를 위한 성가대원을 모집합니다. 관심 있으신 분들은 성가대장에게 문의해주세요.',
      publishDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
      isPinned: false,
      users: { name: '성가대장' },
    },
  ];

  const announcementsData = announcements?.length > 0 ? announcements : defaultAnnouncements;
  
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
        <h2 className="text-2xl font-bold">공지사항</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/announcements">
            모든 공지사항 보기 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
            최근 공지사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {announcementsData.map((announcement) => (
              <li key={announcement.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex justify-between mb-1">
                  <h3 className="font-medium flex items-center gap-2">
                    {announcement.isPinned && (
                      <Pin className="h-4 w-4 text-red-500" />
                    )}
                    {announcement.title}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(announcement.publishDate)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {announcement.content}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    작성자: {announcement.users?.name || '관리자'}
                  </span>
                  <Button asChild variant="link" size="sm" className="p-0 h-auto">
                    <Link href={`/announcements/${announcement.id}`}>
                      자세히 보기
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

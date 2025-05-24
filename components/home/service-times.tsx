"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ServiceTimesProps {
  churchInfo: any;
}

export default function ServiceTimes({ churchInfo }: ServiceTimesProps) {
  // 교회 정보가 없을 경우 기본값 사용
  const defaultServiceTimes = {
    serviceTime: {
      sunday: [
        { name: '1부 예배', time: '오전 9:00' },
        { name: '2부 예배', time: '오전 11:00' },
        { name: '주일 학교', time: '오전 11:00' },
        { name: '청년부 예배', time: '오후 2:00' },
      ],
      wednesday: [{ name: '수요 예배', time: '오후 7:30' }],
      friday: [{ name: '금요 기도회', time: '오후 8:00' }],
    }
  };

  const info = churchInfo || defaultServiceTimes;
  const { serviceTime } = info;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          예배 시간
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {serviceTime?.sunday && (
            <div>
              <h3 className="font-semibold text-lg mb-2">주일 예배</h3>
              <ul className="space-y-2">
                {serviceTime.sunday.map((service: any, index: number) => (
                  <li key={index} className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{service.name}</span>
                    <span className="font-medium">{service.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {serviceTime?.wednesday && (
            <div>
              <h3 className="font-semibold text-lg mb-2">수요 예배</h3>
              <ul className="space-y-2">
                {serviceTime.wednesday.map((service: any, index: number) => (
                  <li key={index} className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{service.name}</span>
                    <span className="font-medium">{service.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {serviceTime?.friday && (
            <div>
              <h3 className="font-semibold text-lg mb-2">금요 예배</h3>
              <ul className="space-y-2">
                {serviceTime.friday.map((service: any, index: number) => (
                  <li key={index} className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{service.name}</span>
                    <span className="font-medium">{service.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Section } from '@/components/admin/section-manager';

interface ScheduleSectionProps {
  section: Section;
  className?: string;
}

// 스케줄/캘린더 섹션: 간단한 일정 리스트 예시
export default function ScheduleSection({ section, className = '' }: ScheduleSectionProps) {
  // 샘플 일정 데이터
  const schedules = [
    { date: '2025-04-21', title: '주일예배', desc: '오전 11시 본당' },
    { date: '2025-04-22', title: '수요예배', desc: '수요일 오후 7시' },
    { date: '2025-04-23', title: '청년부 모임', desc: '토요일 오후 6시' },
  ];

  return (
    <section className={`mb-8 ${className}`}>
      <h2 className="text-2xl font-bold mb-2">{section.title || '스케줄'}</h2>
      <p className="text-muted-foreground mb-4">{section.description || '예정된 일정입니다.'}</p>
      <ul className="divide-y divide-gray-200">
        {schedules.map((sch, i) => (
          <li key={i} className="py-3 flex items-start gap-4">
            <div className="font-mono text-sm text-blue-700 w-24 shrink-0">{sch.date}</div>
            <div>
              <div className="font-semibold">{sch.title}</div>
              <div className="text-xs text-gray-500">{sch.desc}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

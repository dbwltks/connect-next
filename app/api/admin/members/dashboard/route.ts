import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 교인 통계
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, first_name, last_name, korean_name, membership_status, gender, created_at, membership_date, infant_baptism_date, adult_baptism_date, wedding_date, birth_date");

    const safeMembers = members || [];

    // 날짜 계산
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    // 생일 관련 날짜 계산
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // 이번 주 일요일
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // 이번 주 토요일

    const nextWeekStart = new Date(thisWeekEnd);
    nextWeekStart.setDate(thisWeekEnd.getDate() + 1); // 다음 주 일요일
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // 다음 주 토요일

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    // 생일 체크 함수
    const isBirthdayInPeriod = (birthDate: string, startDate: Date, endDate: Date) => {
      if (!birthDate) return false;
      
      const birth = new Date(birthDate);
      const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      
      // 올해 생일이 지났다면 내년 생일로 계산
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      return thisYearBirthday >= startDate && thisYearBirthday <= endDate;
    };

    const getBirthdayList = (startDate: Date, endDate: Date) => {
      return safeMembers
        .filter(member => member.birth_date && isBirthdayInPeriod(member.birth_date, startDate, endDate))
        .map(member => {
          const birth = new Date(member.birth_date);
          const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
          
          // 올해 생일이 지났다면 내년 생일로 계산
          if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1);
          }

          return {
            id: member.id,
            first_name: member.first_name,
            last_name: member.last_name,
            korean_name: member.korean_name,
            birth_date: member.birth_date,
            birthday_this_year: thisYearBirthday.toISOString().split('T')[0],
            age: today.getFullYear() - birth.getFullYear(),
          };
        })
        .sort((a, b) => new Date(a.birthday_this_year).getTime() - new Date(b.birthday_this_year).getTime());
    };

    // 교인 통계 계산
    const memberStats = {
      total: safeMembers.length,
      active: safeMembers.filter(m => m.membership_status === 'active').length,
      inactive: safeMembers.filter(m => m.membership_status === 'inactive').length,
      transferred: safeMembers.filter(m => m.membership_status === 'transferred').length,
      deceased: safeMembers.filter(m => m.membership_status === 'deceased').length,
      new_this_week: safeMembers.filter(m => m.created_at && new Date(m.created_at) >= lastWeek).length,
      new_this_month: safeMembers.filter(m => m.created_at && new Date(m.created_at) >= lastMonth).length,
      new_this_year: safeMembers.filter(m => m.created_at && new Date(m.created_at) >= lastYear).length,
      by_gender: {
        male: safeMembers.filter(m => m.gender === 'male').length,
        female: safeMembers.filter(m => m.gender === 'female').length,
        other: safeMembers.filter(m => !m.gender || (m.gender !== 'male' && m.gender !== 'female')).length,
      },
      by_status: safeMembers.reduce((acc, member) => {
        const status = member.membership_status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // 세례/결혼 통계
    const sacramentStats = {
      infant_baptism: safeMembers.filter(m => m.infant_baptism_date).length,
      adult_baptism: safeMembers.filter(m => m.adult_baptism_date).length,
      total_baptized: safeMembers.filter(m => m.infant_baptism_date || m.adult_baptism_date).length,
      married: safeMembers.filter(m => m.wedding_date).length,
      recent_baptisms: safeMembers.filter(m => 
        (m.infant_baptism_date && new Date(m.infant_baptism_date) >= lastYear) ||
        (m.adult_baptism_date && new Date(m.adult_baptism_date) >= lastYear)
      ).length,
      recent_marriages: safeMembers.filter(m => 
        m.wedding_date && new Date(m.wedding_date) >= lastYear
      ).length,
    };

    // 생일 통계
    const birthdayStats = {
      total_with_birthday: safeMembers.filter(m => m.birth_date).length,
      this_week: safeMembers.filter(m => m.birth_date && isBirthdayInPeriod(m.birth_date, thisWeekStart, thisWeekEnd)).length,
      next_week: safeMembers.filter(m => m.birth_date && isBirthdayInPeriod(m.birth_date, nextWeekStart, nextWeekEnd)).length,
      this_month: safeMembers.filter(m => m.birth_date && isBirthdayInPeriod(m.birth_date, thisMonthStart, thisMonthEnd)).length,
      next_month: safeMembers.filter(m => m.birth_date && isBirthdayInPeriod(m.birth_date, nextMonthStart, nextMonthEnd)).length,
    };

    // 생일자 목록
    const birthdayLists = {
      this_week: getBirthdayList(thisWeekStart, thisWeekEnd),
      next_week: getBirthdayList(nextWeekStart, nextWeekEnd),
      this_month: getBirthdayList(thisMonthStart, thisMonthEnd),
      next_month: getBirthdayList(nextMonthStart, nextMonthEnd),
    };

    // 멤버십 트렌드 (최근 6개월)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today);
      month.setMonth(month.getMonth() - i);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const monthlyData = {
        month: month.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
        new_members: safeMembers.filter(m => 
          m.created_at && 
          new Date(m.created_at) >= monthStart && 
          new Date(m.created_at) <= monthEnd
        ).length,
        memberships: safeMembers.filter(m => 
          m.membership_date && 
          new Date(m.membership_date) >= monthStart && 
          new Date(m.membership_date) <= monthEnd
        ).length,
      };

      monthlyTrends.push(monthlyData);
    }

    // 최근 등록된 교인 (최근 10명)
    const recentMembers = safeMembers
      .filter(m => m.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 10);

    // 다가오는 기념일 (생일, 세례일, 결혼기념일 등)
    const upcomingEvents: any[] = [];
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // 세례 기념일 (올해)
    safeMembers.forEach(member => {
      if (member.adult_baptism_date) {
        const baptismDate = new Date(member.adult_baptism_date);
        const thisYearBaptism = new Date(today.getFullYear(), baptismDate.getMonth(), baptismDate.getDate());
        
        if (thisYearBaptism >= today && thisYearBaptism <= nextMonth) {
          upcomingEvents.push({
            type: 'baptism',
            date: thisYearBaptism.toISOString().split('T')[0],
            member_id: member.id,
            title: '세례 기념일',
          });
        }
      }

      if (member.wedding_date) {
        const weddingDate = new Date(member.wedding_date);
        const thisYearWedding = new Date(today.getFullYear(), weddingDate.getMonth(), weddingDate.getDate());
        
        if (thisYearWedding >= today && thisYearWedding <= nextMonth) {
          upcomingEvents.push({
            type: 'wedding',
            date: thisYearWedding.toISOString().split('T')[0],
            member_id: member.id,
            title: '결혼 기념일',
          });
        }
      }
    });

    return NextResponse.json({
      memberStats,
      sacramentStats,
      birthdayStats,
      birthdayLists,
      monthlyTrends,
      recentMembers,
      upcomingEvents: upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    });
  } catch (error) {
    console.error("Members dashboard data error:", error);
    return NextResponse.json(
      { error: "교인 대시보드 데이터 로딩 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
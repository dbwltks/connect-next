import { createClient } from "@/utils/supabase/client";

// 간단한 랜덤 ID 생성 함수
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  status: string;
  registered_at: string;
  category?: string;
  notes?: string;
  program_id: string;
}

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  vendor?: string;
  itemName?: string;
  amount: number;
  paidBy?: string;
  description?: string;
  date: string;
  program_id: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  program_id: string;
  team_id?: string;
  is_recurring?: boolean;
  recurring_end_date?: string;
  recurring_group_id?: string;
}

export interface AttendanceRecord {
  id: string;
  participant_id: string;
  event_id?: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
  program_id: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  is_completed: boolean;
  due_date?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high';
  program_id: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  leader_id?: string;
  member_count: number;
  program_id: string;
}

export interface MealPlan {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  menu: string;
  notes?: string;
  allergens?: string[];
  cost_per_person?: number;
  program_id: string;
}

// Members API
export const membersApi = {
  async search(query: string): Promise<any[]> {
    const supabase = createClient();
    
    console.log('검색 쿼리:', query);
    
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    try {
      // 실제 데이터베이스 컬럼명을 사용한 검색
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,korean_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('first_name', { ascending: true })
        .limit(10);

      if (error) {
        console.error('검색 에러:', error);
        return [];
      }

      console.log('검색 성공:', data);
      return data || [];
    } catch (error) {
      console.error('검색 실패:', error);
      return [];
    }
  }
};

// Participants API
export const participantsApi = {
  async getAll(programId: string): Promise<Participant[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('programs')
      .select('participants')
      .eq('id', programId)
      .single();

    if (error) throw error;
    return Array.isArray(data?.participants) ? data.participants : [];
  },

  async create(participant: Omit<Participant, 'id' | 'registered_at'>): Promise<void> {
    const supabase = createClient();
    
    const { data: program, error: fetchError } = await supabase
      .from('programs')
      .select('participants')
      .eq('id', participant.program_id)
      .single();

    if (fetchError) throw fetchError;

    const currentParticipants = Array.isArray(program?.participants) ? program.participants : [];
    
    const newParticipant = {
      ...participant,
      id: generateId(),
      registered_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('programs')
      .update({ 
        participants: [...currentParticipants, newParticipant]
      })
      .eq('id', participant.program_id);

    if (error) throw error;
  },

  async update(id: string, participant: Partial<Participant>, programId?: string): Promise<void> {
    const supabase = createClient();
    
    if (programId) {
      const { data: program, error: fetchError } = await supabase
        .from('programs')
        .select('participants')
        .eq('id', programId)
        .single();

      if (fetchError) throw fetchError;

      const currentParticipants = Array.isArray(program?.participants) ? program.participants : [];
      const updatedParticipants = currentParticipants.map((p: any) => 
        p.id === id ? { ...p, ...participant } : p
      );

      const { error } = await supabase
        .from('programs')
        .update({ participants: updatedParticipants })
        .eq('id', programId);

      if (error) throw error;
    }
  },

  async delete(id: string, programId?: string): Promise<void> {
    const supabase = createClient();
    
    if (programId) {
      const { data: program, error: fetchError } = await supabase
        .from('programs')
        .select('participants')
        .eq('id', programId)
        .single();

      if (fetchError) throw fetchError;

      const currentParticipants = Array.isArray(program?.participants) ? program.participants : [];
      const updatedParticipants = currentParticipants.filter((p: any) => p.id !== id);

      const { error } = await supabase
        .from('programs')
        .update({ participants: updatedParticipants })
        .eq('id', programId);

      if (error) throw error;
    }
  }
};

// Finance API
export const financeApi = {
  async getAll(programId: string): Promise<FinanceRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('finance_records')
      .select('*')
      .eq('program_id', programId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(record: Omit<FinanceRecord, 'id'>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('finance_records')
      .insert(record);

    if (error) throw error;
  },

  async update(id: string, record: Partial<FinanceRecord>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('finance_records')
      .update(record)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('finance_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Events API
export const eventsApi = {
  async getAll(programId: string): Promise<Event[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('programs')
      .select('events')
      .eq('id', programId)
      .single();

    if (error) throw error;
    return Array.isArray(data?.events) ? data.events : [];
  },

  async create(event: Omit<Event, 'id'>): Promise<void> {
    const supabase = createClient();
    
    const { data: program, error: fetchError } = await supabase
      .from('programs')
      .select('events')
      .eq('id', event.program_id)
      .single();

    if (fetchError) throw fetchError;

    const currentEvents = Array.isArray(program?.events) ? program.events : [];
    
    const newEvent = {
      ...event,
      id: generateId(),
      team_id: event.team_id === 'none' ? null : event.team_id
    };

    const { error } = await supabase
      .from('programs')
      .update({ 
        events: [...currentEvents, newEvent]
      })
      .eq('id', event.program_id);

    if (error) throw error;
  },

  async update(id: string, event: Partial<Event>, programId?: string): Promise<void> {
    const supabase = createClient();
    
    if (programId) {
      const { data: program, error: fetchError } = await supabase
        .from('programs')
        .select('events')
        .eq('id', programId)
        .single();

      if (fetchError) throw fetchError;

      const currentEvents = Array.isArray(program?.events) ? program.events : [];
      const updatedEvents = currentEvents.map((e: any) => 
        e.id === id ? { ...e, ...event } : e
      );

      const { error } = await supabase
        .from('programs')
        .update({ events: updatedEvents })
        .eq('id', programId);

      if (error) throw error;
    }
  },

  async delete(id: string, programId?: string): Promise<void> {
    const supabase = createClient();
    
    if (programId) {
      const { data: program, error: fetchError } = await supabase
        .from('programs')
        .select('events')
        .eq('id', programId)
        .single();

      if (fetchError) throw fetchError;

      const currentEvents = Array.isArray(program?.events) ? program.events : [];
      const updatedEvents = currentEvents.filter((e: any) => e.id !== id);

      const { error } = await supabase
        .from('programs')
        .update({ events: updatedEvents })
        .eq('id', programId);

      if (error) throw error;
    }
  }
};

// Attendance API
export const attendanceApi = {
  async getAll(programId: string): Promise<AttendanceRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('program_id', programId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(record: Omit<AttendanceRecord, 'id'>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('attendance_records')
      .insert(record);

    if (error) throw error;
  },

  async update(id: string, record: Partial<AttendanceRecord>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('attendance_records')
      .update(record)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Checklist API
export const checklistApi = {
  async getAll(programId: string): Promise<ChecklistItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('program_id', programId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(item: Omit<ChecklistItem, 'id'>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('checklist_items')
      .insert(item);

    if (error) throw error;
  },

  async update(id: string, item: Partial<ChecklistItem>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('checklist_items')
      .update(item)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Teams API
export const teamsApi = {
  async getAll(programId: string): Promise<Team[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('programs')
      .select('teams')
      .eq('id', programId)
      .single();

    if (error) throw error;
    return Array.isArray(data?.teams) ? data.teams : [];
  },

  async create(team: Omit<Team, 'id'>): Promise<void> {
    const supabase = createClient();
    
    const { data: program, error: fetchError } = await supabase
      .from('programs')
      .select('teams')
      .eq('id', team.program_id)
      .single();

    if (fetchError) throw fetchError;

    const currentTeams = Array.isArray(program?.teams) ? program.teams : [];
    
    const newTeam = {
      ...team,
      id: generateId()
    };

    const { error } = await supabase
      .from('programs')
      .update({ 
        teams: [...currentTeams, newTeam]
      })
      .eq('id', team.program_id);

    if (error) throw error;
  },

  async update(id: string, team: Partial<Team>, programId?: string): Promise<void> {
    const supabase = createClient();
    
    if (programId) {
      const { data: program, error: fetchError } = await supabase
        .from('programs')
        .select('teams')
        .eq('id', programId)
        .single();

      if (fetchError) throw fetchError;

      const currentTeams = Array.isArray(program?.teams) ? program.teams : [];
      const updatedTeams = currentTeams.map((t: any) => 
        t.id === id ? { ...t, ...team } : t
      );

      const { error } = await supabase
        .from('programs')
        .update({ teams: updatedTeams })
        .eq('id', programId);

      if (error) throw error;
    }
  },

  async delete(id: string, programId?: string): Promise<void> {
    const supabase = createClient();
    
    if (programId) {
      const { data: program, error: fetchError } = await supabase
        .from('programs')
        .select('teams')
        .eq('id', programId)
        .single();

      if (fetchError) throw fetchError;

      const currentTeams = Array.isArray(program?.teams) ? program.teams : [];
      const updatedTeams = currentTeams.filter((t: any) => t.id !== id);

      const { error } = await supabase
        .from('programs')
        .update({ teams: updatedTeams })
        .eq('id', programId);

      if (error) throw error;
    }
  }
};

// Meal Plans API
export const mealPlansApi = {
  async getAll(programId: string): Promise<MealPlan[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('program_id', programId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(plan: Omit<MealPlan, 'id'>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('meal_plans')
      .insert(plan);

    if (error) throw error;
  },

  async update(id: string, plan: Partial<MealPlan>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('meal_plans')
      .update(plan)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Categories API (for reusable categories across different features)
export const categoriesApi = {
  async getParticipantCategories(): Promise<string[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('participant_categories')
      .select('name')
      .order('name');

    if (error) throw error;
    return data?.map((item: any) => item.name) || ['일반', 'VIP', '학생', '교직원'];
  },

  async getFinanceCategories(): Promise<string[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('finance_categories')
      .select('name')
      .order('name');

    if (error) throw error;
    return data?.map((item: any) => item.name) || ['교육비', '식비', '교통비', '숙박비', '기타'];
  },

  async getChecklistCategories(): Promise<string[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('checklist_categories')
      .select('name')
      .order('name');

    if (error) throw error;
    return data?.map((item: any) => item.name) || ['준비사항', '진행사항', '마무리', '행정'];
  },

  async addParticipantCategory(name: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('participant_categories')
      .insert({ name });

    if (error) throw error;
  },

  async addFinanceCategory(name: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('finance_categories')
      .insert({ name });

    if (error) throw error;
  },

  async addChecklistCategory(name: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('checklist_categories')
      .insert({ name });

    if (error) throw error;
  },

  async deleteParticipantCategory(name: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('participant_categories')
      .delete()
      .eq('name', name);

    if (error) throw error;
  },

  async deleteFinanceCategory(name: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('finance_categories')
      .delete()
      .eq('name', name);

    if (error) throw error;
  },

  async deleteChecklistCategory(name: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('checklist_categories')
      .delete()
      .eq('name', name);

    if (error) throw error;
  }
};
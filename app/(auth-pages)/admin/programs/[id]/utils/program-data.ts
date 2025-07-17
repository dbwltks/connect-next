import { createClient } from "@/utils/supabase/client";

// 타입 정의
export interface ProgramData {
  id?: string;
  name: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string;
  description: string;
  features: string[];
  settings?: any;
  participants?: any[];
  finances?: any[];
  events?: any[];
  attendance?: any[];
  checklist?: any[];
  teams?: any[];
  team_members?: any[];
  team_roles?: any[];
  meals?: {
    categories: any[];
    plans: any[];
  };
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MealCategory {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface MealPlan {
  id: string;
  date: string;
  meals: MealItem[];
}

export interface MealItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  ingredients?: string[];
  notes?: string;
}

// 프로그램 데이터 로드
export async function loadProgramData(programId: string): Promise<ProgramData | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (error) {
      console.error('프로그램 로드 오류:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('프로그램 로드 실패:', error);
    return null;
  }
}

// 프로그램 데이터 저장
export async function saveProgramData(programData: ProgramData): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('programs')
      .upsert({
        ...programData,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('프로그램 저장 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('프로그램 저장 실패:', error);
    return false;
  }
}

// 식단 카테고리 저장
export async function saveMealCategories(programId: string, categories: MealCategory[]): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // 현재 프로그램 데이터 가져오기
    const { data: currentData, error: fetchError } = await supabase
      .from('programs')
      .select('meals')
      .eq('id', programId)
      .single();

    if (fetchError) {
      console.error('프로그램 데이터 조회 오류:', fetchError);
      return false;
    }

    const currentMeals = currentData?.meals || { categories: [], plans: [] };
    
    // 카테고리 업데이트
    const updatedMeals = {
      ...currentMeals,
      categories: categories
    };

    const { error } = await supabase
      .from('programs')
      .update({ 
        meals: updatedMeals,
        updated_at: new Date().toISOString()
      })
      .eq('id', programId);

    if (error) {
      console.error('식단 카테고리 저장 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('식단 카테고리 저장 실패:', error);
    return false;
  }
}

// 식단 계획 저장
export async function saveMealPlans(programId: string, plans: MealPlan[]): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // 현재 프로그램 데이터 가져오기
    const { data: currentData, error: fetchError } = await supabase
      .from('programs')
      .select('meals')
      .eq('id', programId)
      .single();

    if (fetchError) {
      console.error('프로그램 데이터 조회 오류:', fetchError);
      return false;
    }

    const currentMeals = currentData?.meals || { categories: [], plans: [] };
    
    // 계획 업데이트
    const updatedMeals = {
      ...currentMeals,
      plans: plans
    };

    const { error } = await supabase
      .from('programs')
      .update({ 
        meals: updatedMeals,
        updated_at: new Date().toISOString()
      })
      .eq('id', programId);

    if (error) {
      console.error('식단 계획 저장 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('식단 계획 저장 실패:', error);
    return false;
  }
}

// 개별 식단 아이템 추가
export async function addMealItem(programId: string, date: string, mealItem: MealItem): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // 현재 프로그램 데이터 가져오기
    const { data: currentData, error: fetchError } = await supabase
      .from('programs')
      .select('meals')
      .eq('id', programId)
      .single();

    if (fetchError) {
      console.error('프로그램 데이터 조회 오류:', fetchError);
      return false;
    }

    const currentMeals = currentData?.meals || { categories: [], plans: [] };
    const plans = [...currentMeals.plans];
    
    // 해당 날짜의 계획 찾기
    const existingPlanIndex = plans.findIndex(plan => plan.date === date);
    
    if (existingPlanIndex >= 0) {
      // 기존 계획에 식단 추가
      plans[existingPlanIndex].meals.push(mealItem);
    } else {
      // 새 계획 생성
      plans.push({
        id: `plan_${Date.now()}`,
        date: date,
        meals: [mealItem]
      });
    }

    const updatedMeals = {
      ...currentMeals,
      plans: plans
    };

    const { error } = await supabase
      .from('programs')
      .update({ 
        meals: updatedMeals,
        updated_at: new Date().toISOString()
      })
      .eq('id', programId);

    if (error) {
      console.error('식단 아이템 추가 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('식단 아이템 추가 실패:', error);
    return false;
  }
}

// 식단 아이템 삭제
export async function deleteMealItem(programId: string, date: string, mealItemId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // 현재 프로그램 데이터 가져오기
    const { data: currentData, error: fetchError } = await supabase
      .from('programs')
      .select('meals')
      .eq('id', programId)
      .single();

    if (fetchError) {
      console.error('프로그램 데이터 조회 오류:', fetchError);
      return false;
    }

    const currentMeals = currentData?.meals || { categories: [], plans: [] };
    const plans = [...currentMeals.plans];
    
    // 해당 날짜의 계획 찾기
    const planIndex = plans.findIndex(plan => plan.date === date);
    
    if (planIndex >= 0) {
      // 해당 식단 아이템 삭제
      plans[planIndex].meals = plans[planIndex].meals.filter((meal: any) => meal.id !== mealItemId);
      
      // 식단이 모두 삭제되면 계획도 삭제
      if (plans[planIndex].meals.length === 0) {
        plans.splice(planIndex, 1);
      }
    }

    const updatedMeals = {
      ...currentMeals,
      plans: plans
    };

    const { error } = await supabase
      .from('programs')
      .update({ 
        meals: updatedMeals,
        updated_at: new Date().toISOString()
      })
      .eq('id', programId);

    if (error) {
      console.error('식단 아이템 삭제 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('식단 아이템 삭제 실패:', error);
    return false;
  }
}

// 프로그램의 특정 기능 데이터 저장 (범용)
export async function saveProgramFeatureData(
  programId: string, 
  featureName: string, 
  data: any
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const updateData = {
      [featureName]: data,
      updated_at: new Date().toISOString()
    };

    console.log(`저장 시도: ${featureName}, programId: ${programId}, 데이터 개수: ${Array.isArray(data) ? data.length : 'N/A'}`);

    const { error } = await supabase
      .from('programs')
      .update(updateData)
      .eq('id', programId);

    if (error) {
      console.error(`${featureName} 데이터 저장 오류:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full_error: error
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error(`${featureName} 데이터 저장 실패:`, error);
    return false;
  }
}
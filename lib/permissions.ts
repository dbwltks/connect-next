import { createClient } from "@/utils/supabase/server";

export interface PermissionContext {
  userId: string;
  resource?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
}

export interface DataScope {
  scope_type: 'own' | 'team' | 'department' | 'all';
  scope_value?: string;
  resource_type: string;
}

export class PermissionService {
  async getSupabase() {
    return await createClient();
  }

  // 기본 권한 체크
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      // 1. 사용자 역할 조회
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!user) return false;

      // 2. 역할에 할당된 권한 조회
      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select(`
          permissions (name)
        `)
        .eq('roles.name', user.role);

      const permissions = rolePermissions?.map((rp: any) => rp.permissions.name) || [];
      return permissions.includes(permission);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  // 데이터 레벨 권한 체크
  async hasDataAccess(
    userId: string, 
    resourceType: string, 
    targetUserId?: string,
    targetUnitId?: string
  ): Promise<boolean> {
    try {
      // 1. 사용자의 데이터 스코프 조회
      const supabase = await this.getSupabase();
      const { data: scopes } = await supabase
        .from('user_data_scope')
        .select('*')
        .eq('user_id', userId)
        .eq('resource_type', resourceType);

      if (!scopes || scopes.length === 0) return false;

      // 2. 스코프별 접근 권한 확인
      for (const scope of scopes) {
        switch (scope.scope_type) {
          case 'all':
            return true;

          case 'own':
            if (targetUserId === userId) return true;
            break;

          case 'team':
          case 'department':
            if (await this.isInSameUnit(userId, targetUserId, scope.scope_value)) {
              return true;
            }
            break;
        }
      }

      return false;
    } catch (error) {
      console.error('Data access check failed:', error);
      return false;
    }
  }

  // 조건부 권한 체크 (시간/IP 제한)
  async hasConditionalAccess(
    userId: string, 
    permission: string, 
    context: PermissionContext
  ): Promise<boolean> {
    try {
      // 1. 기본 권한 체크
      const hasBasicPermission = await this.hasPermission(userId, permission);
      if (!hasBasicPermission) return false;

      // 2. 조건부 제약 조회
      const supabase = await this.getSupabase();
      const { data: conditions } = await supabase
        .from('conditional_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('permission_id', await this.getPermissionId(permission))
        .eq('is_active', true);

      if (!conditions || conditions.length === 0) return true;

      // 3. 각 조건 검증
      for (const condition of conditions) {
        if (!await this.validateCondition(condition, context)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Conditional access check failed:', error);
      return false;
    }
  }

  // 권한 위임 여부 확인
  async canDelegate(userId: string, permission: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      // 1. 사용자 역할 조회
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!user) return false;

      // 2. 역할의 권한 레벨 확인
      const { data: role } = await supabase
        .from('roles')
        .select('level')
        .eq('name', user.role)
        .single();

      // 3. 관리자급 이상만 권한 위임 가능
      return !!(role && role.level >= 700);
    } catch (error) {
      console.error('Delegation check failed:', error);
      return false;
    }
  }

  // 최소 권한 원칙 적용
  async getMinimalPermissions(userId: string): Promise<string[]> {
    try {
      const supabase = await this.getSupabase();
      const { data: user } = await supabase
        .from('users')
        .select(`
          role,
          user_organizational_units (
            unit_id,
            role_in_unit,
            organizational_units (name, type)
          )
        `)
        .eq('id', userId)
        .single();

      if (!user) return [];

      // 역할별 기본 권한만 반환 (과도한 권한 제거)
      const basePermissions = await this.getBasePermissionsByRole(user.role);
      const unitPermissions = await this.getUnitSpecificPermissions(user.user_organizational_units);

      return [...basePermissions, ...unitPermissions];
    } catch (error) {
      console.error('Minimal permissions fetch failed:', error);
      return [];
    }
  }

  // 감사 로그 기록
  async logAccess(
    userId: string, 
    action: string, 
    resource: string, 
    success: boolean, 
    context?: any
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action,
          resource,
          success,
          ip_address: context?.ip,
          user_agent: context?.userAgent,
          additional_data: context ? JSON.stringify(context) : null,
        });
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  }

  // Private helper methods
  private async isInSameUnit(userId: string, targetUserId?: string, unitId?: string): Promise<boolean> {
    if (!targetUserId || !unitId) return false;

    const supabase = await this.getSupabase();
    const { data: userUnits } = await supabase
      .from('user_organizational_units')
      .select('unit_id')
      .eq('user_id', userId);

    const { data: targetUnits } = await supabase
      .from('user_organizational_units')
      .select('unit_id')
      .eq('user_id', targetUserId);

    const userUnitIds = userUnits?.map((u: any) => u.unit_id) || [];
    const targetUnitIds = targetUnits?.map((u: any) => u.unit_id) || [];

    return userUnitIds.some((id: any) => targetUnitIds.includes(id));
  }

  private async validateCondition(condition: any, context: PermissionContext): Promise<boolean> {
    const { condition_type, condition_value } = condition;

    switch (condition_type) {
      case 'time_restriction':
        return this.validateTimeRestriction(condition_value);
      case 'ip_restriction':
        return this.validateIpRestriction(condition_value, context.ip);
      default:
        return true;
    }
  }

  private validateTimeRestriction(timeConfig: any): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = this.parseTime(timeConfig.start_time);
    const endTime = this.parseTime(timeConfig.end_time);

    return currentTime >= startTime && currentTime <= endTime;
  }

  private validateIpRestriction(ipConfig: any, clientIp?: string): boolean {
    if (!clientIp || !ipConfig.allowed_ips) return false;
    return ipConfig.allowed_ips.includes(clientIp);
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async getPermissionId(permissionName: string): Promise<string | null> {
    const supabase = await this.getSupabase();
    const { data: permission } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', permissionName)
      .single();

    return permission?.id || null;
  }

  private async getBasePermissionsByRole(role: string): Promise<string[]> {
    const supabase = await this.getSupabase();
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select(`
        permissions (name)
      `)
      .eq('roles.name', role);

    return rolePermissions?.map((rp: any) => rp.permissions.name) || [];
  }

  private async getUnitSpecificPermissions(units: any[]): Promise<string[]> {
    // 조직 단위별 추가 권한 로직
    const additionalPermissions: string[] = [];

    for (const unit of units) {
      if (unit.role_in_unit === 'leader') {
        additionalPermissions.push(`${unit.organizational_units.type}.team.manage`);
      }
    }

    return additionalPermissions;
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { PermissionService, PermissionContext } from './permissions';

export interface RoutePermission {
  path: string;
  permission: string;
  dataLevel?: boolean;
  conditional?: boolean;
}

// 실무급 라우트 권한 정의
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // 관리자 페이지
  { path: '/admin', permission: 'system.admin.access' },
  { path: '/admin/members', permission: 'members.view.all' },
  { path: '/admin/members/create', permission: 'members.create' },
  { path: '/admin/members/edit', permission: 'members.edit.basic', dataLevel: true },
  { path: '/admin/members/delete', permission: 'members.delete' },
  
  // 재무 관리
  { path: '/admin/finance', permission: 'finance.view.summary' },
  { path: '/admin/finance/detail', permission: 'finance.view.detail', conditional: true },
  { path: '/admin/finance/budget', permission: 'finance.budget.view' },
  { path: '/admin/finance/budget/edit', permission: 'finance.budget.edit' },
  
  // 시스템 관리
  { path: '/admin/system', permission: 'system.settings' },
  { path: '/admin/system/users', permission: 'system.users.view' },
  { path: '/admin/system/roles', permission: 'system.roles.manage' },
  { path: '/admin/system/logs', permission: 'system.logs.view', conditional: true },
  
  // 사역 관리
  { path: '/ministry', permission: 'ministry.view' },
  { path: '/ministry/teams', permission: 'ministry.teams.manage', dataLevel: true },
  { path: '/ministry/members', permission: 'ministry.members.assign', dataLevel: true },
];

export class AuthMiddleware {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = new PermissionService();
  }

  async checkRouteAccess(
    request: NextRequest,
    userId: string,
    pathname: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // 1. 해당 경로의 권한 요구사항 찾기
      const routePermission = this.findRoutePermission(pathname);
      
      if (!routePermission) {
        // 권한 정의가 없는 경로는 허용 (공개 페이지)
        return { allowed: true };
      }

      // 2. 컨텍스트 생성
      const context: PermissionContext = {
        userId,
        ip: (this as any).getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
      };

      // 3. 조건부 권한 체크가 필요한 경우
      if (routePermission.conditional) {
        const hasConditionalAccess = await this.permissionService.hasConditionalAccess(
          userId,
          routePermission.permission,
          context
        );

        if (!hasConditionalAccess) {
          await this.logAccessAttempt(userId, routePermission.permission, pathname, false, context);
          return { 
            allowed: false, 
            reason: 'Conditional access requirements not met' 
          };
        }
      }

      // 4. 기본 권한 체크
      const hasPermission = await this.permissionService.hasPermission(
        userId,
        routePermission.permission
      );

      if (!hasPermission) {
        await this.logAccessAttempt(userId, routePermission.permission, pathname, false, context);
        return { 
          allowed: false, 
          reason: 'Insufficient permissions' 
        };
      }

      // 5. 데이터 레벨 권한 체크 (필요한 경우)
      if (routePermission.dataLevel) {
        const resourceType = this.extractResourceType(pathname);
        const targetId = this.extractTargetId(request);
        
        const hasDataAccess = await this.permissionService.hasDataAccess(
          userId,
          resourceType,
          targetId
        );

        if (!hasDataAccess) {
          await this.logAccessAttempt(userId, routePermission.permission, pathname, false, context);
          return { 
            allowed: false, 
            reason: 'Data access scope violation' 
          };
        }
      }

      // 6. 성공 로그
      await this.logAccessAttempt(userId, routePermission.permission, pathname, true, context);
      
      return { allowed: true };

    } catch (error) {
      console.error('Route access check failed:', error);
      return { 
        allowed: false, 
        reason: 'Permission check failed' 
      };
    }
  }

  // 최소 권한 원칙 적용 검증
  async validateMinimalAccess(userId: string): Promise<string[]> {
    return await this.permissionService.getMinimalPermissions(userId);
  }

  // 권한 위임 체크
  async canDelegatePermission(
    delegatorId: string, 
    permission: string, 
    targetUserId: string
  ): Promise<boolean> {
    // 1. 위임자가 해당 권한을 가지고 있는지 확인
    const hasDelegatorPermission = await this.permissionService.hasPermission(
      delegatorId,
      permission
    );

    if (!hasDelegatorPermission) return false;

    // 2. 위임 권한이 있는지 확인
    const canDelegate = await this.permissionService.canDelegate(
      delegatorId,
      permission
    );

    return canDelegate;
  }

  // 임시 권한 부여
  async grantTemporaryPermission(
    requesterId: string,
    targetUserId: string,
    permission: string,
    duration: number, // 시간 (분)
    justification: string
  ): Promise<{ success: boolean; requestId?: string }> {
    try {
      const validUntil = new Date();
      validUntil.setMinutes(validUntil.getMinutes() + duration);

      // 권한 요청 레코드 생성
      const { data: request, error } = await (await this.permissionService.getSupabase())
        .from('permission_requests')
        .insert({
          requester_id: requesterId,
          target_user_id: targetUserId,
          permission_id: await this.getPermissionId(permission),
          request_type: 'temporary',
          business_justification: justification,
          requested_by: requesterId,
          valid_until: validUntil.toISOString(),
          status: 'approved' // 자동 승인 (필요시 수동 승인으로 변경)
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, requestId: request.id };
    } catch (error) {
      console.error('Temporary permission grant failed:', error);
      return { success: false };
    }
  }

  // Private helper methods
  private findRoutePermission(pathname: string): RoutePermission | undefined {
    // 정확한 매치 우선, 그 다음 패턴 매치
    return ROUTE_PERMISSIONS.find(route => {
      if (route.path === pathname) return true;
      
      // 와일드카드 패턴 매치
      const pattern = route.path.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    });
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  private extractResourceType(pathname: string): string {
    // URL에서 리소스 타입 추출
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1]; // /admin/members -> 'members'
    }
    return 'unknown';
  }

  private extractTargetId(request: NextRequest): string | undefined {
    // Query parameter나 URL parameter에서 대상 ID 추출
    const url = new URL(request.url);
    return url.searchParams.get('targetId') || 
           url.searchParams.get('userId') ||
           url.searchParams.get('id') || undefined;
  }

  private async logAccessAttempt(
    userId: string,
    permission: string,
    resource: string,
    success: boolean,
    context: PermissionContext
  ): Promise<void> {
    await this.permissionService.logAccess(
      userId,
      'route_access',
      resource,
      success,
      {
        permission,
        ip: context.ip,
        userAgent: context.userAgent,
      }
    );
  }

  private async getPermissionId(permissionName: string): Promise<string | null> {
    // PermissionService의 private 메서드를 public으로 만들거나, 여기서 직접 구현
    const supabase = await this.permissionService.getSupabase();
    const { data: permission } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', permissionName)
      .single();

    return permission?.id || null;
  }
}

// 실무에서 사용하는 권한 체크 데코레이터
export function requirePermission(permission: string, options?: {
  dataLevel?: boolean;
  conditional?: boolean;
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [request] = args;
      const userId = request.user?.id;

      if (!userId) {
        throw new Error('Authentication required');
      }

      const authMiddleware = new AuthMiddleware();
      const permissionService = new PermissionService();

      // 기본 권한 체크
      const hasPermission = await permissionService.hasPermission(userId, permission);
      if (!hasPermission) {
        throw new Error('Insufficient permissions');
      }

      // 조건부 권한 체크
      if (options?.conditional) {
        const context: PermissionContext = {
          userId,
          ip: (this as any).getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        };

        const hasConditionalAccess = await permissionService.hasConditionalAccess(
          userId,
          permission,
          context
        );

        if (!hasConditionalAccess) {
          throw new Error('Conditional access requirements not met');
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, date } from 'drizzle-orm/pg-core';

// 웹사이트 사용자 테이블 (계정 정보)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),  // 사용자아이디 (로그인용)
  password: text('password').notNull(),  // 해시된 비밀번호 저장
  role: text('role').default('user').notNull(), // admin, pastor, staff, user
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').default(true).notNull(),
});

// 주소 테이블 (캐나다식 주소 구조)
export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  streetAddress: text('street_address'),  // 주소 (거리명, 번지)
  addressDetail: text('address_detail'),  // 상세 주소 (아파트, 유닛, 부가 정보 등)
  city: text('city'),  // 도시
  province: text('province'),  // 주/지방
  postalCode: text('postal_code'),  // 우편번호
  country: text('country').default('Canada'),  // 국가
  addressType: text('address_type').default('home'),  // home, work, church, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 교회 멤버 테이블 (교회 멤버십 정보)
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),  // 연결된 사용자 ID (연결되지 않을 수도 있음)
  memberCode: text('member_code').unique(),  // 교회 멤버 고유 코드
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  koreanName: text('korean_name'),  // 한글 이름
  gender: text('gender'),  // male, female
  birthDate: date('birth_date'),
  email: text('email'),
  phone: text('phone'),
  emergencyContact: text('emergency_contact'),
  baptismDate: date('baptism_date'),  // 세례 날짜
  membershipDate: date('membership_date'),  // 등록 날짜
  membershipStatus: text('membership_status').default('active').notNull(),  // active, inactive, transferred, deceased
  familyId: uuid('family_id'),  // 가족 그룹 ID
  notes: text('notes'),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 설교 테이블
export const sermons = pgTable('sermons', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  scripture: text('scripture').notNull(), // 성경 구절
  preacher: text('preacher').notNull(),
  date: timestamp('date').notNull(),
  content: text('content').notNull(),
  audioUrl: text('audio_url'),
  videoUrl: text('video_url'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 교회 일정 테이블
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  location: text('location'),
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurrencePattern: text('recurrence_pattern'), // weekly, monthly, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  imageUrl: text('image_url'),
});

// 소그룹/셀 테이블
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  leader: text('leader').notNull(),
  meetingTime: text('meeting_time'),
  meetingLocation: text('meeting_location'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 소그룹 멤버십 테이블
export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id),
  memberId: uuid('member_id').notNull().references(() => members.id),  // users에서 members로 변경
  role: text('role').default('member').notNull(), // leader, co-leader, member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  notes: text('notes'),
});

// 공지사항 테이블
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),  // 작성자는 관리자이미로 users 테이블 유지
  isPinned: boolean('is_pinned').default(false).notNull(),
  category: text('category').default('general'),  // general, event, ministry, etc.
  publishDate: timestamp('publish_date').defaultNow().notNull(),
  expiryDate: timestamp('expiry_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 갤러리/사진 테이블
export const gallery = pgTable('gallery', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  eventId: uuid('event_id').references(() => events.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 갤러리 이미지 테이블
export const galleryImages = pgTable('gallery_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  galleryId: uuid('gallery_id').notNull().references(() => gallery.id),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 멤버-주소 연결 테이블
export const memberAddresses = pgTable('member_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  addressId: uuid('address_id').notNull().references(() => addresses.id),
  isPrimary: boolean('is_primary').default(false),  // 기본 주소 여부
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 기도 요청 테이블
export const prayerRequests = pgTable('prayer_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),  // users에서 members로 변경
  title: text('title').notNull(),
  content: text('content').notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  status: text('status').default('active').notNull(),  // active, answered, closed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 교회 정보 테이블
export const churchInfo = pgTable('church_info', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  addressId: uuid('address_id').references(() => addresses.id),  // 주소 테이블 참조
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  serviceTime: jsonb('service_time').notNull(), // JSON 형태로 예배 시간 저장
  pastorName: text('pastor_name').notNull(),
  pastorMessage: text('pastor_message'),
  visionStatement: text('vision_statement'),
  missionStatement: text('mission_statement'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  socialLinks: jsonb('social_links'), // 소셜 미디어 링크
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

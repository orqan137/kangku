export type Visibility = 'friends' | 'public';
export type LectureStatus = 'waiting' | 'live' | 'finished';
export type PostTag = '자료공유' | '질문' | '공부인증' | '공지';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export type User = {
  id: string;
  loginId: string;
  passwordHash: string;
  displayName: string;
  major: string;
  roomCode: string;
  avatar: string;
  createdAt: string;
};

export type Room = {
  id: string;
  code: string;
  ownerId: string;
  name: string;
  visibility: Visibility;
  maxMembers: number;
  memberIds: string[];
  createdAt: string;
};

export type LectureMaterialVersion = {
  id: string;
  version: number;
  name: string;
  uri: string;
  mimeType: 'application/pdf';
  size?: number;
  uploadedBy: string;
  createdAt: string;
};

export type Lecture = {
  id: string;
  roomId: string;
  hostId: string;
  title: string;
  subject: string;
  location: string;
  materialName: string;
  activeMaterialVersionId: string;
  materialVersion: number;
  materialVersions: LectureMaterialVersion[];
  topics: string[];
  status: LectureStatus;
  createdAt: string;
};

export type SemesterCourse = {
  id: string;
  ownerId: string;
  semester: string;
  title: string;
  professor: string;
  room: string;
  days: Weekday[];
  startTime: string;
  endTime: string;
  color: string;
  lectureId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Point = {x: number; y: number};
export type Stroke = {
  id: string;
  color: string;
  size: number;
  points: Point[];
  authorId?: string;
  materialVersionId?: string;
  pageIndex?: number;
  createdAt?: string;
};

export type Note = {
  id: string;
  lectureId: string;
  ownerId: string;
  materialVersionId: string;
  strokes: Stroke[];
  memo: string;
  savedAt: string;
};

export type AnnotationOperation =
  | {
      id: string;
      lectureId: string;
      materialVersionId: string;
      actorId: string;
      clientId: string;
      clientSequence: number;
      serverSequence?: number;
      kind: 'stroke.upsert';
      stroke: Stroke;
      createdAt: string;
    }
  | {
      id: string;
      lectureId: string;
      materialVersionId: string;
      actorId: string;
      clientId: string;
      clientSequence: number;
      serverSequence?: number;
      kind: 'stroke.delete';
      strokeId: string;
      createdAt: string;
    }
  | {
      id: string;
      lectureId: string;
      materialVersionId: string;
      actorId: string;
      clientId: string;
      clientSequence: number;
      serverSequence?: number;
      kind: 'actor.clear';
      createdAt: string;
    };

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type StudyPost = {
  id: string;
  roomId: string;
  authorId: string;
  tag: PostTag;
  title: string;
  body: string;
  attachmentName?: string;
  likedBy: string[];
  comments: Comment[];
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  lectureId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Database = {
  version: 3;
  users: User[];
  rooms: Room[];
  lectures: Lecture[];
  semesterCourses: SemesterCourse[];
  notes: Note[];
  annotationOperations: AnnotationOperation[];
  posts: StudyPost[];
  chats: ChatMessage[];
};

export type NewLectureInput = Pick<
  Lecture,
  'title' | 'subject' | 'location' | 'topics'
> & {
  roomId: string;
  visibility: Visibility;
  maxMembers: number;
  material: NewLectureMaterial;
};

export type NewLectureMaterial = Pick<
  LectureMaterialVersion,
  'name' | 'uri' | 'mimeType' | 'size'
>;

export type SemesterCourseInput = Pick<
  SemesterCourse,
  | 'semester'
  | 'title'
  | 'professor'
  | 'room'
  | 'days'
  | 'startTime'
  | 'endTime'
  | 'color'
  | 'lectureId'
>;

export type NewPostInput = Pick<StudyPost, 'roomId' | 'tag' | 'title' | 'body'> & {
  attachmentName?: string;
};

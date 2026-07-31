import AsyncStorage from '@react-native-async-storage/async-storage';
import {sha256} from '@noble/hashes/sha256';
import {bytesToHex, utf8ToBytes} from '@noble/hashes/utils.js';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AnnotationOperation,
  ChatMessage,
  Database,
  Lecture,
  LectureMaterialVersion,
  NewLectureInput,
  NewLectureMaterial,
  NewPostInput,
  Note,
  Room,
  SemesterCourse,
  SemesterCourseInput,
  Stroke,
  StudyPost,
  User,
} from '../types';
import {
  COURSE_COLORS,
  coursesOverlap,
  getCurrentSemesterKey,
  validateSemesterCourse,
} from '../utils/semester';

const DB_KEY = '@kangku/database/v1';
const SESSION_KEY = '@kangku/session/v1';
const CLIENT_ID_KEY = '@kangku/collaboration-client/v1';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const AVATARS = ['🐹', '🐰', '🐻', '🐣', '🐨', '🐙', '🐱'];

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const now = () => new Date().toISOString();

const hashPassword = (loginId: string, password: string) =>
  bytesToHex(sha256(utf8ToBytes(`kangku:v1:${loginId.trim().toLowerCase()}:${password}`)));

const makeRoomCode = (taken: Set<string>) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = '';
    for (let index = 0; index < 6; index += 1) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    if (!taken.has(code)) {
      return code;
    }
  }
  return `K${Date.now().toString(36).slice(-5).toUpperCase()}`;
};

const createSeedDatabase = (): Database => {
  const demoUser: User = {
    id: 'user-demo',
    loginId: 'demo',
    passwordHash: hashPassword('demo', 'kangku123'),
    displayName: '민지',
    major: '경영학과',
    roomCode: 'K7QP2A',
    avatar: '🐹',
    createdAt: now(),
  };

  const stpMaterial: LectureMaterialVersion = {
    id: 'material-stp-v1',
    version: 1,
    name: 'STP_분석_5주차.pdf',
    uri: 'demo://materials/stp-analysis-v1.pdf',
    mimeType: 'application/pdf',
    uploadedBy: demoUser.id,
    createdAt: now(),
  };
  const consumerMaterial: LectureMaterialVersion = {
    id: 'material-consumer-v1',
    version: 1,
    name: '소비자행동론_요약.pdf',
    uri: 'demo://materials/consumer-v1.pdf',
    mimeType: 'application/pdf',
    uploadedBy: demoUser.id,
    createdAt: now(),
  };
  const semester = getCurrentSemesterKey();
  const semesterCourses: SemesterCourse[] = [
    {
      id: 'course-digital-marketing',
      ownerId: demoUser.id,
      semester,
      title: '디지털 마케팅 전략',
      professor: '김하늘 교수',
      room: '경영관 301호',
      days: ['mon', 'wed'],
      startTime: '10:00',
      endTime: '11:30',
      color: COURSE_COLORS[0],
      lectureId: 'lecture-stp',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'course-consumer-behavior',
      ownerId: demoUser.id,
      semester,
      title: '소비자 행동론',
      professor: '이서윤 교수',
      room: '경영관 204호',
      days: ['tue', 'thu'],
      startTime: '13:00',
      endTime: '14:30',
      color: COURSE_COLORS[1],
      lectureId: 'lecture-consumer',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'course-service-operations',
      ownerId: demoUser.id,
      semester,
      title: '서비스 운영관리',
      professor: '박지훈 교수',
      room: '경영관 305호',
      days: ['fri'],
      startTime: '09:00',
      endTime: '10:30',
      color: COURSE_COLORS[2],
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  return {
    version: 3,
    users: [demoUser],
    rooms: [
      {
        id: 'room-demo',
        code: demoUser.roomCode,
        ownerId: demoUser.id,
        name: '민지의 마케팅 스터디',
        visibility: 'friends',
        maxMembers: 12,
        memberIds: [demoUser.id],
        createdAt: now(),
      },
    ],
    lectures: [
      {
        id: 'lecture-stp',
        roomId: 'room-demo',
        hostId: demoUser.id,
        title: '디지털 마케팅 전략',
        subject: 'STP 분석 같이 들어요',
        location: '경영관 301호',
        materialName: stpMaterial.name,
        activeMaterialVersionId: stpMaterial.id,
        materialVersion: 1,
        materialVersions: [stpMaterial],
        topics: ['STP 분석', '마케팅 믹스 4P', '사례 분석'],
        status: 'live',
        createdAt: now(),
      },
      {
        id: 'lecture-consumer',
        roomId: 'room-demo',
        hostId: demoUser.id,
        title: '소비자 행동론',
        subject: '중간고사 핵심 개념',
        location: '경영관 204호',
        materialName: consumerMaterial.name,
        activeMaterialVersionId: consumerMaterial.id,
        materialVersion: 1,
        materialVersions: [consumerMaterial],
        topics: ['관여도', '구매 의사결정', '태도 형성'],
        status: 'waiting',
        createdAt: now(),
      },
    ],
    semesterCourses,
    notes: [],
    annotationOperations: [],
    posts: [
      {
        id: 'post-1',
        roomId: 'room-demo',
        authorId: demoUser.id,
        tag: '자료공유',
        title: '시험 대비 요약 정리 ✨',
        body: '오늘 수업에서 교수님이 강조하신 STP 사례를 한 장으로 정리했어요.',
        attachmentName: 'STP_한장요약.pdf',
        likedBy: [],
        comments: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
      {
        id: 'post-2',
        roomId: 'room-demo',
        authorId: demoUser.id,
        tag: '질문',
        title: '세분시장 기준이 헷갈려요',
        body: '심리적 기준과 행동적 기준을 사례로 구분해 볼까요? 같이 의견 남겨주세요!',
        likedBy: [],
        comments: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
      },
      {
        id: 'post-3',
        roomId: 'room-demo',
        authorId: demoUser.id,
        tag: '공부인증',
        title: '오늘도 40분 집중 완료 🔥',
        body: '작게 시작해서 끝까지! 내일은 사례 분석을 마무리할게요.',
        likedBy: [],
        comments: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
      },
    ],
    chats: [
      {
        id: 'chat-1',
        lectureId: 'lecture-stp',
        authorId: demoUser.id,
        body: '교수님이 방금 시장 세분화 기준 중요하다고 하셨어요!',
        createdAt: now(),
      },
    ],
  };
};

const migrateDatabase = (candidate: Database): Database => {
  const lectures = candidate.lectures.map(lecture => {
    const hasVersions =
      Array.isArray(lecture.materialVersions) &&
      lecture.materialVersions.length > 0;
    const legacyVersion: LectureMaterialVersion = {
      id: `material-${lecture.id}-v1`,
      version: 1,
      name: lecture.materialName || '강의자료.pdf',
      uri: `legacy://materials/${lecture.id}`,
      mimeType: 'application/pdf',
      uploadedBy: lecture.hostId,
      createdAt: lecture.createdAt,
    };
    const materialVersions = hasVersions
      ? lecture.materialVersions
      : [legacyVersion];
    const activeMaterial =
      materialVersions.find(
        material => material.id === lecture.activeMaterialVersionId,
      ) ?? materialVersions[materialVersions.length - 1];

    return {
      ...lecture,
      materialName: activeMaterial.name,
      activeMaterialVersionId: activeMaterial.id,
      materialVersion: activeMaterial.version,
      materialVersions,
    };
  });
  const lectureById = new Map(lectures.map(lecture => [lecture.id, lecture]));
  const notes = candidate.notes.map(note => {
    const lecture = lectureById.get(note.lectureId);
    return {
      ...note,
      materialVersionId:
        note.materialVersionId ??
        lecture?.activeMaterialVersionId ??
        `material-${note.lectureId}-v1`,
      strokes: note.strokes.map(stroke => ({
        ...stroke,
        authorId: stroke.authorId ?? note.ownerId,
        materialVersionId:
          stroke.materialVersionId ??
          note.materialVersionId ??
          lecture?.activeMaterialVersionId,
        pageIndex: stroke.pageIndex ?? 0,
        createdAt: stroke.createdAt ?? note.savedAt,
      })),
    };
  });
  const hasOperationStore = Array.isArray(candidate.annotationOperations);
  const annotationOperations: AnnotationOperation[] = hasOperationStore
    ? candidate.annotationOperations
    : notes.flatMap(note =>
        note.strokes.map((stroke, index) => ({
          id: `migrated-${note.id}-${stroke.id}`,
          lectureId: note.lectureId,
          materialVersionId: note.materialVersionId,
          actorId: note.ownerId,
          clientId: 'legacy-local',
          clientSequence: index + 1,
          kind: 'stroke.upsert' as const,
          stroke,
          createdAt: note.savedAt,
        })),
      );
  const hasSemesterCourses = Array.isArray(candidate.semesterCourses);
  const semesterCourses: SemesterCourse[] = hasSemesterCourses
    ? candidate.semesterCourses
    : candidate.users
        .filter(user => user.id === 'user-demo')
        .flatMap(user => {
          const semester = getCurrentSemesterKey();
          const timestamp = now();
          return [
            {
              id: 'course-digital-marketing',
              ownerId: user.id,
              semester,
              title: '디지털 마케팅 전략',
              professor: '김하늘 교수',
              room: '경영관 301호',
              days: ['mon', 'wed'] as const,
              startTime: '10:00',
              endTime: '11:30',
              color: COURSE_COLORS[0],
              lectureId: 'lecture-stp',
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            {
              id: 'course-consumer-behavior',
              ownerId: user.id,
              semester,
              title: '소비자 행동론',
              professor: '이서윤 교수',
              room: '경영관 204호',
              days: ['tue', 'thu'] as const,
              startTime: '13:00',
              endTime: '14:30',
              color: COURSE_COLORS[1],
              lectureId: 'lecture-consumer',
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            {
              id: 'course-service-operations',
              ownerId: user.id,
              semester,
              title: '서비스 운영관리',
              professor: '박지훈 교수',
              room: '경영관 305호',
              days: ['fri'] as const,
              startTime: '09:00',
              endTime: '10:30',
              color: COURSE_COLORS[2],
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ];
        });

  return {
    ...candidate,
    version: 3,
    lectures,
    semesterCourses,
    notes,
    annotationOperations,
  };
};

type Result<T = undefined> =
  | {ok: true; data: T}
  | {ok: false; message: string};

type AppContextValue = {
  ready: boolean;
  db: Database;
  currentUser?: User;
  myRooms: Room[];
  signUp: (
    loginId: string,
    password: string,
    displayName: string,
    major: string,
  ) => Promise<Result<User>>;
  signIn: (loginId: string, password: string) => Promise<Result<User>>;
  signOut: () => Promise<void>;
  joinRoom: (code: string) => Promise<Result<Room>>;
  createLecture: (input: NewLectureInput) => Promise<Result<Lecture>>;
  replaceLectureMaterial: (
    lectureId: string,
    material: NewLectureMaterial,
  ) => Promise<Result<LectureMaterialVersion>>;
  setLectureStatus: (lectureId: string, status: Lecture['status']) => Promise<void>;
  saveNote: (
    lectureId: string,
    materialVersionId: string,
    strokes: Stroke[],
    memo: string,
  ) => Promise<Result<Note>>;
  publishStroke: (
    lectureId: string,
    materialVersionId: string,
    stroke: Stroke,
  ) => Promise<void>;
  deleteStroke: (
    lectureId: string,
    materialVersionId: string,
    strokeId: string,
  ) => Promise<void>;
  clearMyStrokes: (
    lectureId: string,
    materialVersionId: string,
  ) => Promise<void>;
  addPost: (input: NewPostInput) => Promise<Result<StudyPost>>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, body: string) => Promise<void>;
  sendChat: (lectureId: string, body: string) => Promise<Result<ChatMessage>>;
  upsertSemesterCourse: (
    input: SemesterCourseInput,
    courseId?: string,
  ) => Promise<Result<SemesterCourse>>;
  removeSemesterCourse: (courseId: string) => Promise<void>;
  updateProfile: (displayName: string, major: string) => Promise<void>;
  findUser: (id: string) => User | undefined;
};

const emptyDatabase: Database = {
  version: 3,
  users: [],
  rooms: [],
  lectures: [],
  semesterCourses: [],
  notes: [],
  annotationOperations: [],
  posts: [],
  chats: [],
};

const AppContext = createContext<AppContextValue | null>(null);
type DatabaseUpdate = Database | ((current: Database) => Database);

export function AppProvider({children}: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [db, setDb] = useState<Database>(emptyDatabase);
  const [sessionUserId, setSessionUserId] = useState<string>();
  const clientIdRef = useRef('');
  const dbRef = useRef<Database>(emptyDatabase);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [rawDb, rawSession, rawClientId] = await Promise.all([
          AsyncStorage.getItem(DB_KEY),
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(CLIENT_ID_KEY),
        ]);
        const hydrated = rawDb
          ? migrateDatabase(JSON.parse(rawDb) as Database)
          : createSeedDatabase();
        clientIdRef.current = rawClientId ?? uid('client');
        dbRef.current = hydrated;
        setDb(hydrated);
        await Promise.all([
          AsyncStorage.setItem(DB_KEY, JSON.stringify(hydrated)),
          rawClientId
            ? Promise.resolve()
            : AsyncStorage.setItem(CLIENT_ID_KEY, clientIdRef.current),
        ]);
        if (rawSession && hydrated.users.some(user => user.id === rawSession)) {
          setSessionUserId(rawSession);
        }
      } catch {
        const fallback = createSeedDatabase();
        dbRef.current = fallback;
        setDb(fallback);
      } finally {
        setReady(true);
      }
    };
    void hydrate();
  }, []);

  const commit = useCallback(async (update: DatabaseUpdate) => {
    const next =
      typeof update === 'function' ? update(dbRef.current) : update;
    dbRef.current = next;
    setDb(next);
    persistQueueRef.current = persistQueueRef.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(DB_KEY, JSON.stringify(next)));
    await persistQueueRef.current;
  }, []);

  const currentUser = db.users.find(user => user.id === sessionUserId);
  const myRooms = currentUser
    ? db.rooms.filter(room => room.memberIds.includes(currentUser.id))
    : [];

  const signUp: AppContextValue['signUp'] = async (
    loginId,
    password,
    displayName,
    major,
  ) => {
    const normalizedId = loginId.trim().toLowerCase();
    if (normalizedId.length < 4) {
      return {ok: false, message: '아이디는 4자 이상 입력해 주세요.'};
    }
    if (password.length < 8) {
      return {ok: false, message: '비밀번호는 8자 이상 입력해 주세요.'};
    }
    if (displayName.trim().length < 2) {
      return {ok: false, message: '이름은 2자 이상 입력해 주세요.'};
    }
    if (db.users.some(user => user.loginId === normalizedId)) {
      return {ok: false, message: '이미 사용 중인 아이디예요.'};
    }

    const code = makeRoomCode(new Set(db.rooms.map(room => room.code)));
    const user: User = {
      id: uid('user'),
      loginId: normalizedId,
      passwordHash: hashPassword(normalizedId, password),
      displayName: displayName.trim(),
      major: major.trim() || '전공 미설정',
      roomCode: code,
      avatar: AVATARS[db.users.length % AVATARS.length],
      createdAt: now(),
    };
    const room: Room = {
      id: uid('room'),
      code,
      ownerId: user.id,
      name: `${user.displayName}의 강꾸방`,
      visibility: 'friends',
      maxMembers: 12,
      memberIds: [user.id],
      createdAt: now(),
    };
    await commit(current => ({
      ...current,
      users: [...current.users, user],
      rooms: [...current.rooms, room],
    }));
    setSessionUserId(user.id);
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    return {ok: true, data: user};
  };

  const signIn: AppContextValue['signIn'] = async (loginId, password) => {
    const normalizedId = loginId.trim().toLowerCase();
    const user = db.users.find(item => item.loginId === normalizedId);
    if (!user || user.passwordHash !== hashPassword(normalizedId, password)) {
      return {ok: false, message: '아이디 또는 비밀번호를 확인해 주세요.'};
    }
    setSessionUserId(user.id);
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    return {ok: true, data: user};
  };

  const signOut = async () => {
    setSessionUserId(undefined);
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  const joinRoom: AppContextValue['joinRoom'] = async rawCode => {
    if (!currentUser) {
      return {ok: false, message: '로그인이 필요해요.'};
    }
    const code = rawCode.trim().toUpperCase();
    const room = db.rooms.find(item => item.code === code);
    if (!room) {
      return {ok: false, message: '일치하는 방 코드가 없어요.'};
    }
    if (room.memberIds.includes(currentUser.id)) {
      return {ok: true, data: room};
    }
    if (room.memberIds.length >= room.maxMembers) {
      return {ok: false, message: '이 방은 정원이 가득 찼어요.'};
    }
    const joined = {...room, memberIds: [...room.memberIds, currentUser.id]};
    await commit(current => ({
      ...current,
      rooms: current.rooms.map(item =>
        item.id === room.id
          ? {
              ...item,
              memberIds: item.memberIds.includes(currentUser.id)
                ? item.memberIds
                : [...item.memberIds, currentUser.id],
            }
          : item,
      ),
    }));
    return {ok: true, data: joined};
  };

  const createLecture: AppContextValue['createLecture'] = async input => {
    if (!currentUser) {
      return {ok: false, message: '로그인이 필요해요.'};
    }
    if (!input.title.trim() || !input.subject.trim()) {
      return {ok: false, message: '수업 이름과 주제를 입력해 주세요.'};
    }
    if (
      !input.material?.name.trim() ||
      !input.material.uri ||
      input.material.mimeType !== 'application/pdf'
    ) {
      return {ok: false, message: '수업을 열려면 PDF 강의자료가 꼭 필요해요.'};
    }
    const room = db.rooms.find(item => item.id === input.roomId);
    if (!room || !room.memberIds.includes(currentUser.id)) {
      return {ok: false, message: '수업을 만들 수 없는 방이에요.'};
    }
    const material: LectureMaterialVersion = {
      id: uid('material'),
      version: 1,
      name: input.material.name.trim(),
      uri: input.material.uri,
      mimeType: 'application/pdf',
      size: input.material.size,
      uploadedBy: currentUser.id,
      createdAt: now(),
    };
    const lecture: Lecture = {
      id: uid('lecture'),
      roomId: input.roomId,
      hostId: currentUser.id,
      title: input.title.trim(),
      subject: input.subject.trim(),
      location: input.location.trim() || '온라인 강의실',
      materialName: material.name,
      activeMaterialVersionId: material.id,
      materialVersion: 1,
      materialVersions: [material],
      topics: input.topics.filter(Boolean),
      status: 'waiting',
      createdAt: now(),
    };
    const updatedRoom = {
      ...room,
      visibility: input.visibility,
      maxMembers: input.maxMembers,
    };
    await commit(current => ({
      ...current,
      rooms: current.rooms.map(item =>
        item.id === room.id ? {...item, ...updatedRoom} : item,
      ),
      lectures: [lecture, ...current.lectures],
    }));
    return {ok: true, data: lecture};
  };

  const replaceLectureMaterial: AppContextValue['replaceLectureMaterial'] =
    async (lectureId, input) => {
      if (!currentUser) {
        return {ok: false, message: '로그인이 필요해요.'};
      }
      const lecture = db.lectures.find(item => item.id === lectureId);
      const room = db.rooms.find(item => item.id === lecture?.roomId);
      if (!lecture || !room) {
        return {ok: false, message: '수업을 찾을 수 없어요.'};
      }
      if (
        lecture.hostId !== currentUser.id &&
        room.ownerId !== currentUser.id
      ) {
        return {ok: false, message: '방장과 수업 개설자만 자료를 바꿀 수 있어요.'};
      }
      if (
        !input.name.trim() ||
        !input.uri ||
        input.mimeType !== 'application/pdf'
      ) {
        return {ok: false, message: '교체할 PDF 파일을 선택해 주세요.'};
      }

      let material: LectureMaterialVersion | undefined;
      await commit(current => ({
        ...current,
        lectures: current.lectures.map(item => {
          if (item.id !== lecture.id) {
            return item;
          }
          material = {
            id: uid('material'),
            version: item.materialVersion + 1,
            name: input.name.trim(),
            uri: input.uri,
            mimeType: 'application/pdf',
            size: input.size,
            uploadedBy: currentUser.id,
            createdAt: now(),
          };
          return {
            ...item,
            materialName: material.name,
            activeMaterialVersionId: material.id,
            materialVersion: material.version,
            materialVersions: [...item.materialVersions, material],
          };
        }),
      }));
      if (!material) {
        return {ok: false, message: '수업을 찾을 수 없어요.'};
      }
      return {ok: true, data: material};
    };

  const setLectureStatus: AppContextValue['setLectureStatus'] = async (
    lectureId,
    status,
  ) => {
    await commit(current => ({
      ...current,
      lectures: current.lectures.map(lecture =>
        lecture.id === lectureId ? {...lecture, status} : lecture,
      ),
    }));
  };

  const saveNote: AppContextValue['saveNote'] = async (
    lectureId,
    materialVersionId,
    strokes,
    memo,
  ) => {
    if (!currentUser) {
      return {ok: false, message: '로그인이 필요해요.'};
    }
    let savedNote: Note | undefined;
    await commit(current => {
      const existing = current.notes.find(
        note =>
          note.lectureId === lectureId &&
          note.ownerId === currentUser.id &&
          note.materialVersionId === materialVersionId,
      );
      savedNote = {
        id: existing?.id ?? uid('note'),
        lectureId,
        ownerId: currentUser.id,
        materialVersionId,
        strokes,
        memo: memo.trim(),
        savedAt: now(),
      };
      return {
        ...current,
        notes: existing
          ? current.notes.map(item =>
              item.id === existing.id ? savedNote! : item,
            )
          : [savedNote, ...current.notes],
      };
    });
    return {ok: true, data: savedNote!};
  };

  const publishStroke: AppContextValue['publishStroke'] = async (
    lectureId,
    materialVersionId,
    stroke,
  ) => {
    if (!currentUser) {
      return;
    }
    await commit(current => {
      const clientSequence =
        current.annotationOperations
          .filter(operation => operation.clientId === clientIdRef.current)
          .reduce(
            (maximum, operation) =>
              Math.max(maximum, operation.clientSequence),
            0,
          ) + 1;
      const operation: AnnotationOperation = {
        id: uid('operation'),
        lectureId,
        materialVersionId,
        actorId: currentUser.id,
        clientId: clientIdRef.current,
        clientSequence,
        kind: 'stroke.upsert',
        stroke: {
          ...stroke,
          authorId: currentUser.id,
          materialVersionId,
          pageIndex: stroke.pageIndex ?? 0,
          createdAt: stroke.createdAt ?? now(),
        },
        createdAt: now(),
      };
      return {
        ...current,
        annotationOperations: [
          ...current.annotationOperations,
          operation,
        ],
      };
    });
  };

  const deleteStroke: AppContextValue['deleteStroke'] = async (
    lectureId,
    materialVersionId,
    strokeId,
  ) => {
    if (!currentUser) {
      return;
    }
    await commit(current => {
      const clientSequence =
        current.annotationOperations
          .filter(operation => operation.clientId === clientIdRef.current)
          .reduce(
            (maximum, operation) =>
              Math.max(maximum, operation.clientSequence),
            0,
          ) + 1;
      const operation: AnnotationOperation = {
        id: uid('operation'),
        lectureId,
        materialVersionId,
        actorId: currentUser.id,
        clientId: clientIdRef.current,
        clientSequence,
        kind: 'stroke.delete',
        strokeId,
        createdAt: now(),
      };
      return {
        ...current,
        annotationOperations: [
          ...current.annotationOperations,
          operation,
        ],
      };
    });
  };

  const clearMyStrokes: AppContextValue['clearMyStrokes'] = async (
    lectureId,
    materialVersionId,
  ) => {
    if (!currentUser) {
      return;
    }
    await commit(current => {
      const clientSequence =
        current.annotationOperations
          .filter(operation => operation.clientId === clientIdRef.current)
          .reduce(
            (maximum, operation) =>
              Math.max(maximum, operation.clientSequence),
            0,
          ) + 1;
      const operation: AnnotationOperation = {
        id: uid('operation'),
        lectureId,
        materialVersionId,
        actorId: currentUser.id,
        clientId: clientIdRef.current,
        clientSequence,
        kind: 'actor.clear',
        createdAt: now(),
      };
      return {
        ...current,
        annotationOperations: [
          ...current.annotationOperations,
          operation,
        ],
      };
    });
  };

  const addPost: AppContextValue['addPost'] = async input => {
    if (!currentUser) {
      return {ok: false, message: '로그인이 필요해요.'};
    }
    if (!input.title.trim() || !input.body.trim()) {
      return {ok: false, message: '제목과 내용을 입력해 주세요.'};
    }
    const post: StudyPost = {
      id: uid('post'),
      roomId: input.roomId,
      authorId: currentUser.id,
      tag: input.tag,
      title: input.title.trim(),
      body: input.body.trim(),
      attachmentName: input.attachmentName?.trim() || undefined,
      likedBy: [],
      comments: [],
      createdAt: now(),
    };
    await commit(current => ({
      ...current,
      posts: [post, ...current.posts],
    }));
    return {ok: true, data: post};
  };

  const toggleLike = async (postId: string) => {
    if (!currentUser) {
      return;
    }
    await commit(current => ({
      ...current,
      posts: current.posts.map(post => {
        if (post.id !== postId) {
          return post;
        }
        const hasLiked = post.likedBy.includes(currentUser.id);
        return {
          ...post,
          likedBy: hasLiked
            ? post.likedBy.filter(id => id !== currentUser.id)
            : [...post.likedBy, currentUser.id],
        };
      }),
    }));
  };

  const addComment = async (postId: string, body: string) => {
    if (!currentUser || !body.trim()) {
      return;
    }
    await commit(current => ({
      ...current,
      posts: current.posts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: uid('comment'),
                  authorId: currentUser.id,
                  body: body.trim(),
                  createdAt: now(),
                },
              ],
            }
          : post,
      ),
    }));
  };

  const sendChat: AppContextValue['sendChat'] = async (lectureId, body) => {
    if (!currentUser || !body.trim()) {
      return {ok: false, message: '메시지를 입력해 주세요.'};
    }
    const message: ChatMessage = {
      id: uid('chat'),
      lectureId,
      authorId: currentUser.id,
      body: body.trim(),
      createdAt: now(),
    };
    await commit(current => ({
      ...current,
      chats: [...current.chats, message],
    }));
    return {ok: true, data: message};
  };

  const upsertSemesterCourse: AppContextValue['upsertSemesterCourse'] =
    async (input, courseId) => {
      if (!currentUser) {
        return {ok: false, message: '로그인이 필요해요.'};
      }
      const validationMessage = validateSemesterCourse(input);
      if (validationMessage) {
        return {ok: false, message: validationMessage};
      }
      const existing = courseId
        ? db.semesterCourses.find(course => course.id === courseId)
        : undefined;
      if (courseId && (!existing || existing.ownerId !== currentUser.id)) {
        return {ok: false, message: '수정할 과목을 찾을 수 없어요.'};
      }
      if (input.lectureId) {
        const lecture = db.lectures.find(item => item.id === input.lectureId);
        const room = db.rooms.find(item => item.id === lecture?.roomId);
        if (
          !lecture ||
          !room ||
          !room.memberIds.includes(currentUser.id)
        ) {
          return {ok: false, message: '연결할 수 없는 강의방이에요.'};
        }
      }
      const conflict = db.semesterCourses.find(
        course =>
          course.ownerId === currentUser.id &&
          course.id !== courseId &&
          coursesOverlap(course, input),
      );
      if (conflict) {
        return {
          ok: false,
          message: `${conflict.title} 수업과 시간이 겹쳐요.`,
        };
      }
      const timestamp = now();
      const course: SemesterCourse = {
        id: existing?.id ?? uid('course'),
        ownerId: currentUser.id,
        semester: input.semester,
        title: input.title.trim(),
        professor: input.professor.trim(),
        room: input.room.trim(),
        days: [...input.days],
        startTime: input.startTime.trim(),
        endTime: input.endTime.trim(),
        color: input.color,
        lectureId: input.lectureId || undefined,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      await commit(current => ({
        ...current,
        semesterCourses: existing
          ? current.semesterCourses.map(item =>
              item.id === existing.id ? course : item,
            )
          : [...current.semesterCourses, course],
      }));
      return {ok: true, data: course};
    };

  const removeSemesterCourse: AppContextValue['removeSemesterCourse'] =
    async courseId => {
      if (!currentUser) {
        return;
      }
      await commit(current => ({
        ...current,
        semesterCourses: current.semesterCourses.filter(
          course =>
            course.id !== courseId || course.ownerId !== currentUser.id,
        ),
      }));
    };

  const updateProfile = async (displayName: string, major: string) => {
    if (!currentUser || !displayName.trim()) {
      return;
    }
    await commit(current => ({
      ...current,
      users: current.users.map(user =>
        user.id === currentUser.id
          ? {...user, displayName: displayName.trim(), major: major.trim()}
          : user,
      ),
    }));
  };

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      db,
      currentUser,
      myRooms,
      signUp,
      signIn,
      signOut,
      joinRoom,
      createLecture,
      replaceLectureMaterial,
      setLectureStatus,
      saveNote,
      publishStroke,
      deleteStroke,
      clearMyStrokes,
      addPost,
      toggleLike,
      addComment,
      sendChat,
      upsertSemesterCourse,
      removeSemesterCourse,
      updateProfile,
      findUser: id => db.users.find(user => user.id === id),
    }),
    // Methods intentionally close over the latest database snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, db, currentUser, myRooms],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return value;
}

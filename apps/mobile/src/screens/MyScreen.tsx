import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import {CharacterImage} from '../components/CharacterImage';
import {TimetableCard} from '../components/TimetableCard';
import {
  AppButton,
  AppText,
  Card,
  EmptyState,
  Field,
  Pill,
  ScreenTitle,
  Sheet,
} from '../components/ui';
import {useApp} from '../store/AppProvider';
import {colors, fonts, shadow, softShadow} from '../theme';
import {SemesterCourse, Weekday} from '../types';
import {
  COURSE_COLORS,
  formatSemesterLabel,
  getCurrentSemesterKey,
  sortSemesterCourses,
  WEEKDAYS,
} from '../utils/semester';

export function MyScreen({
  onOpenClasses,
  onOpenStudy,
  onOpenLecture,
}: {
  onOpenClasses: () => void;
  onOpenStudy: () => void;
  onOpenLecture: (lectureId: string) => void;
}) {
  const {
    currentUser,
    db,
    myRooms,
    signOut,
    updateProfile,
    findUser,
    upsertSemesterCourse,
    removeSemesterCourse,
  } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string>();
  const [courseTitle, setCourseTitle] = useState('');
  const [professor, setProfessor] = useState('');
  const [courseRoom, setCourseRoom] = useState('');
  const [courseDays, setCourseDays] = useState<Weekday[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [courseColor, setCourseColor] = useState<string>(COURSE_COLORS[0]);
  const [linkedLectureId, setLinkedLectureId] = useState<string>();
  const [courseFeedback, setCourseFeedback] = useState('');
  const [name, setName] = useState(currentUser?.displayName ?? '');
  const [major, setMajor] = useState(currentUser?.major ?? '');
  const [saved, setSaved] = useState(false);

  if (!currentUser) {
    return null;
  }

  const myNotes = db.notes.filter(note => note.ownerId === currentUser.id);
  const myLectures = db.lectures.filter(lecture =>
    myRooms.some(room => room.id === lecture.roomId),
  );
  const currentSemester = getCurrentSemesterKey();
  const semesterCourses = sortSemesterCourses(
    db.semesterCourses.filter(
      course =>
        course.ownerId === currentUser.id &&
        course.semester === currentSemester,
    ),
  );
  const myPosts = db.posts.filter(post => post.authorId === currentUser.id);

  const resetCourseForm = () => {
    setEditingCourseId(undefined);
    setCourseTitle('');
    setProfessor('');
    setCourseRoom('');
    setCourseDays([]);
    setStartTime('09:00');
    setEndTime('10:30');
    setCourseColor(COURSE_COLORS[semesterCourses.length % COURSE_COLORS.length]);
    setLinkedLectureId(undefined);
    setCourseFeedback('');
  };

  const editCourse = (course: SemesterCourse) => {
    setEditingCourseId(course.id);
    setCourseTitle(course.title);
    setProfessor(course.professor);
    setCourseRoom(course.room);
    setCourseDays(course.days);
    setStartTime(course.startTime);
    setEndTime(course.endTime);
    setCourseColor(course.color);
    setLinkedLectureId(course.lectureId);
    setCourseFeedback('');
  };

  const saveCourse = async () => {
    const result = await upsertSemesterCourse(
      {
        semester: currentSemester,
        title: courseTitle,
        professor,
        room: courseRoom,
        days: courseDays,
        startTime,
        endTime,
        color: courseColor,
        lectureId: linkedLectureId,
      },
      editingCourseId,
    );
    if (!result.ok) {
      setCourseFeedback(result.message);
      return;
    }
    setCourseFeedback(
      editingCourseId ? '시간표를 수정했어요! ✓' : '시간표에 과목을 추가했어요! ✓',
    );
    setTimeout(resetCourseForm, 700);
  };

  const confirmRemoveCourse = (course: SemesterCourse) => {
    Alert.alert(
      `${course.title} 삭제`,
      '시간표에서만 삭제되며 연결된 강의방과 필기는 그대로 남아요.',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            removeSemesterCourse(course.id).catch(() => undefined);
            if (editingCourseId === course.id) {
              resetCourseForm();
            }
          },
        },
      ],
    );
  };

  const shareCode = async () => {
    await Share.share({
      title: '내 강꾸방 초대',
      message: `${currentUser.displayName}님의 강꾸방에 함께해요 💗\n방 코드: ${currentUser.roomCode}`,
    });
  };

  const saveProfile = async () => {
    await updateProfile(name, major);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setProfileOpen(false);
    }, 600);
  };

  const confirmLogout = () => {
    Alert.alert('로그아웃할까요?', '기기에 저장한 강꾸 기록은 그대로 남아 있어요.', [
      {text: '취소', style: 'cancel'},
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  };

  return (
    <>
      <ScrollView
        style={styles.page}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <ScreenTitle
          title="마이 🐹"
          subtitle="내 공부 기록과 강꾸방"
          action={
            <Pressable
              onPress={() => setProfileOpen(true)}
              style={styles.editButton}>
              <AppText style={styles.editText}>프로필 수정</AppText>
            </Pressable>
          }
        />

        <View style={[styles.profileCard, shadow]}>
          <View style={styles.profileBubbleOne} />
          <View style={styles.profileBubbleTwo} />
          <CharacterImage name="tori" style={styles.profileCharacter} />
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{currentUser.avatar}</AppText>
          </View>
          <AppText style={styles.name}>{currentUser.displayName} 님</AppText>
          <AppText style={styles.major}>{currentUser.major}</AppText>
          <Pill
            color="#786897"
            backgroundColor="rgba(255,255,255,.72)"
            style={styles.profilePill}>
            스티커 수집가 ✨
          </Pill>

          <View style={styles.stats}>
            <Stat value={`${myLectures.length}`} label="듣는 강의" color={colors.pink} />
            <View style={styles.statDivider} />
            <Stat
              value={`${myNotes.length}`}
              label="내 필기"
              color={colors.lavender}
            />
            <View style={styles.statDivider} />
            <Stat
              value={`${myPosts.length}`}
              label="공부 글"
              color={colors.mint}
            />
          </View>
        </View>

        <Card style={styles.codeCard}>
          <View style={styles.ticket}>
            <AppText style={styles.ticketEmoji}>🎟️</AppText>
          </View>
          <View style={styles.codeCopy}>
            <AppText style={styles.codeTitle}>나의 고유 방 코드</AppText>
            <AppText style={styles.code}>{currentUser.roomCode}</AppText>
          </View>
          <AppButton
            compact
            variant="secondary"
            title="공유"
            onPress={() => void shareCode()}
          />
        </Card>

        <View style={styles.semesterHeader}>
          <View>
            <AppText style={styles.semesterTitle}>이번 학기 내 강의 📚</AppText>
            <AppText style={styles.semesterMeta}>
              {formatSemesterLabel(currentSemester)} · {semesterCourses.length}과목
            </AppText>
          </View>
          <Pressable
            onPress={() => {
              resetCourseForm();
              setScheduleOpen(true);
            }}
            style={styles.scheduleManageButton}>
            <AppText style={styles.scheduleManageText}>시간표 관리</AppText>
          </Pressable>
        </View>

        <View style={styles.semesterSummary}>
          <CharacterImage name="kong" style={styles.semesterCharacter} />
          <View style={styles.semesterSummaryCopy}>
            <AppText style={styles.semesterSummaryTitle}>
              나만의 강의 루틴
            </AppText>
            <AppText style={styles.semesterSummaryBody}>
              시간표와 함께 필기방을 연결하면 홈에서 바로 입장할 수 있어요.
            </AppText>
          </View>
        </View>

        <TimetableCard
          courses={semesterCourses}
          onCoursePress={course => {
            if (course.lectureId) {
              onOpenLecture(course.lectureId);
            } else {
              editCourse(course);
              setScheduleOpen(true);
            }
          }}
        />

        <View style={styles.coursePreviewList}>
          {semesterCourses.slice(0, 3).map(course => (
            <Pressable
              key={course.id}
              onPress={() => {
                if (course.lectureId) {
                  onOpenLecture(course.lectureId);
                } else {
                  editCourse(course);
                  setScheduleOpen(true);
                }
              }}
              style={styles.coursePreview}>
              <View
                style={[
                  styles.courseColorBar,
                  {backgroundColor: course.color},
                ]}
              />
              <View style={styles.coursePreviewCopy}>
                <AppText style={styles.coursePreviewTitle} numberOfLines={1}>
                  {course.title}
                </AppText>
                <AppText style={styles.coursePreviewMeta}>
                  {course.days
                    .map(
                      day =>
                        WEEKDAYS.find(item => item.key === day)?.short ?? '',
                    )
                    .join('·')}{' '}
                  {course.startTime}–{course.endTime} · {course.room || '강의실 미정'}
                </AppText>
              </View>
              {course.lectureId ? (
                <View style={styles.linkedBadge}>
                  <AppText style={styles.linkedBadgeText}>필기방 연결</AppText>
                </View>
              ) : (
                <AppText style={styles.coursePreviewArrow}>›</AppText>
              )}
            </Pressable>
          ))}
        </View>

        <Card style={styles.menuCard}>
          <MenuRow
            icon="📝"
            label="내 필기 보관함"
            detail={`${myNotes.length}개`}
            onPress={() => setNotesOpen(true)}
          />
          <MenuRow
            icon="🏠"
            label="참여 중인 강꾸방"
            detail={`${myRooms.length}개`}
            onPress={() => setRoomsOpen(true)}
          />
          <MenuRow
            icon="📚"
            label="같이해요 공부 기록"
            detail={`${myPosts.length}개`}
            onPress={onOpenStudy}
          />
          <MenuRow
            icon="🎁"
            label="친구 초대하고 스티커 받기"
            onPress={() => void shareCode()}
          />
        </Card>

        <View style={styles.stickerSection}>
          <AppText style={styles.sectionTitle}>모은 캐릭터 스티커 💗</AppText>
          <View style={styles.stickerRow}>
            {(['mongle', 'tori', 'kong', 'nuri', 'moa'] as const).map(
              (character, index) => (
                <View key={character} style={styles.sticker}>
                  <CharacterImage name={character} style={styles.stickerImage} />
                  {index > myNotes.length + 1 ? (
                    <View style={styles.stickerLock}>
                      <AppText style={styles.stickerLockText}>🔒</AppText>
                    </View>
                  ) : null}
                </View>
              ),
            )}
          </View>
        </View>

        <Pressable onPress={confirmLogout} style={styles.logout}>
          <AppText style={styles.logoutText}>로그아웃</AppText>
        </Pressable>
        <AppText style={styles.footer}>
          강꾸와 함께 예쁘게 공부해요 💗
        </AppText>
      </ScrollView>

      <Sheet
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="프로필 꾸미기 ✨">
        <View style={styles.editAvatar}>
          <AppText style={styles.editAvatarText}>{currentUser.avatar}</AppText>
        </View>
        <Field
          label="이름 또는 닉네임"
          value={name}
          onChangeText={setName}
          placeholder="친구들에게 보일 이름"
          style={styles.field}
        />
        <Field
          label="전공"
          value={major}
          onChangeText={setMajor}
          placeholder="예: 경영학과"
          style={styles.field}
        />
        {saved ? (
          <AppText style={styles.savedMessage}>프로필을 저장했어요! ✓</AppText>
        ) : null}
        <AppButton
          title="프로필 저장하기"
          disabled={!name.trim()}
          onPress={() => void saveProfile()}
          style={styles.sheetButton}
        />
      </Sheet>

      <Sheet
        visible={scheduleOpen}
        onClose={() => {
          setScheduleOpen(false);
          resetCourseForm();
        }}
        title="이번 학기 시간표 📅">
        <View style={styles.sheetSemesterRow}>
          <Pill color={colors.pinkDark} backgroundColor={colors.pinkSoft}>
            {formatSemesterLabel(currentSemester)}
          </Pill>
          <AppText style={styles.sheetSemesterCount}>
            총 {semesterCourses.length}과목
          </AppText>
        </View>

        <TimetableCard
          compact
          courses={semesterCourses}
          onCoursePress={editCourse}
        />

        <AppText style={styles.sheetSectionTitle}>등록한 강의</AppText>
        {semesterCourses.length ? (
          semesterCourses.map(course => (
            <Card key={course.id} style={styles.scheduleCourseCard}>
              <View
                style={[
                  styles.scheduleCourseDot,
                  {backgroundColor: course.color},
                ]}
              />
              <View style={styles.scheduleCourseCopy}>
                <AppText style={styles.scheduleCourseTitle} numberOfLines={1}>
                  {course.title}
                </AppText>
                <AppText style={styles.scheduleCourseMeta}>
                  {course.days
                    .map(
                      day =>
                        WEEKDAYS.find(item => item.key === day)?.short ?? '',
                    )
                    .join('·')}{' '}
                  {course.startTime}–{course.endTime}
                  {course.lectureId ? ' · 필기방 연결됨' : ''}
                </AppText>
              </View>
              <Pressable
                onPress={() => editCourse(course)}
                style={styles.scheduleMiniButton}>
                <AppText style={styles.scheduleMiniButtonText}>수정</AppText>
              </Pressable>
              <Pressable
                onPress={() => confirmRemoveCourse(course)}
                style={[styles.scheduleMiniButton, styles.deleteMiniButton]}>
                <AppText
                  style={[
                    styles.scheduleMiniButtonText,
                    styles.deleteMiniButtonText,
                  ]}>
                  삭제
                </AppText>
              </Pressable>
            </Card>
          ))
        ) : (
          <AppText style={styles.noCourseText}>
            아래에서 첫 과목을 등록해 보세요. ✨
          </AppText>
        )}

        <View style={styles.editorHeading}>
          <AppText style={styles.sheetSectionTitle}>
            {editingCourseId ? '과목 수정하기' : '새 과목 추가하기'}
          </AppText>
          {editingCourseId ? (
            <Pressable onPress={resetCourseForm}>
              <AppText style={styles.newCourseText}>＋ 새 과목</AppText>
            </Pressable>
          ) : null}
        </View>

        <Field
          label="과목명"
          value={courseTitle}
          onChangeText={value => {
            setCourseTitle(value);
            setCourseFeedback('');
          }}
          placeholder="예: 디지털 마케팅 전략"
        />
        <View style={styles.twoFields}>
          <Field
            label="교수님"
            value={professor}
            onChangeText={setProfessor}
            placeholder="김하늘 교수"
            style={styles.halfField}
          />
          <Field
            label="강의실"
            value={courseRoom}
            onChangeText={setCourseRoom}
            placeholder="경영관 301호"
            style={styles.halfField}
          />
        </View>

        <AppText style={styles.formLabel}>수업 요일</AppText>
        <View style={styles.daySelector}>
          {WEEKDAYS.map(day => {
            const selected = courseDays.includes(day.key);
            return (
              <Pressable
                key={day.key}
                onPress={() => {
                  setCourseDays(current =>
                    current.includes(day.key)
                      ? current.filter(item => item !== day.key)
                      : [...current, day.key],
                  );
                  setCourseFeedback('');
                }}
                style={[
                  styles.dayButton,
                  selected && styles.dayButtonSelected,
                ]}>
                <AppText
                  style={[
                    styles.dayButtonText,
                    selected && styles.dayButtonTextSelected,
                  ]}>
                  {day.short}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.twoFields}>
          <Field
            label="시작 시간"
            value={startTime}
            onChangeText={setStartTime}
            placeholder="09:00"
            maxLength={5}
            keyboardType="numbers-and-punctuation"
            style={styles.halfField}
          />
          <Field
            label="종료 시간"
            value={endTime}
            onChangeText={setEndTime}
            placeholder="10:30"
            maxLength={5}
            keyboardType="numbers-and-punctuation"
            style={styles.halfField}
          />
        </View>

        <AppText style={styles.formLabel}>시간표 색상</AppText>
        <View style={styles.colorSelector}>
          {COURSE_COLORS.map(color => (
            <Pressable
              key={color}
              accessibilityLabel={`시간표 색상 ${color}`}
              onPress={() => setCourseColor(color)}
              style={[
                styles.colorButton,
                {backgroundColor: color},
                color === courseColor && styles.colorButtonSelected,
              ]}>
              {color === courseColor ? (
                <AppText style={styles.colorCheck}>✓</AppText>
              ) : null}
            </Pressable>
          ))}
        </View>

        <AppText style={styles.formLabel}>함께 듣는 강의방 연결</AppText>
        <AppText style={styles.linkHelp}>
          연결하면 홈 시간표에서 과목을 눌러 바로 공동 필기방에 들어가요.
        </AppText>
        <View style={styles.lectureSelector}>
          <Pressable
            onPress={() => setLinkedLectureId(undefined)}
            style={[
              styles.lectureChoice,
              !linkedLectureId && styles.lectureChoiceSelected,
            ]}>
            <AppText
              style={[
                styles.lectureChoiceText,
                !linkedLectureId && styles.lectureChoiceTextSelected,
              ]}>
              연결 안 함
            </AppText>
          </Pressable>
          {myLectures.map(lecture => (
            <Pressable
              key={lecture.id}
              onPress={() => setLinkedLectureId(lecture.id)}
              style={[
                styles.lectureChoice,
                linkedLectureId === lecture.id &&
                  styles.lectureChoiceSelected,
              ]}>
              <AppText
                numberOfLines={1}
                style={[
                  styles.lectureChoiceText,
                  linkedLectureId === lecture.id &&
                    styles.lectureChoiceTextSelected,
                ]}>
                {lecture.title}
              </AppText>
            </Pressable>
          ))}
        </View>

        {courseFeedback ? (
          <AppText
            style={[
              styles.courseFeedback,
              courseFeedback.includes('✓') && styles.courseFeedbackSuccess,
            ]}>
            {courseFeedback}
          </AppText>
        ) : null}
        <AppButton
          title={editingCourseId ? '수정 내용 저장하기' : '시간표에 추가하기 ＋'}
          disabled={!courseTitle.trim() || !courseDays.length}
          onPress={() => {
            saveCourse().catch(() => undefined);
          }}
          style={styles.sheetButton}
        />
      </Sheet>

      <Sheet
        visible={notesOpen}
        onClose={() => setNotesOpen(false)}
        title="내 필기 보관함 📝">
        {myNotes.length ? (
          myNotes.map(note => {
            const lecture = db.lectures.find(item => item.id === note.lectureId);
            return (
              <Pressable
                key={note.id}
                onPress={() => {
                  setNotesOpen(false);
                  onOpenLecture(note.lectureId);
                }}>
                <Card style={styles.noteCard}>
                  <View style={styles.noteIcon}>
                    <AppText style={styles.noteEmoji}>📕</AppText>
                  </View>
                  <View style={styles.noteCopy}>
                    <AppText style={styles.noteTitle} numberOfLines={1}>
                      {lecture?.subject ?? '함께 필기'}
                    </AppText>
                    <AppText style={styles.noteMeta}>
                      펜 {note.strokes.length}개 ·{' '}
                      {new Date(note.savedAt).toLocaleDateString('ko-KR')}
                    </AppText>
                  </View>
                  <AppText style={styles.noteArrow}>›</AppText>
                </Card>
              </Pressable>
            );
          })
        ) : (
          <EmptyState
            emoji="✏️"
            title="아직 저장한 필기가 없어요"
            body="함께 듣는 수업에서 그림을 그리고 중간 저장을 눌러보세요."
            action={
              <AppButton
                compact
                title="수업 찾으러 가기"
                onPress={() => {
                  setNotesOpen(false);
                  onOpenClasses();
                }}
              />
            }
          />
        )}
      </Sheet>

      <Sheet
        visible={roomsOpen}
        onClose={() => setRoomsOpen(false)}
        title="참여 중인 강꾸방 🏠">
        {myRooms.map(room => {
          const owner = findUser(room.ownerId);
          return (
            <Card key={room.id} style={styles.roomCard}>
              <View style={styles.roomAvatar}>
                <AppText style={styles.roomAvatarText}>{owner?.avatar}</AppText>
              </View>
              <View style={styles.roomCopy}>
                <AppText style={styles.roomName}>{room.name}</AppText>
                <AppText style={styles.roomMeta}>
                  {room.memberIds.length}명 · 코드 {room.code}
                </AppText>
              </View>
              <Pill
                color={room.ownerId === currentUser.id ? colors.pinkDark : colors.mintDark}
                backgroundColor={
                  room.ownerId === currentUser.id ? colors.pinkSoft : colors.mintSoft
                }>
                {room.ownerId === currentUser.id ? '내 방' : '참여 중'}
              </Pill>
            </Card>
          );
        })}
        <AppButton
          title="수업방 관리하기"
          onPress={() => {
            setRoomsOpen(false);
            onOpenClasses();
          }}
          style={styles.sheetButton}
        />
      </Sheet>
    </>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <AppText style={[styles.statValue, {color}]}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: string;
  label: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <View style={styles.menuIcon}>
        <AppText style={styles.menuEmoji}>{icon}</AppText>
      </View>
      <AppText style={styles.menuLabel}>{label}</AppText>
      {detail ? <AppText style={styles.menuDetail}>{detail}</AppText> : null}
      <AppText style={styles.menuArrow}>›</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: 17,
    paddingTop: 6,
    paddingBottom: 112,
  },
  editButton: {
    height: 37,
    borderRadius: 15,
    paddingHorizontal: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: colors.text,
  },
  profileCard: {
    minHeight: 305,
    borderRadius: 27,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 26,
    backgroundColor: colors.blush,
    borderWidth: 1,
    borderColor: '#F0CFD8',
  },
  profileBubbleOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(180,156,224,.18)',
    right: -65,
    top: -70,
  },
  profileBubbleTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,.35)',
    left: -38,
    bottom: 38,
  },
  profileCharacter: {
    position: 'absolute',
    width: 120,
    height: 120,
    right: -28,
    top: 65,
    opacity: 0.8,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#F4E7D8',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,.72)',
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  avatarText: {
    fontSize: 45,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.ink,
    marginTop: 10,
  },
  major: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  profilePill: {
    marginTop: 8,
  },
  stats: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 17,
    minHeight: 67,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,.74)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E8DADD',
  },
  codeCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    marginTop: 14,
  },
  ticket: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketEmoji: {
    fontSize: 24,
  },
  codeCopy: {
    flex: 1,
    marginLeft: 11,
  },
  codeTitle: {
    fontSize: 9.5,
    color: colors.muted,
  },
  code: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.pink,
    letterSpacing: 2,
    marginTop: 2,
  },
  semesterHeader: {
    marginTop: 23,
    marginBottom: 11,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  semesterTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  semesterMeta: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 3,
  },
  scheduleManageButton: {
    minHeight: 34,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavenderSoft,
  },
  scheduleManageText: {
    fontFamily: fonts.display,
    fontSize: 10,
    color: '#786897',
  },
  semesterSummary: {
    minHeight: 86,
    borderRadius: 22,
    marginBottom: 11,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: '#CDE8D8',
  },
  semesterCharacter: {
    width: 92,
    height: 92,
    marginLeft: -7,
  },
  semesterSummaryCopy: {
    flex: 1,
  },
  semesterSummaryTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.mintDark,
  },
  semesterSummaryBody: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.text,
    marginTop: 3,
  },
  coursePreviewList: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  coursePreview: {
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  courseColorBar: {
    width: 7,
    height: 33,
    borderRadius: 5,
  },
  coursePreviewCopy: {
    flex: 1,
    marginLeft: 10,
  },
  coursePreviewTitle: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: colors.ink,
  },
  coursePreviewMeta: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 3,
  },
  linkedBadge: {
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.pinkSoft,
  },
  linkedBadgeText: {
    fontFamily: fonts.display,
    fontSize: 8,
    color: colors.pinkDark,
  },
  coursePreviewArrow: {
    fontSize: 22,
    color: '#D3C6CD',
  },
  menuCard: {
    padding: 0,
    marginTop: 14,
    overflow: 'hidden',
  },
  menuRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  menuIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: '#FAF2F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.ink,
    marginLeft: 11,
  },
  menuDetail: {
    fontSize: 10,
    color: colors.muted,
    marginRight: 7,
  },
  menuArrow: {
    fontSize: 22,
    color: '#D3C6CD',
  },
  stickerSection: {
    marginTop: 23,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    marginLeft: 3,
    marginBottom: 10,
  },
  stickerRow: {
    flexDirection: 'row',
    gap: 7,
  },
  sticker: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
  stickerLock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,244,239,.72)',
  },
  stickerLockText: {
    fontSize: 17,
  },
  logout: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 22,
  },
  logoutText: {
    fontSize: 11,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  footer: {
    fontFamily: fonts.doodle,
    fontSize: 15,
    textAlign: 'center',
    color: '#C6BAC2',
    marginTop: 2,
  },
  editAvatar: {
    width: 78,
    height: 78,
    alignSelf: 'center',
    borderRadius: 39,
    backgroundColor: '#F4E7D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  editAvatarText: {
    fontSize: 43,
  },
  field: {
    marginTop: 14,
  },
  savedMessage: {
    textAlign: 'center',
    color: colors.mintDark,
    fontSize: 11,
    marginTop: 12,
  },
  sheetSemesterRow: {
    marginTop: 3,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetSemesterCount: {
    fontSize: 10,
    color: colors.muted,
  },
  sheetSectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
    marginTop: 20,
    marginBottom: 9,
  },
  scheduleCourseCard: {
    minHeight: 68,
    marginBottom: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleCourseDot: {
    width: 13,
    height: 40,
    borderRadius: 7,
  },
  scheduleCourseCopy: {
    flex: 1,
    marginLeft: 9,
  },
  scheduleCourseTitle: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: colors.ink,
  },
  scheduleCourseMeta: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 3,
  },
  scheduleMiniButton: {
    minWidth: 42,
    height: 31,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavenderSoft,
    marginLeft: 5,
  },
  scheduleMiniButtonText: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: '#786897',
  },
  deleteMiniButton: {
    backgroundColor: '#FCE8E9',
  },
  deleteMiniButtonText: {
    color: colors.danger,
  },
  noCourseText: {
    paddingVertical: 17,
    textAlign: 'center',
    fontSize: 11,
    color: colors.muted,
  },
  editorHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newCourseText: {
    fontFamily: fonts.display,
    fontSize: 10,
    color: colors.pinkDark,
    marginTop: 10,
  },
  twoFields: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 13,
  },
  halfField: {
    flex: 1,
  },
  formLabel: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 14,
    marginTop: 17,
    marginBottom: 8,
    marginLeft: 4,
  },
  daySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: '#E9DCDD',
  },
  dayButtonSelected: {
    backgroundColor: colors.pink,
    borderColor: colors.pink,
  },
  dayButtonText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.muted,
  },
  dayButtonTextSelected: {
    color: colors.white,
  },
  colorSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.paper,
  },
  colorButtonSelected: {
    borderColor: colors.ink,
  },
  colorCheck: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 16,
  },
  linkHelp: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
    marginTop: -3,
    marginBottom: 8,
    marginLeft: 4,
  },
  lectureSelector: {
    gap: 7,
  },
  lectureChoice: {
    minHeight: 44,
    borderRadius: 15,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: '#E9DCDD',
  },
  lectureChoiceSelected: {
    backgroundColor: colors.lavenderSoft,
    borderColor: colors.lavender,
  },
  lectureChoiceText: {
    fontSize: 11,
    color: colors.text,
  },
  lectureChoiceTextSelected: {
    fontFamily: fonts.display,
    color: '#786897',
  },
  courseFeedback: {
    textAlign: 'center',
    color: colors.danger,
    fontSize: 11,
    marginTop: 14,
  },
  courseFeedbackSuccess: {
    color: colors.mintDark,
  },
  sheetButton: {
    marginTop: 18,
  },
  noteCard: {
    minHeight: 80,
    marginTop: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteIcon: {
    width: 44,
    height: 54,
    borderRadius: 10,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteEmoji: {
    fontSize: 23,
  },
  noteCopy: {
    flex: 1,
    marginLeft: 11,
  },
  noteTitle: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
  },
  noteMeta: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 4,
  },
  noteArrow: {
    fontSize: 23,
    color: '#D3C6CD',
  },
  roomCard: {
    minHeight: 77,
    marginTop: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F6ECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomAvatarText: {
    fontSize: 25,
  },
  roomCopy: {
    flex: 1,
    marginLeft: 10,
  },
  roomName: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
  },
  roomMeta: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 4,
  },
});

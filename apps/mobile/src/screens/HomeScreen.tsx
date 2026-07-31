import React, {useMemo, useState} from 'react';
import {
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
  Field,
  Pill,
  ScreenTitle,
  SectionTitle,
  Sheet,
} from '../components/ui';
import {useApp} from '../store/AppProvider';
import {colors, fonts, shadow, softShadow} from '../theme';
import {
  formatSemesterLabel,
  getCurrentSemesterKey,
  getWeekdayKey,
  sortSemesterCourses,
} from '../utils/semester';

type Props = {
  onOpenClasses: () => void;
  onOpenStudy: () => void;
  onOpenMy: () => void;
  onOpenLecture: (lectureId: string) => void;
};

export function HomeScreen({
  onOpenClasses,
  onOpenStudy,
  onOpenMy,
  onOpenLecture,
}: Props) {
  const {currentUser, db, myRooms, joinRoom, findUser} = useApp();
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');

  const lectures = useMemo(
    () =>
      db.lectures.filter(lecture =>
        myRooms.some(room => room.id === lecture.roomId),
      ),
    [db.lectures, myRooms],
  );
  const featured = lectures.find(lecture => lecture.status === 'live') ?? lectures[0];
  const currentSemester = getCurrentSemesterKey();
  const semesterCourses = sortSemesterCourses(
    db.semesterCourses.filter(
      course =>
        course.ownerId === currentUser?.id &&
        course.semester === currentSemester,
    ),
  );
  const today = getWeekdayKey();
  const todayCourses = today
    ? semesterCourses.filter(course => course.days.includes(today))
    : [];
  const featuredCourse = featured
    ? semesterCourses.find(course => course.lectureId === featured.id)
    : undefined;
  const recentPosts = db.posts
    .filter(post => myRooms.some(room => room.id === post.roomId))
    .slice(0, 2);

  if (!currentUser) {
    return null;
  }

  const submitCode = async () => {
    const result = await joinRoom(code);
    if (result.ok) {
      setFeedback(`${result.data.name}에 들어왔어요! 🎉`);
      setCode('');
      setTimeout(() => setJoinOpen(false), 650);
    } else {
      setFeedback(result.message);
    }
  };

  const shareMyCode = async () => {
    await Share.share({
      title: '강꾸방 초대',
      message: `${currentUser.displayName}님의 강꾸방에 초대해요 💗\n방 코드: ${currentUser.roomCode}`,
    });
  };

  return (
    <>
      <ScrollView
        style={styles.page}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <ScreenTitle
          title="강꾸 💗"
          subtitle="Decorate your lecture!"
          action={
            <Pressable
              onPress={onOpenMy}
              style={({pressed}) => [
                styles.avatar,
                pressed && styles.pressed,
              ]}>
              <AppText style={styles.avatarText}>{currentUser.avatar}</AppText>
            </Pressable>
          }
        />

        {featured ? (
          <Pressable
            onPress={() => onOpenLecture(featured.id)}
            style={({pressed}) => pressed && styles.pressed}>
            <View style={[styles.todayCard, shadow]}>
              <View style={styles.todayDecorOne} />
              <View style={styles.todayDecorTwo} />
              <Pill>🔔  곧 시작해요</Pill>
              <AppText style={styles.todayTitle}>{featured.title}</AppText>
              <AppText style={styles.todayMeta}>
                {featuredCourse
                  ? `${featuredCourse.startTime} - ${featuredCourse.endTime}`
                  : '10:00 - 11:30'}{' '}
                | {featuredCourse?.room || featured.location}
              </AppText>
              <View style={styles.peopleLine}>
                <View style={styles.miniAvatars}>
                  {(
                    db.rooms.find(room => room.id === featured.roomId)?.memberIds ?? []
                  )
                    .slice(0, 3)
                    .map(id => (
                      <View key={id} style={styles.miniAvatar}>
                        <AppText style={styles.miniAvatarText}>
                          {findUser(id)?.avatar ?? '🙂'}
                        </AppText>
                      </View>
                    ))}
                </View>
                <AppText style={styles.peopleText}>
                  {db.rooms.find(room => room.id === featured.roomId)?.memberIds
                    .length ?? 1}
                  명이 함께 듣고 있어요!
                </AppText>
              </View>
              <View style={styles.enterButton}>
                <AppText style={styles.enterText}>강의 입장하기</AppText>
                <AppText style={styles.enterArrow}>›</AppText>
              </View>
              <CharacterImage name="mongle" style={styles.todayCharacter} />
              <View style={styles.memo}>
                <AppText style={styles.memoTitle}>오늘 배울 내용 ⭐</AppText>
                {featured.topics.slice(0, 3).map(topic => (
                  <View key={topic} style={styles.memoRow}>
                    <AppText style={styles.check}>✓</AppText>
                    <AppText style={styles.memoText}>{topic}</AppText>
                  </View>
                ))}
              </View>
            </View>
          </Pressable>
        ) : (
          <Card style={styles.noLecture}>
            <CharacterImage name="tori" style={styles.noLectureCharacter} />
            <View style={styles.noLectureCopy}>
              <AppText style={styles.noLectureTitle}>첫 수업방을 열어볼까요?</AppText>
              <AppText style={styles.noLectureBody}>
                강의 주제를 적으면 대기방과 공동 필기장이 함께 생겨요.
              </AppText>
              <AppButton
                compact
                title="수업 만들기"
                onPress={onOpenClasses}
                style={styles.noLectureButton}
              />
            </View>
          </Card>
        )}

        <View style={styles.timetableHeading}>
          <View>
            <AppText style={styles.timetableTitle}>이번 학기 시간표 📅</AppText>
            <AppText style={styles.timetableSubtitle}>
              {formatSemesterLabel(currentSemester)} · 오늘 {todayCourses.length}개 수업
            </AppText>
          </View>
          <Pressable onPress={onOpenMy} style={styles.manageSchedule}>
            <AppText style={styles.manageScheduleText}>관리 ›</AppText>
          </Pressable>
        </View>
        <TimetableCard
          compact
          courses={semesterCourses}
          onCoursePress={course => {
            if (course.lectureId) {
              onOpenLecture(course.lectureId);
            } else {
              onOpenClasses();
            }
          }}
        />

        <View style={[styles.quickCard, softShadow]}>
          <QuickAction icon="✏️" label="함께 필기" onPress={onOpenClasses} />
          <QuickAction icon="🎟️" label="방 코드" onPress={() => setJoinOpen(true)} />
          <QuickAction icon="📚" label="같이 공부" onPress={onOpenStudy} />
          <QuickAction icon="📝" label="내 기록" onPress={onOpenMy} />
        </View>

        <SectionTitle title="내 강꾸방 💜" action="전체 보기" onAction={onOpenClasses} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomRow}>
          {myRooms.map((room, index) => {
            const roomLectures = db.lectures.filter(item => item.roomId === room.id);
            const owner = findUser(room.ownerId);
            const palette = [
              [colors.blush, colors.pinkDark],
              [colors.lavenderSoft, '#786897'],
              [colors.mintSoft, colors.mintDark],
            ][index % 3];
            return (
              <Pressable
                key={room.id}
                onPress={onOpenClasses}
                style={({pressed}) => [
                  styles.roomCard,
                  {backgroundColor: palette[0]},
                  pressed && styles.pressed,
                ]}>
                <Pill color={palette[1]} backgroundColor="rgba(255,255,255,.65)">
                  {room.ownerId === currentUser.id ? '내 방' : '참여 중'}
                </Pill>
                <AppText style={styles.roomTitle} numberOfLines={2}>
                  {room.name}
                </AppText>
                <AppText style={styles.roomMeta}>
                  {roomLectures.length}개 수업 · {room.memberIds.length}명
                </AppText>
                <View style={styles.roomFooter}>
                  <AppText style={styles.roomOwner}>{owner?.avatar} {owner?.displayName}</AppText>
                  <AppText style={[styles.roomCount, {color: palette[1]}]}>
                    {room.code}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionTitle title="같이해요 새 글 📚" action="그룹 가기" onAction={onOpenStudy} />
        {recentPosts.map(post => (
          <Pressable key={post.id} onPress={onOpenStudy}>
            <Card style={styles.postPreview}>
              <Pill
                color={post.tag === '질문' ? '#786897' : colors.mintDark}
                backgroundColor={
                  post.tag === '질문' ? colors.lavenderSoft : colors.mintSoft
                }>
                {post.tag}
              </Pill>
              <View style={styles.postCopy}>
                <AppText style={styles.postTitle} numberOfLines={1}>
                  {post.title}
                </AppText>
                <AppText style={styles.postBody} numberOfLines={2}>
                  {post.body}
                </AppText>
              </View>
              <AppText style={styles.postArrow}>›</AppText>
            </Card>
          </Pressable>
        ))}

        <View style={styles.inviteBanner}>
          <CharacterImage name="moa" style={styles.inviteCharacter} />
          <View style={styles.inviteCopy}>
            <AppText style={styles.inviteTitle}>함께 공부하면 더 즐거워요!</AppText>
            <AppText style={styles.inviteBody}>친구에게 내 방 코드를 공유해 보세요 🎁</AppText>
          </View>
          <Pressable onPress={() => void shareMyCode()} style={styles.inviteButton}>
            <AppText style={styles.inviteButtonText}>초대</AppText>
          </Pressable>
        </View>
      </ScrollView>

      <Sheet
        visible={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="친구 방 코드 등록 🎟️">
        <AppText style={styles.sheetHelp}>
          친구에게 받은 6자리 코드를 입력하면 그 방의 수업과 스터디에 참여할 수
          있어요.
        </AppText>
        <Field
          value={code}
          onChangeText={value => {
            setCode(value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
            setFeedback('');
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          placeholder="예: K7QP2A"
          style={styles.codeField}
        />
        {feedback ? (
          <AppText
            style={[
              styles.feedback,
              feedback.includes('들어왔어요') && styles.feedbackSuccess,
            ]}>
            {feedback}
          </AppText>
        ) : null}
        <AppButton
          title="이 코드로 참여하기 →"
          disabled={code.length !== 6}
          onPress={() => void submitCode()}
          style={styles.sheetButton}
        />
      </Sheet>
    </>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.quickItem, pressed && styles.pressed]}>
      <View style={styles.quickIcon}>
        <AppText style={styles.quickEmoji}>{icon}</AppText>
      </View>
      <AppText numberOfLines={1} style={styles.quickLabel}>
        {label}
      </AppText>
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
    paddingBottom: 110,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F6ECE4',
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  avatarText: {
    fontSize: 25,
    lineHeight: 30,
  },
  timetableHeading: {
    marginTop: 23,
    marginBottom: 11,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  timetableTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  timetableSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginTop: 3,
  },
  manageSchedule: {
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  manageScheduleText: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: colors.pinkDark,
  },
  todayCard: {
    minHeight: 365,
    padding: 21,
    borderRadius: 29,
    overflow: 'hidden',
    backgroundColor: '#FCE9EE',
    borderWidth: 1,
    borderColor: '#F6CED8',
    marginTop: 17,
  },
  todayDecorOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,.42)',
    right: -55,
    top: -60,
  },
  todayDecorTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(180,156,224,.13)',
    left: -55,
    bottom: -50,
  },
  todayTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 31,
    color: colors.ink,
    marginTop: 14,
    maxWidth: '68%',
  },
  todayMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 7,
  },
  peopleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  miniAvatars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  miniAvatar: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: '#F6ECE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
  },
  miniAvatarText: {
    fontSize: 14,
    lineHeight: 18,
  },
  peopleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
  },
  enterButton: {
    width: 150,
    height: 50,
    marginTop: 20,
    borderRadius: 20,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.pink,
    ...shadow,
  },
  enterText: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 15,
  },
  enterArrow: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 30,
  },
  todayCharacter: {
    position: 'absolute',
    right: -15,
    bottom: -13,
    width: 175,
    height: 175,
  },
  memo: {
    position: 'absolute',
    right: 16,
    top: 43,
    width: 130,
    minHeight: 138,
    padding: 13,
    borderRadius: 7,
    backgroundColor: '#FFFDF7',
    transform: [{rotate: '-2deg'}],
    ...softShadow,
  },
  memoTitle: {
    fontFamily: fonts.doodleBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
    marginBottom: 7,
  },
  memoRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 5,
  },
  check: {
    color: colors.pink,
    fontSize: 12,
    lineHeight: 16,
  },
  memoText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  noLecture: {
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: colors.blush,
  },
  noLectureCharacter: {
    width: 135,
    height: 135,
    marginLeft: -20,
  },
  noLectureCopy: {
    flex: 1,
  },
  noLectureTitle: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 19,
  },
  noLectureBody: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 6,
  },
  noLectureButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  quickCard: {
    height: 100,
    borderRadius: 25,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 5,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#FAF2F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickEmoji: {
    fontSize: 22,
    lineHeight: 27,
  },
  quickLabel: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 11,
    marginTop: 5,
  },
  roomRow: {
    gap: 10,
    paddingRight: 12,
  },
  roomCard: {
    width: 175,
    minHeight: 150,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(220,200,205,.5)',
  },
  roomTitle: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 21,
    marginTop: 10,
  },
  roomMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginTop: 6,
  },
  roomFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomOwner: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.ink,
  },
  roomCount: {
    fontFamily: fonts.display,
    fontSize: 10,
  },
  postPreview: {
    minHeight: 105,
    marginBottom: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postCopy: {
    flex: 1,
  },
  postTitle: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 14,
  },
  postBody: {
    color: colors.text,
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 4,
  },
  postArrow: {
    color: '#D3C6CD',
    fontSize: 25,
  },
  inviteBanner: {
    minHeight: 100,
    marginTop: 16,
    borderRadius: 23,
    backgroundColor: colors.lavenderSoft,
    borderWidth: 1,
    borderColor: '#DCCEF1',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: 13,
  },
  inviteCharacter: {
    width: 92,
    height: 92,
    marginLeft: -9,
  },
  inviteCopy: {
    flex: 1,
  },
  inviteTitle: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 13,
  },
  inviteBody: {
    color: colors.ink,
    fontSize: 9.5,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 3,
  },
  inviteButton: {
    height: 38,
    borderRadius: 15,
    paddingHorizontal: 14,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 12,
  },
  sheetHelp: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
    marginTop: 5,
  },
  codeField: {
    marginTop: 18,
  },
  feedback: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  feedbackSuccess: {
    color: colors.mintDark,
  },
  sheetButton: {
    marginTop: 18,
  },
  pressed: {
    opacity: 0.78,
    transform: [{scale: 0.99}],
  },
});

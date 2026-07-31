import React, {useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {CharacterImage} from '../components/CharacterImage';
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
import {colors, fonts, softShadow} from '../theme';
import {NewLectureMaterial, Visibility} from '../types';
import {pickPersistentPdf} from '../utils/pickPdf';

export function ClassesScreen({
  onOpenLecture,
}: {
  onOpenLecture: (lectureId: string) => void;
}) {
  const {currentUser, db, myRooms, createLecture, joinRoom, findUser} = useApp();
  const [activeRoomId, setActiveRoomId] = useState(myRooms[0]?.id ?? '');
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [material, setMaterial] = useState<NewLectureMaterial>();
  const [topics, setTopics] = useState('');
  const [maxMembers, setMaxMembers] = useState(6);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!myRooms.some(room => room.id === activeRoomId)) {
      setActiveRoomId(myRooms[0]?.id ?? '');
    }
  }, [activeRoomId, myRooms]);

  const filteredLectures = useMemo(() => {
    return db.lectures.filter(lecture => {
      const room = db.rooms.find(item => item.id === lecture.roomId);
      return (
        myRooms.some(item => item.id === lecture.roomId) &&
        (visibility === 'public' ? room?.visibility === 'public' : true)
      );
    });
  }, [db.lectures, db.rooms, myRooms, visibility]);

  if (!currentUser) {
    return null;
  }

  const chooseDocument = async () => {
    setFeedback('');
    const result = await pickPersistentPdf();
    if (result.status === 'selected') {
      setMaterial(result.material);
    } else if (result.status === 'error') {
      setFeedback(result.message);
    }
  };

  const resetCreate = () => {
    setTitle('');
    setSubject('');
    setLocation('');
    setMaterial(undefined);
    setTopics('');
    setMaxMembers(6);
    setFeedback('');
  };

  const submitLecture = async () => {
    if (!material) {
      setFeedback('방을 열기 전에 PDF 강의자료를 먼저 올려주세요.');
      return;
    }
    setBusy(true);
    setFeedback('');
    const result = await createLecture({
      roomId: activeRoomId || myRooms[0]?.id,
      title,
      subject,
      location,
      material,
      topics: topics
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
      visibility,
      maxMembers,
    });
    setBusy(false);
    if (!result.ok) {
      setFeedback(result.message);
      return;
    }
    setCreateOpen(false);
    resetCreate();
    onOpenLecture(result.data.id);
  };

  const submitJoin = async () => {
    setFeedback('');
    const result = await joinRoom(code);
    if (!result.ok) {
      setFeedback(result.message);
      return;
    }
    setActiveRoomId(result.data.id);
    setFeedback(`${result.data.name}에 참여했어요! 🎉`);
    setCode('');
    setTimeout(() => setJoinOpen(false), 650);
  };

  return (
    <>
      <ScrollView
        style={styles.page}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <ScreenTitle
          title="함께 듣는 수업 🎨"
          subtitle="방에 들어가 다같이 필기해요"
          action={
            <Pressable
              onPress={() => {
                setFeedback('');
                setJoinOpen(true);
              }}
              style={styles.joinHeader}>
              <AppText style={styles.joinHeaderText}>코드 등록</AppText>
            </Pressable>
          }
        />

        <View style={styles.segment}>
          <Pressable
            onPress={() => setVisibility('friends')}
            style={[
              styles.segmentItem,
              visibility === 'friends' && styles.segmentActive,
            ]}>
            <AppText
              style={[
                styles.segmentText,
                visibility === 'friends' && styles.segmentTextActive,
              ]}>
              친구들끼리 🧡
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setVisibility('public')}
            style={[
              styles.segmentItem,
              visibility === 'public' && styles.segmentActive,
            ]}>
            <AppText
              style={[
                styles.segmentText,
                visibility === 'public' && styles.segmentTextActive,
              ]}>
              아무나 함께 🌍
            </AppText>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomChips}>
          {myRooms.map(room => (
            <Pressable
              key={room.id}
              onPress={() => setActiveRoomId(room.id)}
              style={[
                styles.roomChip,
                activeRoomId === room.id && styles.roomChipActive,
              ]}>
              <AppText
                style={[
                  styles.roomChipText,
                  activeRoomId === room.id && styles.roomChipTextActive,
                ]}>
                {findUser(room.ownerId)?.avatar} {room.name}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          onPress={() => {
            setFeedback('');
            setCreateOpen(true);
          }}
          style={({pressed}) => [
            styles.createCard,
            pressed && styles.pressed,
          ]}>
          <View style={styles.createIcon}>
            <AppText style={styles.createEmoji}>＋</AppText>
          </View>
          <View style={styles.createCopy}>
            <AppText style={styles.createTitle}>새 수업방 만들기</AppText>
            <AppText style={styles.createSubtitle}>
              PDF 자료와 필기장을 준비해 드릴게요
            </AppText>
          </View>
          <CharacterImage name="tori" style={styles.createCharacter} />
        </Pressable>

        <View style={styles.listHeader}>
          <AppText style={styles.listTitle}>
            {visibility === 'friends' ? '참여 중인 수업' : '공개 수업'}
          </AppText>
          <Pill
            color={colors.mintDark}
            backgroundColor={colors.mintSoft}>
            {filteredLectures.length}개
          </Pill>
        </View>

        {filteredLectures.length ? (
          filteredLectures.map((lecture, index) => {
            const room = db.rooms.find(item => item.id === lecture.roomId);
            const host = findUser(lecture.hostId);
            const tint = [colors.blush, colors.lavenderSoft, colors.mintSoft][
              index % 3
            ];
            const status =
              lecture.status === 'live'
                ? '필기 중'
                : lecture.status === 'waiting'
                  ? '대기 중'
                  : '완료';
            return (
              <Pressable
                key={lecture.id}
                onPress={() => onOpenLecture(lecture.id)}
                style={({pressed}) => pressed && styles.pressed}>
                <Card style={styles.lectureCard}>
                  <View style={[styles.lectureIcon, {backgroundColor: tint}]}>
                    <AppText style={styles.lectureEmoji}>
                      {lecture.status === 'live' ? '✏️' : '📕'}
                    </AppText>
                  </View>
                  <View style={styles.lectureCopy}>
                    <View style={styles.lectureTitleLine}>
                      <AppText style={styles.lectureTitle} numberOfLines={1}>
                        {lecture.subject}
                      </AppText>
                      <Pill
                        color={
                          lecture.status === 'live'
                            ? colors.mintDark
                            : colors.pinkDark
                        }
                        backgroundColor={
                          lecture.status === 'live'
                            ? colors.mintSoft
                            : colors.pinkSoft
                        }>
                        {status}
                      </Pill>
                    </View>
                    <AppText style={styles.lectureSubject} numberOfLines={1}>
                      {lecture.title} · {host?.displayName}
                    </AppText>
                    <View style={styles.lectureMetaLine}>
                      <AppText style={styles.lectureMeta}>
                        👥 {room?.memberIds.length ?? 1}/{room?.maxMembers ?? 6}
                      </AppText>
                      <AppText style={styles.lectureMeta}>
                        {room?.visibility === 'public' ? '🌍 공개' : '🔒 코드'}
                      </AppText>
                      <AppText style={styles.lectureMeta}>📍 {lecture.location}</AppText>
                    </View>
                  </View>
                  <AppText style={styles.cardArrow}>›</AppText>
                </Card>
              </Pressable>
            );
          })
        ) : (
          <EmptyState
            emoji="🌍"
            title="아직 공개된 수업이 없어요"
            body="내 수업방을 공개로 열어 첫 번째 공부 친구를 만나보세요."
            action={
              <AppButton
                compact
                title="공개 수업 만들기"
                onPress={() => setCreateOpen(true)}
              />
            }
          />
        )}
      </ScrollView>

      <Sheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        title="새 수업방 만들기">
        <AppText style={styles.sheetIntro}>
          강의자료를 올리고, 함께 들을 친구와 정원을 정해 주세요.
        </AppText>

        <AppText style={styles.sheetLabel}>어느 강꾸방에 만들까요?</AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modalRoomChips}>
          {myRooms.map(room => (
            <Pressable
              key={room.id}
              onPress={() => setActiveRoomId(room.id)}
              style={[
                styles.roomChip,
                activeRoomId === room.id && styles.roomChipActive,
              ]}>
              <AppText
                style={[
                  styles.roomChipText,
                  activeRoomId === room.id && styles.roomChipTextActive,
                ]}>
                {room.name}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <Field
          label="수업 이름"
          value={title}
          onChangeText={setTitle}
          placeholder="예: 디지털 마케팅 전략"
          style={styles.field}
        />
        <Field
          label="오늘의 주제"
          value={subject}
          onChangeText={setSubject}
          placeholder="예: STP 분석 같이 들어요"
          style={styles.field}
        />
        <Field
          label="장소"
          value={location}
          onChangeText={setLocation}
          placeholder="예: 경영관 301호"
          style={styles.field}
        />
        <Field
          label="배울 내용"
          value={topics}
          onChangeText={setTopics}
          placeholder="쉼표로 구분해 주세요"
          style={styles.field}
        />

        <AppText style={styles.sheetLabel}>강의자료 올리기</AppText>
        <Pressable
          onPress={() => void chooseDocument()}
          style={({pressed}) => [
            styles.uploadCard,
            pressed && styles.pressed,
          ]}>
          <View style={styles.uploadIcon}>
            <AppText style={styles.uploadEmoji}>📕</AppText>
          </View>
          <View style={styles.uploadCopy}>
            <AppText style={styles.uploadTitle}>
              {material?.name || 'PDF 파일을 선택해 주세요'}
            </AppText>
            <AppText style={styles.uploadSubtitle}>
              {material
                ? `v1으로 보관 · ${formatFileSize(material.size)}`
                : '방을 열려면 PDF 업로드가 꼭 필요해요'}
            </AppText>
          </View>
          <AppText style={styles.uploadArrow}>＋</AppText>
        </Pressable>

        <AppText style={styles.sheetLabel}>누구와 함께 들을까요?</AppText>
        <View style={styles.choiceRow}>
          <Choice
            selected={visibility === 'friends'}
            emoji="🧡"
            label="친구들끼리"
            onPress={() => setVisibility('friends')}
          />
          <Choice
            selected={visibility === 'public'}
            emoji="🌍"
            label="아무나 함께"
            onPress={() => setVisibility('public')}
          />
        </View>

        <AppText style={styles.sheetLabel}>최대 인원</AppText>
        <View style={styles.capacityRow}>
          {[4, 6, 12, 30].map(capacity => (
            <Pressable
              key={capacity}
              onPress={() => setMaxMembers(capacity)}
              style={[
                styles.capacity,
                maxMembers === capacity && styles.capacityActive,
              ]}>
              <AppText
                style={[
                  styles.capacityText,
                  maxMembers === capacity && styles.capacityTextActive,
                ]}>
                {capacity}명
              </AppText>
            </Pressable>
          ))}
        </View>

        {feedback ? <AppText style={styles.feedback}>{feedback}</AppText> : null}
        <AppButton
          title={busy ? '방을 꾸미는 중…' : '대기방 열기 🎉'}
          disabled={busy || !title.trim() || !subject.trim() || !material}
          onPress={() => void submitLecture()}
          style={styles.submit}
        />
      </Sheet>

      <Sheet
        visible={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="방 코드 등록하기">
        <AppText style={styles.sheetIntro}>
          친구가 알려준 6자리 코드를 등록하면 수업과 같이해요 피드가 연결돼요.
        </AppText>
        <Field
          label="방 코드"
          value={code}
          onChangeText={value => {
            setCode(value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
            setFeedback('');
          }}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="K7QP2A"
          style={styles.field}
        />
        {feedback ? (
          <AppText
            style={[
              styles.feedback,
              feedback.includes('참여했어요') && styles.feedbackSuccess,
            ]}>
            {feedback}
          </AppText>
        ) : null}
        <AppButton
          title="방에 참여하기 →"
          disabled={code.length !== 6}
          onPress={() => void submitJoin()}
          style={styles.submit}
        />
      </Sheet>
    </>
  );
}

function Choice({
  selected,
  emoji,
  label,
  onPress,
}: {
  selected: boolean;
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceActive]}>
      <AppText style={styles.choiceEmoji}>{emoji}</AppText>
      <AppText style={[styles.choiceLabel, selected && styles.choiceLabelActive]}>
        {label}
      </AppText>
    </Pressable>
  );
}

function formatFileSize(size?: number) {
  if (!size) {
    return '크기 확인 안 됨';
  }
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
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
  joinHeader: {
    height: 38,
    borderRadius: 15,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pinkSoft,
  },
  joinHeaderText: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: colors.pinkDark,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#F2E8E6',
    borderRadius: 18,
    marginBottom: 12,
  },
  segmentItem: {
    flex: 1,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...softShadow,
  },
  segmentText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.ink,
  },
  roomChips: {
    gap: 8,
    paddingVertical: 3,
    paddingRight: 18,
  },
  roomChip: {
    height: 35,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: '#E5D8D9',
    justifyContent: 'center',
  },
  roomChipActive: {
    backgroundColor: colors.lavenderSoft,
    borderColor: '#CDB9E8',
  },
  roomChipText: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: colors.muted,
  },
  roomChipTextActive: {
    color: '#756090',
  },
  createCard: {
    minHeight: 92,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E3C9D2',
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,.42)',
  },
  createIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pinkSoft,
  },
  createEmoji: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.pink,
  },
  createCopy: {
    flex: 1,
    marginLeft: 12,
    zIndex: 2,
  },
  createTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
  },
  createSubtitle: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 3,
  },
  createCharacter: {
    width: 84,
    height: 84,
    marginRight: -20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 3,
  },
  listTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  lectureCard: {
    minHeight: 113,
    padding: 14,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lectureIcon: {
    width: 56,
    height: 66,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lectureEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  lectureCopy: {
    flex: 1,
    marginLeft: 12,
  },
  lectureTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  lectureTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
  },
  lectureSubject: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 5,
  },
  lectureMetaLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 8,
  },
  lectureMeta: {
    fontSize: 9.5,
    color: colors.text,
  },
  cardArrow: {
    fontSize: 27,
    color: '#D3C6CD',
    marginLeft: 4,
  },
  sheetIntro: {
    fontSize: 12.5,
    lineHeight: 20,
    color: colors.text,
    marginTop: 4,
    marginBottom: 7,
  },
  sheetLabel: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.ink,
    marginTop: 20,
    marginBottom: 9,
    marginLeft: 3,
  },
  modalRoomChips: {
    gap: 8,
    paddingRight: 20,
  },
  field: {
    marginTop: 14,
  },
  uploadCard: {
    minHeight: 78,
    borderRadius: 19,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CDB9E8',
    backgroundColor: 'rgba(241,233,251,.72)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  uploadIcon: {
    width: 45,
    height: 54,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadEmoji: {
    fontSize: 23,
  },
  uploadCopy: {
    flex: 1,
    marginLeft: 11,
  },
  uploadTitle: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: '#6B5B93',
  },
  uploadSubtitle: {
    fontSize: 9.5,
    color: '#9D8DB3',
    marginTop: 4,
  },
  uploadArrow: {
    fontFamily: fonts.display,
    fontSize: 23,
    color: colors.lavender,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    flex: 1,
    minHeight: 83,
    borderRadius: 18,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceActive: {
    borderColor: colors.pink,
    backgroundColor: colors.blush,
  },
  choiceEmoji: {
    fontSize: 23,
  },
  choiceLabel: {
    fontFamily: fonts.display,
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  choiceLabelActive: {
    color: colors.pinkDark,
  },
  capacityRow: {
    flexDirection: 'row',
    gap: 7,
  },
  capacity: {
    flex: 1,
    height: 43,
    borderRadius: 15,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacityActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: '#F2AFC2',
  },
  capacityText: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: colors.muted,
  },
  capacityTextActive: {
    color: colors.pinkDark,
  },
  feedback: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.danger,
    marginTop: 15,
  },
  feedbackSuccess: {
    color: colors.mintDark,
  },
  submit: {
    marginTop: 20,
  },
  pressed: {
    opacity: 0.78,
    transform: [{scale: 0.99}],
  },
});

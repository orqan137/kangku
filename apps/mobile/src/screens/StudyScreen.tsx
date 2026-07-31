import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
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
import {colors, fonts, shadow} from '../theme';
import {PostTag, StudyPost} from '../types';

const TAGS: PostTag[] = ['자료공유', '질문', '공부인증', '공지'];

const TAG_STYLE: Record<PostTag, {color: string; background: string; emoji: string}> = {
  자료공유: {color: colors.pinkDark, background: colors.pinkSoft, emoji: '📎'},
  질문: {color: '#786897', background: colors.lavenderSoft, emoji: '💭'},
  공부인증: {color: colors.mintDark, background: colors.mintSoft, emoji: '🔥'},
  공지: {color: '#A77733', background: colors.peach, emoji: '📣'},
};

export function StudyScreen() {
  const {
    currentUser,
    db,
    myRooms,
    findUser,
    addPost,
    toggleLike,
    addComment,
  } = useApp();
  const [activeRoomId, setActiveRoomId] = useState(myRooms[0]?.id ?? '');
  const [filter, setFilter] = useState<'전체' | PostTag>('전체');
  const [composeOpen, setComposeOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string>();
  const [tag, setTag] = useState<PostTag>('자료공유');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState('');
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!myRooms.some(room => room.id === activeRoomId)) {
      setActiveRoomId(myRooms[0]?.id ?? '');
    }
  }, [activeRoomId, myRooms]);

  const activeRoom = myRooms.find(room => room.id === activeRoomId) ?? myRooms[0];
  const posts = useMemo(
    () =>
      db.posts.filter(
        post =>
          post.roomId === activeRoom?.id &&
          (filter === '전체' || post.tag === filter),
      ),
    [activeRoom?.id, db.posts, filter],
  );
  const commentPost = db.posts.find(post => post.id === commentPostId);

  if (!currentUser) {
    return null;
  }

  const chooseAttachment = async () => {
    try {
      const [file] = await pick({
        type: [types.pdf, types.images, types.doc, types.docx],
      });
      setAttachment(file.name ?? '공부자료');
    } catch (error) {
      if (
        !isErrorWithCode(error) ||
        error.code !== errorCodes.OPERATION_CANCELED
      ) {
        setFeedback('첨부 파일을 불러오지 못했어요.');
      }
    }
  };

  const submitPost = async () => {
    if (!activeRoom) {
      return;
    }
    setBusy(true);
    const result = await addPost({
      roomId: activeRoom.id,
      tag,
      title,
      body,
      attachmentName: attachment,
    });
    setBusy(false);
    if (!result.ok) {
      setFeedback(result.message);
      return;
    }
    setComposeOpen(false);
    setTitle('');
    setBody('');
    setAttachment('');
    setFeedback('');
  };

  const submitComment = async () => {
    if (!commentPostId || !comment.trim()) {
      return;
    }
    await addComment(commentPostId, comment);
    setComment('');
  };

  return (
    <>
      <ScrollView
        style={styles.page}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <ScreenTitle
          title="같이해요 공부 📚"
          subtitle="수업이 끝나도 자료와 마음을 나눠요"
          action={
            <Pressable
              onPress={() => {
                setFeedback('');
                setComposeOpen(true);
              }}
              style={styles.writeButton}>
              <AppText style={styles.writeIcon}>＋</AppText>
            </Pressable>
          }
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupRow}>
          {myRooms.map((room, index) => {
            const selected = room.id === activeRoom?.id;
            const owner = findUser(room.ownerId);
            return (
              <Pressable
                key={room.id}
                onPress={() => setActiveRoomId(room.id)}
                style={({pressed}) => [
                  styles.groupCard,
                  selected && styles.groupCardSelected,
                  {
                    backgroundColor: [
                      colors.blush,
                      colors.mintSoft,
                      colors.lavenderSoft,
                    ][index % 3],
                  },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.groupTop}>
                  <View style={styles.groupAvatar}>
                    <AppText style={styles.groupAvatarEmoji}>{owner?.avatar}</AppText>
                  </View>
                  {selected ? (
                    <Pill color={colors.pinkDark} backgroundColor={colors.white}>
                      보고 있어요
                    </Pill>
                  ) : null}
                </View>
                <AppText style={styles.groupName} numberOfLines={2}>
                  {room.name}
                </AppText>
                <AppText style={styles.groupMeta}>
                  멤버 {room.memberIds.length} · 새 글{' '}
                  {db.posts.filter(post => post.roomId === room.id).length}
                </AppText>
                <View style={styles.groupCode}>
                  <AppText style={styles.groupCodeText}># {room.code}</AppText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {activeRoom ? (
          <View style={[styles.groupBanner, shadow]}>
            <CharacterImage name="kong" style={styles.groupCharacter} />
            <View style={styles.groupBannerCopy}>
              <AppText style={styles.groupBannerTitle}>{activeRoom.name}</AppText>
              <AppText style={styles.groupBannerSubtitle}>
                오늘의 목표를 나누고 서로 응원해요
              </AppText>
            </View>
            <View style={styles.memberCount}>
              <AppText style={styles.memberCountNumber}>
                {activeRoom.memberIds.length}
              </AppText>
              <AppText style={styles.memberCountLabel}>명</AppText>
            </View>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {(['전체', ...TAGS] as Array<'전체' | PostTag>).map(item => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.filterChip,
                filter === item && styles.filterChipActive,
              ]}>
              <AppText
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}>
                {item === '전체' ? '✨ ' : `${TAG_STYLE[item].emoji} `}
                {item}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.feedHeader}>
          <AppText style={styles.feedTitle}>그룹 소식</AppText>
          <AppText style={styles.feedCount}>{posts.length}개의 글</AppText>
        </View>

        {posts.length ? (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              authorName={findUser(post.authorId)?.displayName ?? '친구'}
              authorAvatar={findUser(post.authorId)?.avatar ?? '🙂'}
              liked={post.likedBy.includes(currentUser.id)}
              onLike={() => void toggleLike(post.id)}
              onComment={() => setCommentPostId(post.id)}
            />
          ))
        ) : (
          <EmptyState
            emoji="📚"
            title="이 주제의 첫 글을 기다려요"
            body="공부 자료, 질문, 오늘의 인증을 편하게 나눠보세요."
            action={
              <AppButton
                compact
                variant="mint"
                title="첫 글 쓰기"
                onPress={() => setComposeOpen(true)}
              />
            }
          />
        )}
      </ScrollView>

      <Sheet
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="새 글 쓰기 ✏️">
        <AppText style={styles.composeRoom}>
          {activeRoom?.name ?? '강꾸 스터디'}
        </AppText>
        <AppText style={styles.composeLabel}>글 종류</AppText>
        <View style={styles.tagGrid}>
          {TAGS.map(item => (
            <Pressable
              key={item}
              onPress={() => setTag(item)}
              style={[
                styles.tagChoice,
                tag === item && {
                  backgroundColor: TAG_STYLE[item].background,
                  borderColor: TAG_STYLE[item].color,
                },
              ]}>
              <AppText style={styles.tagChoiceEmoji}>
                {TAG_STYLE[item].emoji}
              </AppText>
              <AppText
                style={[
                  styles.tagChoiceText,
                  tag === item && {color: TAG_STYLE[item].color},
                ]}>
                {item}
              </AppText>
            </Pressable>
          ))}
        </View>
        <Field
          label="제목"
          value={title}
          onChangeText={setTitle}
          placeholder="친구들이 알아보기 쉬운 제목"
          style={styles.field}
        />
        <Field
          label="내용"
          multiline
          value={body}
          onChangeText={setBody}
          placeholder="오늘 공부한 내용이나 궁금한 점을 적어주세요."
          style={styles.field}
        />
        <AppText style={styles.composeLabel}>공부자료 첨부</AppText>
        <Pressable
          onPress={() => void chooseAttachment()}
          style={styles.attachmentPicker}>
          <AppText style={styles.attachmentIcon}>
            {attachment ? '📄' : '＋'}
          </AppText>
          <View style={styles.attachmentCopy}>
            <AppText style={styles.attachmentTitle}>
              {attachment || '파일 또는 사진 선택'}
            </AppText>
            <AppText style={styles.attachmentHint}>
              PDF, 문서, 이미지를 기기에서 불러올 수 있어요
            </AppText>
          </View>
        </Pressable>
        {feedback ? <AppText style={styles.feedback}>{feedback}</AppText> : null}
        <AppButton
          variant="mint"
          title={busy ? '올리는 중…' : '그룹에 올리기 📚'}
          disabled={busy || !title.trim() || !body.trim()}
          onPress={() => void submitPost()}
          style={styles.submit}
        />
      </Sheet>

      <Sheet
        visible={Boolean(commentPost)}
        onClose={() => setCommentPostId(undefined)}
        title="댓글로 같이 공부해요">
        {commentPost ? (
          <>
            <Card style={styles.commentOriginal}>
              <Pill
                color={TAG_STYLE[commentPost.tag].color}
                backgroundColor={TAG_STYLE[commentPost.tag].background}>
                {commentPost.tag}
              </Pill>
              <AppText style={styles.commentOriginalTitle}>
                {commentPost.title}
              </AppText>
              <AppText style={styles.commentOriginalBody}>
                {commentPost.body}
              </AppText>
            </Card>
            <View style={styles.comments}>
              {commentPost.comments.length ? (
                commentPost.comments.map(item => (
                  <View key={item.id} style={styles.commentRow}>
                    <View style={styles.commentAvatar}>
                      <AppText style={styles.commentAvatarText}>
                        {findUser(item.authorId)?.avatar ?? '🙂'}
                      </AppText>
                    </View>
                    <View style={styles.commentBubble}>
                      <AppText style={styles.commentAuthor}>
                        {findUser(item.authorId)?.displayName ?? '친구'}
                      </AppText>
                      <AppText style={styles.commentBody}>{item.body}</AppText>
                    </View>
                  </View>
                ))
              ) : (
                <AppText style={styles.noComments}>
                  첫 댓글로 공부 친구를 응원해 주세요 💗
                </AppText>
              )}
            </View>
            <Field
              value={comment}
              onChangeText={setComment}
              placeholder="따뜻한 댓글 남기기"
              style={styles.commentField}
            />
            <AppButton
              compact
              title="댓글 등록"
              disabled={!comment.trim()}
              onPress={() => void submitComment()}
              style={styles.commentSubmit}
            />
          </>
        ) : null}
      </Sheet>
    </>
  );
}

function PostCard({
  post,
  authorName,
  authorAvatar,
  liked,
  onLike,
  onComment,
}: {
  post: StudyPost;
  authorName: string;
  authorAvatar: string;
  liked: boolean;
  onLike: () => void;
  onComment: () => void;
}) {
  const tagStyle = TAG_STYLE[post.tag];
  return (
    <Card style={styles.postCard}>
      <View style={styles.postAuthorRow}>
        <View style={styles.postAvatar}>
          <AppText style={styles.postAvatarText}>{authorAvatar}</AppText>
        </View>
        <View style={styles.postAuthorCopy}>
          <AppText style={styles.postAuthor}>{authorName}</AppText>
          <AppText style={styles.postTime}>{relativeTime(post.createdAt)}</AppText>
        </View>
        <Pill color={tagStyle.color} backgroundColor={tagStyle.background}>
          {tagStyle.emoji} {post.tag}
        </Pill>
      </View>
      <AppText style={styles.postTitle}>{post.title}</AppText>
      <AppText style={styles.postBody}>{post.body}</AppText>
      {post.attachmentName ? (
        <View style={styles.postAttachment}>
          <View style={styles.postAttachmentIcon}>
            <AppText style={styles.postAttachmentEmoji}>📄</AppText>
          </View>
          <View style={styles.postAttachmentCopy}>
            <AppText style={styles.postAttachmentName} numberOfLines={1}>
              {post.attachmentName}
            </AppText>
            <AppText style={styles.postAttachmentMeta}>공부자료 · 탭해서 확인</AppText>
          </View>
          <AppText style={styles.postAttachmentArrow}>›</AppText>
        </View>
      ) : null}
      <View style={styles.postActions}>
        <Pressable onPress={onLike} style={styles.postAction}>
          <AppText style={[styles.actionIcon, liked && styles.liked]}>
            {liked ? '♥' : '♡'}
          </AppText>
          <AppText style={[styles.actionText, liked && styles.liked]}>
            좋아요 {post.likedBy.length}
          </AppText>
        </Pressable>
        <Pressable onPress={onComment} style={styles.postAction}>
          <AppText style={styles.actionIcon}>💬</AppText>
          <AppText style={styles.actionText}>댓글 {post.comments.length}</AppText>
        </Pressable>
      </View>
    </Card>
  );
}

function relativeTime(iso: string) {
  const minutes = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (minutes < 60) {
    return `${minutes}분 전`;
  }
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}시간 전` : `${Math.floor(hours / 24)}일 전`;
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
  writeButton: {
    width: 43,
    height: 43,
    borderRadius: 17,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  writeIcon: {
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 29,
    color: colors.white,
  },
  groupRow: {
    gap: 10,
    paddingRight: 18,
    paddingBottom: 3,
  },
  groupCard: {
    width: 175,
    minHeight: 165,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  groupCardSelected: {
    borderColor: colors.pink,
  },
  groupTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarEmoji: {
    fontSize: 24,
  },
  groupName: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink,
    marginTop: 10,
  },
  groupMeta: {
    fontSize: 9.5,
    color: colors.muted,
    marginTop: 5,
  },
  groupCode: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,.65)',
    marginTop: 9,
  },
  groupCodeText: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: colors.text,
    letterSpacing: 1,
  },
  groupBanner: {
    minHeight: 96,
    marginTop: 16,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: colors.mintSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
  },
  groupCharacter: {
    width: 98,
    height: 98,
    marginLeft: -12,
  },
  groupBannerCopy: {
    flex: 1,
  },
  groupBannerTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.mintDark,
  },
  groupBannerSubtitle: {
    fontSize: 9.5,
    lineHeight: 14,
    color: '#718E7B',
    marginTop: 3,
  },
  memberCount: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCountNumber: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 19,
    color: colors.mintDark,
  },
  memberCountLabel: {
    fontSize: 8,
    lineHeight: 10,
    color: colors.muted,
  },
  filterRow: {
    gap: 7,
    paddingVertical: 17,
    paddingRight: 18,
  },
  filterChip: {
    height: 35,
    borderRadius: 15,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  filterChipActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: '#F2AFC2',
  },
  filterText: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: colors.muted,
  },
  filterTextActive: {
    color: colors.pinkDark,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
    paddingHorizontal: 3,
  },
  feedTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  feedCount: {
    fontSize: 10,
    color: colors.muted,
  },
  postCard: {
    padding: 16,
    marginBottom: 12,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#F6ECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontSize: 22,
  },
  postAuthorCopy: {
    flex: 1,
    marginLeft: 9,
  },
  postAuthor: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: colors.ink,
  },
  postTime: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 2,
  },
  postTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    marginTop: 14,
  },
  postBody: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.text,
    marginTop: 7,
  },
  postAttachment: {
    minHeight: 66,
    borderRadius: 16,
    backgroundColor: '#F8F2F4',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 13,
  },
  postAttachmentIcon: {
    width: 41,
    height: 47,
    borderRadius: 10,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAttachmentEmoji: {
    fontSize: 21,
  },
  postAttachmentCopy: {
    flex: 1,
    marginLeft: 10,
  },
  postAttachmentName: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: colors.ink,
  },
  postAttachmentMeta: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 3,
  },
  postAttachmentArrow: {
    fontSize: 22,
    color: '#CFC0C7',
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 12,
    marginTop: 13,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionIcon: {
    fontSize: 17,
    color: colors.muted,
  },
  actionText: {
    fontSize: 10,
    color: colors.muted,
  },
  liked: {
    color: colors.pink,
  },
  composeRoom: {
    fontFamily: fonts.doodleBold,
    fontSize: 16,
    color: colors.mintDark,
    marginTop: 4,
  },
  composeLabel: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.ink,
    marginTop: 19,
    marginBottom: 9,
    marginLeft: 3,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChoice: {
    width: '48.5%',
    height: 56,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  tagChoiceEmoji: {
    fontSize: 19,
  },
  tagChoiceText: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: colors.muted,
  },
  field: {
    marginTop: 14,
  },
  attachmentPicker: {
    minHeight: 70,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CDB9E8',
    backgroundColor: colors.lavenderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
  },
  attachmentIcon: {
    width: 43,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 23,
    color: colors.lavender,
  },
  attachmentCopy: {
    flex: 1,
    marginLeft: 7,
  },
  attachmentTitle: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: '#6B5B93',
  },
  attachmentHint: {
    fontSize: 8.5,
    color: '#9C8BAD',
    marginTop: 3,
  },
  feedback: {
    textAlign: 'center',
    color: colors.danger,
    fontSize: 11,
    marginTop: 12,
  },
  submit: {
    marginTop: 19,
  },
  commentOriginal: {
    marginTop: 7,
    backgroundColor: colors.white,
  },
  commentOriginalTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
    marginTop: 10,
  },
  commentOriginalBody: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.text,
    marginTop: 5,
  },
  comments: {
    gap: 11,
    marginTop: 17,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F6ECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 19,
  },
  commentBubble: {
    flex: 1,
    marginLeft: 8,
    padding: 10,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    backgroundColor: colors.white,
  },
  commentAuthor: {
    fontFamily: fonts.display,
    fontSize: 10,
    color: colors.ink,
  },
  commentBody: {
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.text,
    marginTop: 3,
  },
  noComments: {
    fontFamily: fonts.doodle,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 15,
    paddingVertical: 12,
  },
  commentField: {
    marginTop: 15,
  },
  commentSubmit: {
    marginTop: 10,
  },
  pressed: {
    opacity: 0.78,
    transform: [{scale: 0.99}],
  },
});

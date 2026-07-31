import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  errorCodes,
  isErrorWithCode,
  saveDocuments,
} from '@react-native-documents/picker';
import {PDFDocument, rgb} from 'pdf-lib/dist/pdf-lib.min.js';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Pdf from 'react-native-pdf';
import {captureRef} from 'react-native-view-shot';
import {
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {CharacterImage} from '../components/CharacterImage';
import {
  AppButton,
  AppText,
  BackHeader,
  Card,
  Field,
  Pill,
  Sheet,
} from '../components/ui';
import {useApp} from '../store/AppProvider';
import {resolveAnnotationStrokes} from '../sync/annotationReducer';
import {colors, fonts, shadow, softShadow} from '../theme';
import {Point, Stroke} from '../types';
import {pickPersistentPdf} from '../utils/pickPdf';

const PALETTE = [
  colors.pink,
  colors.lavender,
  colors.mint,
  colors.yellow,
  colors.blue,
  colors.ink,
];

type Mode = 'lobby' | 'board' | 'finish';
type DrawingSurface = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function LectureScreen({
  lectureId,
  onBack,
  onContinueStudy,
}: {
  lectureId: string;
  onBack: () => void;
  onContinueStudy: () => void;
}) {
  const {
    currentUser,
    clearMyStrokes,
    db,
    deleteStroke,
    findUser,
    publishStroke,
    replaceLectureMaterial,
    saveNote,
    sendChat,
    setLectureStatus,
  } = useApp();
  const lecture = db.lectures.find(item => item.id === lectureId);
  const room = db.rooms.find(item => item.id === lecture?.roomId);
  const existingNote = db.notes.find(
    item =>
      item.lectureId === lectureId &&
      item.ownerId === currentUser?.id &&
      item.materialVersionId === lecture?.activeMaterialVersionId,
  );
  const sharedStrokes = useMemo(
    () =>
      resolveAnnotationStrokes(
        db.annotationOperations,
        lectureId,
        lecture?.activeMaterialVersionId ?? '',
      ),
    [
      db.annotationOperations,
      lecture?.activeMaterialVersionId,
      lectureId,
    ],
  );
  const [mode, setMode] = useState<Mode>(
    lecture?.status === 'finished' ? 'finish' : 'lobby',
  );
  const [ready, setReady] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>(
    sharedStrokes.length ? sharedStrokes : (existingNote?.strokes ?? []),
  );
  const [color, setColor] = useState<string>(colors.pink);
  const [size, setSize] = useState(7);
  const [memo, setMemo] = useState(existingNote?.memo ?? '');
  const [memoOpen, setMemoOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState('');
  const [feedback, setFeedback] = useState('');
  const [materialFeedback, setMaterialFeedback] = useState('');
  const [materialBusy, setMaterialBusy] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pdfPageCountKnown, setPdfPageCountKnown] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [boardSize, setBoardSize] = useState({width: 1, height: 1});
  const [pdfAspectRatio, setPdfAspectRatio] = useState(1 / 1.4142);
  const [boardCaptureUri, setBoardCaptureUri] = useState<string>();
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState('');
  const activeStrokeId = useRef<string | undefined>(undefined);
  const strokesRef = useRef(strokes);
  const boardRef = useRef<View>(null);
  const strokesMaterialVersionRef = useRef(
    lecture?.activeMaterialVersionId,
  );
  const activeMaterial = lecture?.materialVersions.find(
    material => material.id === lecture.activeMaterialVersionId,
  );
  const rendersUploadedPdf =
    Boolean(activeMaterial?.uri) &&
    !activeMaterial?.uri.startsWith('demo://');
  const drawingSurface = getDrawingSurface(
    boardSize,
    pdfAspectRatio,
    rendersUploadedPdf,
  );
  const drawingSurfaceRef = useRef<DrawingSurface>(drawingSurface);
  drawingSurfaceRef.current = drawingSurface;

  useEffect(() => {
    const materialChanged =
      strokesMaterialVersionRef.current !==
      lecture?.activeMaterialVersionId;
    if (materialChanged) {
      activeStrokeId.current = undefined;
      strokesMaterialVersionRef.current =
        lecture?.activeMaterialVersionId;
    } else if (activeStrokeId.current) {
      return;
    }
    const next = sharedStrokes.length
      ? sharedStrokes
      : (existingNote?.strokes ?? []);
    strokesRef.current = next;
    setStrokes(next);
  }, [
    existingNote?.strokes,
    lecture?.activeMaterialVersionId,
    sharedStrokes,
  ]);

  useEffect(() => {
    setPageIndex(0);
    setPageCount(1);
    setPdfPageCountKnown(false);
    setPdfError('');
    setPdfAspectRatio(1 / 1.4142);

    if (!rendersUploadedPdf || !activeMaterial) {
      return;
    }

    let cancelled = false;
    const inspectPdf = async () => {
      try {
        const materialPath = decodeURI(
          activeMaterial.uri.replace(/^file:\/\//, ''),
        );
        const originalPdf = await ReactNativeBlobUtil.fs.readFile(
          materialPath,
          'base64',
        );
        const inspectedPdf = await PDFDocument.load(originalPdf);
        if (!cancelled) {
          setPageCount(Math.max(1, inspectedPdf.getPageCount()));
          setPdfPageCountKnown(true);
        }
      } catch {
        if (!cancelled) {
          setPdfError(
            'PDF 정보를 읽지 못했어요. 강의자료를 다시 선택해 주세요.',
          );
        }
      }
    };
    inspectPdf();

    return () => {
      cancelled = true;
    };
  }, [
    activeMaterial,
    lecture?.activeMaterialVersionId,
    rendersUploadedPdf,
  ]);

  const handleBoardLayout = (event: LayoutChangeEvent) => {
    const next = {
      width: Math.max(1, event.nativeEvent.layout.width),
      height: Math.max(1, event.nativeEvent.layout.height),
    };
    setBoardSize(next);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: event => {
          if (!event?.nativeEvent) {
            return;
          }
          const point = toNormalizedPoint(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
            drawingSurfaceRef.current,
          );
          const id = `stroke-${Date.now()}-${Math.random()}`;
          activeStrokeId.current = id;
          setStrokes(previous => [
            ...previous,
            ({
              id,
              color,
              size,
              points: [point],
              authorId: currentUser?.id,
              materialVersionId: lecture?.activeMaterialVersionId,
              pageIndex,
              createdAt: new Date().toISOString(),
            } satisfies Stroke),
          ]);
          strokesRef.current = [
            ...strokesRef.current,
            {
              id,
              color,
              size,
              points: [point],
              authorId: currentUser?.id,
              materialVersionId: lecture?.activeMaterialVersionId,
              pageIndex,
              createdAt: new Date().toISOString(),
            },
          ];
        },
        onPanResponderMove: event => {
          if (!event?.nativeEvent) {
            return;
          }
          const strokeId = activeStrokeId.current;
          if (!strokeId) {
            return;
          }
          const point = toNormalizedPoint(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
            drawingSurfaceRef.current,
          );
          setStrokes(previous =>
            previous.map(stroke =>
              stroke.id === strokeId
                ? {...stroke, points: [...stroke.points, point]}
                : stroke,
            ),
          );
          strokesRef.current = strokesRef.current.map(stroke =>
            stroke.id === strokeId
              ? {...stroke, points: [...stroke.points, point]}
              : stroke,
          );
        },
        onPanResponderRelease: () => {
          const stroke = strokesRef.current.find(
            item => item.id === activeStrokeId.current,
          );
          if (stroke && lecture?.activeMaterialVersionId && currentUser) {
            void publishStroke(
              lectureId,
              lecture.activeMaterialVersionId,
              stroke,
            );
          }
          activeStrokeId.current = undefined;
        },
        onPanResponderTerminate: () => {
          activeStrokeId.current = undefined;
        },
      }),
    [
      color,
      currentUser,
      lecture?.activeMaterialVersionId,
      lectureId,
      pageIndex,
      publishStroke,
      size,
    ],
  );

  if (!currentUser || !lecture || !room) {
    return (
      <View style={styles.page}>
        <BackHeader title="수업을 찾을 수 없어요" onBack={onBack} />
      </View>
    );
  }

  const shareCode = async () => {
    await Share.share({
      title: '강꾸 수업방 초대',
      message: `${lecture.subject} 수업을 같이 들어요 🎨\n방 코드: ${room.code}`,
    });
  };

  const startClass = async () => {
    await setLectureStatus(lecture.id, 'live');
    setMode('board');
  };

  const saveProgress = async (silent = false) => {
    const result = await saveNote(
      lecture.id,
      lecture.activeMaterialVersionId,
      strokesRef.current,
      memo,
    );
    if (!silent) {
      setFeedback(result.ok ? '내 필기를 저장했어요! ✓' : result.message);
      setTimeout(() => setFeedback(''), 1600);
    }
    return result.ok;
  };

  const finishClass = async () => {
    const saved = await saveProgress(true);
    if (saved) {
      try {
        if (boardRef.current) {
          const uri = await captureRef(boardRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
          setBoardCaptureUri(uri);
        }
      } catch {
        setBoardCaptureUri(undefined);
      }
      await setLectureStatus(lecture.id, 'finished');
      setMode('finish');
    }
  };

  const sendMessage = async () => {
    const result = await sendChat(lecture.id, chat);
    if (result.ok) {
      setChat('');
    }
  };

  const replaceMaterial = async () => {
    setMaterialFeedback('');
    setMaterialBusy(true);
    const selected = await pickPersistentPdf();
    if (selected.status === 'selected') {
      const result = await replaceLectureMaterial(
        lecture.id,
        selected.material,
      );
      setMaterialFeedback(
        result.ok
          ? `강의자료를 v${result.data.version}으로 교체했어요. 이전 버전 필기는 그대로 보관돼요.`
          : result.message,
      );
    } else if (selected.status === 'error') {
      setMaterialFeedback(selected.message);
    }
    setMaterialBusy(false);
  };

  const shareNote = async () => {
    await Share.share({
      title: `${lecture.subject} 함께 필기`,
      message: [
        `강꾸에서 ${room.memberIds.length}명이 함께 정리한 수업이에요 💗`,
        `수업: ${lecture.title}`,
        `주제: ${lecture.subject}`,
        `핵심: ${lecture.topics.join(' · ')}`,
        memo ? `내 메모: ${memo}` : '',
        `방 코드: ${room.code}`,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  };

  const exportPdf = async () => {
    if (!rendersUploadedPdf && !boardCaptureUri) {
      setExportFeedback(
        'PDF 미리보기가 없어요. “다시 보기”에서 필기장을 연 뒤 수업을 저장해 주세요.',
      );
      return;
    }

    setExporting(true);
    setExportFeedback('');
    try {
      let pdf: PDFDocument;
      if (rendersUploadedPdf && activeMaterial) {
        const materialPath = decodeURI(
          activeMaterial.uri.replace(/^file:\/\//, ''),
        );
        const originalPdf = await ReactNativeBlobUtil.fs.readFile(
          materialPath,
          'base64',
        );
        pdf = await PDFDocument.load(originalPdf);
        drawStrokesOnPdf(pdf, strokesRef.current, boardSize);
      } else {
        const imagePath = boardCaptureUri!.replace(/^file:\/\//, '');
        const imageBase64 = await ReactNativeBlobUtil.fs.readFile(
          imagePath,
          'base64',
        );
        pdf = await PDFDocument.create();

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 34;
        const page = pdf.addPage([pageWidth, pageHeight]);
        const boardImage = await pdf.embedPng(imageBase64);
        const scale = Math.min(
          (pageWidth - margin * 2) / boardImage.width,
          (pageHeight - margin * 2) / boardImage.height,
        );
        const imageWidth = boardImage.width * scale;
        const imageHeight = boardImage.height * scale;
        page.drawImage(boardImage, {
          x: (pageWidth - imageWidth) / 2,
          y: (pageHeight - imageHeight) / 2,
          width: imageWidth,
          height: imageHeight,
        });
      }

      pdf.setTitle(`${lecture.subject} 함께 필기`);
      pdf.setSubject('강꾸 함께 듣는 수업 필기');
      pdf.setAuthor(currentUser.displayName);
      pdf.setCreator('강꾸');

      const pdfBase64 = await pdf.saveAsBase64({dataUri: false});
      const cachePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/kangku-${lecture.id}.pdf`;
      await ReactNativeBlobUtil.fs.writeFile(cachePath, pdfBase64, 'base64');
      const exportName = `강꾸_${lecture.subject}_v${lecture.materialVersion}_함께필기.pdf`;

      if (Platform.OS === 'android' && Number(Platform.Version) >= 29) {
        const savedUri =
          await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
            {
              name: exportName,
              parentFolder: '강꾸',
              mimeType: 'application/pdf',
            },
            'Download',
            cachePath,
          );
        setExportFeedback(
          savedUri
            ? '다운로드/강꾸 폴더에 PDF로 저장했어요! ✓'
            : '파일 저장 중 문제가 생겼어요. 다시 시도해 주세요.',
        );
      } else {
        const result = await saveDocuments({
          sourceUris: [encodeURI(`file://${cachePath}`)],
          fileName: exportName,
          mimeType: 'application/pdf',
          copy: true,
        });
        setExportFeedback(
          result[0]?.error
            ? '파일 저장 중 문제가 생겼어요. 다시 시도해 주세요.'
            : 'PDF로 저장했어요! ✓',
        );
      }
    } catch (error) {
      if (
        !isErrorWithCode(error) ||
        error.code !== errorCodes.OPERATION_CANCELED
      ) {
        setExportFeedback('PDF를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setExporting(false);
    }
  };

  if (mode === 'lobby') {
    return (
      <View style={styles.page}>
        <BackHeader
          title={lecture.subject}
          subtitle={lecture.title}
          onBack={onBack}
          action={
            <Pill
              color={
                lecture.status === 'live' ? colors.mintDark : colors.pinkDark
              }
              backgroundColor={
                lecture.status === 'live' ? colors.mintSoft : colors.pinkSoft
              }>
              {lecture.status === 'live' ? '필기 중' : '대기 중'}
            </Pill>
          }
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lobbyContent}>
          <View style={styles.lobbyHero}>
            <View>
              <Pill>GAME LOBBY</Pill>
              <AppText style={styles.lobbyTitle}>친구들을 기다리고 있어요</AppText>
              <AppText style={styles.lobbySub}>
                코드를 공유하면 같은 필기장으로 입장해요.
              </AppText>
            </View>
            <CharacterImage name="moa" style={styles.lobbyCharacter} />
          </View>

          <Card style={styles.codeCard}>
            <View>
              <AppText style={styles.codeCaption}>수업방 코드</AppText>
              <AppText style={styles.code}>{room.code}</AppText>
            </View>
            <AppButton
              compact
              variant="secondary"
              title="코드 공유"
              onPress={() => void shareCode()}
            />
          </Card>

          <View style={styles.lobbySectionHeader}>
            <AppText style={styles.lobbySectionTitle}>
              참가자 {room.memberIds.length}/{room.maxMembers}
            </AppText>
            <View style={styles.onlineDot} />
            <AppText style={styles.onlineText}>연결됨</AppText>
          </View>
          <View style={styles.memberGrid}>
            {room.memberIds.map((id, index) => {
              const user = findUser(id);
              return (
                <Card key={id} style={styles.memberCard}>
                  <View
                    style={[
                      styles.memberAvatar,
                      {
                        backgroundColor: [
                          '#F6ECE4',
                          colors.lavenderSoft,
                          colors.mintSoft,
                          colors.blush,
                        ][index % 4],
                      },
                    ]}>
                    <AppText style={styles.memberEmoji}>
                      {user?.avatar ?? '🙂'}
                    </AppText>
                  </View>
                  <AppText style={styles.memberName}>
                    {user?.displayName ?? '친구'}
                  </AppText>
                  <Pill
                    color={
                      id === currentUser.id && ready
                        ? colors.mintDark
                        : colors.muted
                    }
                    backgroundColor={
                      id === currentUser.id && ready
                        ? colors.mintSoft
                        : '#F3ECEE'
                    }>
                    {id === lecture.hostId
                      ? '방장'
                      : id === currentUser.id && ready
                        ? '준비 완료'
                        : '참여 중'}
                  </Pill>
                </Card>
              );
            })}
            {Array.from({
              length: Math.min(2, Math.max(0, room.maxMembers - room.memberIds.length)),
            }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.emptyMember}>
                <AppText style={styles.emptyMemberPlus}>＋</AppText>
                <AppText style={styles.emptyMemberText}>기다리는 중</AppText>
              </View>
            ))}
          </View>

          <AppText style={styles.lobbySectionTitle}>오늘의 강의자료 📚</AppText>
          <Card style={styles.materialCard}>
            <View style={styles.fileIcon}>
              <AppText style={styles.fileEmoji}>📕</AppText>
            </View>
            <View style={styles.fileCopy}>
              <AppText style={styles.fileName}>{lecture.materialName}</AppText>
              <AppText style={styles.fileMeta}>
                PDF · v{lecture.materialVersion} · 필기장 준비 완료
              </AppText>
            </View>
            {lecture.hostId === currentUser.id ||
            room.ownerId === currentUser.id ? (
              <Pressable
                disabled={materialBusy}
                onPress={() => void replaceMaterial()}
                style={({pressed}) => [
                  styles.materialReplace,
                  pressed && styles.pressed,
                ]}>
                <AppText style={styles.materialReplaceText}>
                  {materialBusy ? '복사 중…' : '자료 교체'}
                </AppText>
              </Pressable>
            ) : (
              <AppText style={styles.fileCheck}>✓</AppText>
            )}
          </Card>
          <View style={styles.materialVersionRow}>
            <Pill
              color={colors.lavender}
              backgroundColor={colors.lavenderSoft}>
              현재 v{lecture.materialVersion}
            </Pill>
            <AppText style={styles.materialVersionText}>
              {lecture.materialVersions.length > 1
                ? `이전 자료 ${lecture.materialVersions.length - 1}개와 필기 보관 중`
                : '첫 번째 강의자료'}
            </AppText>
          </View>
          {materialFeedback ? (
            <AppText style={styles.materialFeedback}>
              {materialFeedback}
            </AppText>
          ) : null}

          <AppText style={styles.waitingCopy}>
            친구들이 들어오고 있어요…
          </AppText>
          <View style={styles.lobbyActions}>
            <AppButton
              title={ready ? '준비 완료 ✓' : '준비하기'}
              variant="secondary"
              onPress={() => setReady(value => !value)}
              style={styles.readyButton}
            />
            <AppButton
              title={
                lecture.status === 'live'
                  ? '필기장 입장 ▶'
                  : '수업 시작하기 ▶'
              }
              onPress={() => void startClass()}
              style={styles.startButton}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (mode === 'finish') {
    return (
      <View style={styles.finishPage}>
        <BackHeader title="수업 기록" onBack={onBack} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.finishContent}>
          <View style={styles.finishHero}>
            <CharacterImage name="nuri" style={styles.finishCharacter} />
            <Pill>MISSION COMPLETE ✨</Pill>
            <AppText style={styles.finishTitle}>수업 끝! 수고했어요</AppText>
            <AppText style={styles.finishSubtitle}>
              {room.memberIds.length}명이 함께 만든 필기가{'\n'}내 보관함에 안전하게
              저장되었어요.
            </AppText>
          </View>

          <Card style={styles.savedCard}>
            <View style={styles.savedFile}>
              <AppText style={styles.savedFileEmoji}>📕</AppText>
            </View>
            <View style={styles.savedCopy}>
              <AppText style={styles.savedName} numberOfLines={1}>
                {lecture.subject}_함께필기
              </AppText>
              <AppText style={styles.savedMeta}>
                {strokes.length}개 펜 스트로크 · 자동 저장됨
              </AppText>
            </View>
            <AppText style={styles.savedCheck}>✓</AppText>
          </Card>

          <AppButton
            title={exporting ? 'PDF 만드는 중…' : 'PDF로 저장하기 📄'}
            disabled={exporting}
            onPress={() => void exportPdf()}
            style={styles.pdfButton}
          />
          {exportFeedback ? (
            <AppText style={styles.exportFeedback}>{exportFeedback}</AppText>
          ) : null}
          <View style={styles.exportActions}>
            <AppButton
              title="내용 공유하기"
              onPress={() => void shareNote()}
              style={styles.exportMain}
            />
            <AppButton
              title="다시 보기"
              variant="secondary"
              onPress={() => setMode('board')}
              style={styles.exportOther}
            />
          </View>

          <AppText style={styles.finishSection}>함께한 친구들 💗</AppText>
          <Card style={styles.matesCard}>
            {room.memberIds.map((id, index) => {
              const user = findUser(id);
              return (
                <View
                  key={id}
                  style={[
                    styles.mateRow,
                    index < room.memberIds.length - 1 && styles.mateBorder,
                  ]}>
                  <View style={styles.mateAvatar}>
                    <AppText style={styles.mateEmoji}>{user?.avatar}</AppText>
                  </View>
                  <View style={styles.mateCopy}>
                    <AppText style={styles.mateName}>{user?.displayName}</AppText>
                    <AppText style={styles.mateMajor}>{user?.major}</AppText>
                  </View>
                  <Pill
                    color={colors.mintDark}
                    backgroundColor={colors.mintSoft}>
                    함께 완료
                  </Pill>
                </View>
              );
            })}
          </Card>

          <Pressable
            onPress={onContinueStudy}
            style={({pressed}) => [
              styles.continueCard,
              pressed && styles.pressed,
            ]}>
            <CharacterImage name="kong" style={styles.continueCharacter} />
            <View style={styles.continueCopy}>
              <AppText style={styles.continueTitle}>
                스터디 그룹으로 이어가기
              </AppText>
              <AppText style={styles.continueSubtitle}>
                자료를 공유하고 복습 약속을 잡아보세요.
              </AppText>
            </View>
            <AppText style={styles.continueArrow}>›</AppText>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const chatMessages = db.chats.filter(item => item.lectureId === lecture.id);

  return (
    <View style={styles.boardPage}>
      <BackHeader
        title="함께 필기 중 ✏️"
        subtitle={`${lecture.title} · ${room.memberIds.length}명 접속`}
        onBack={() => {
          void saveProgress(true);
          setMode('lobby');
        }}
        action={
          <Pressable onPress={() => setChatOpen(true)} style={styles.chatButton}>
            <AppText style={styles.chatButtonIcon}>💬</AppText>
          </Pressable>
        }
      />

      <View style={styles.boardBody}>
        <View
          ref={boardRef}
          collapsable={false}
          onLayout={handleBoardLayout}
          style={[
            styles.boardPaper,
            rendersUploadedPdf && styles.uploadedPdfPaper,
            shadow,
          ]}
          {...panResponder.panHandlers}>
          {rendersUploadedPdf && activeMaterial ? (
            <>
              {pdfPageCountKnown ? (
                <Pdf
                  key={`${activeMaterial.id}-${pageIndex}`}
                  source={{uri: activeMaterial.uri}}
                  page={pageIndex + 1}
                  singlePage
                  scrollEnabled={false}
                  enablePaging={false}
                  enableDoubleTapZoom={false}
                  minScale={1}
                  maxScale={1}
                  fitPolicy={2}
                  trustAllCerts={false}
                  onLoadComplete={(_numberOfPages, _path, sizeValue) => {
                    if (sizeValue.width > 0 && sizeValue.height > 0) {
                      setPdfAspectRatio(
                        sizeValue.width / sizeValue.height,
                      );
                    }
                    setPdfError('');
                  }}
                  onError={() =>
                    setPdfError(
                      'PDF를 열지 못했어요. 강의자료를 다시 선택해 주세요.',
                    )
                  }
                  style={styles.pdfPage}
                />
              ) : (
                <View pointerEvents="none" style={styles.pdfLoading}>
                  <AppText style={styles.pdfErrorEmoji}>📚</AppText>
                  <AppText style={styles.pdfErrorText}>
                    강의자료 페이지를 준비하고 있어요…
                  </AppText>
                </View>
              )}
              {pdfError ? (
                <View pointerEvents="none" style={styles.pdfError}>
                  <AppText style={styles.pdfErrorEmoji}>📄</AppText>
                  <AppText style={styles.pdfErrorText}>{pdfError}</AppText>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.paperTape} />
              <AppText style={styles.paperEyebrow}>오늘의 공동 필기</AppText>
              <AppText style={styles.paperTitle}>{lecture.subject}</AppText>
              <View style={styles.paperRule} />
              {lecture.topics.slice(0, 3).map((topic, index) => (
                <View key={topic} style={styles.topicLine}>
                  <View
                    style={[
                      styles.topicNumber,
                      {
                        backgroundColor: [
                          colors.pinkSoft,
                          colors.lavenderSoft,
                          colors.mintSoft,
                        ][index],
                      },
                    ]}>
                    <AppText style={styles.topicNumberText}>
                      {index + 1}
                    </AppText>
                  </View>
                  <AppText style={styles.topicText}>{topic}</AppText>
                  <View style={styles.topicBlank} />
                </View>
              ))}
              <View style={styles.noteBoxes}>
                <View style={styles.noteBox} />
                <View style={styles.noteBox} />
                <View style={styles.noteBox} />
              </View>
              <View style={styles.paperLines}>
                <View style={[styles.paperLine, {width: '88%'}]} />
                <View style={[styles.paperLine, {width: '62%'}]} />
                <View style={[styles.paperLine, {width: '76%'}]} />
              </View>
            </>
          )}

          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {strokes
              .filter(stroke => (stroke.pageIndex ?? 0) === pageIndex)
              .flatMap(stroke =>
                interpolate(
                  stroke.points.map(point =>
                    toBoardPoint(point, drawingSurface),
                  ),
                  Math.max(3, stroke.size * 0.7),
                ).map((point, index) => (
                  <View
                    key={`${stroke.id}-${index}`}
                    style={[
                      styles.dot,
                      {
                        left: point.x - stroke.size / 2,
                        top: point.y - stroke.size / 2,
                        width: stroke.size,
                        height: stroke.size,
                        borderRadius: stroke.size / 2,
                        backgroundColor: stroke.color,
                      },
                    ]}
                  />
                )),
              )}
          </View>

          <View pointerEvents="none" style={styles.collaboratorCursor}>
            <View style={styles.cursorDot} />
            <AppText style={styles.cursorName}>
              {findUser(room.ownerId)?.displayName}
            </AppText>
          </View>
        </View>

        {rendersUploadedPdf ? (
          <View style={styles.pageNavigator}>
            <Pressable
              disabled={!pdfPageCountKnown || pageIndex === 0}
              onPress={() => setPageIndex(value => Math.max(0, value - 1))}
              style={[
                styles.pageButton,
                (!pdfPageCountKnown || pageIndex === 0) &&
                  styles.pageButtonDisabled,
              ]}>
              <AppText style={styles.pageButtonText}>‹</AppText>
            </Pressable>
            <Pill
              color={colors.lavender}
              backgroundColor={colors.lavenderSoft}>
              {pageIndex + 1} / {pdfPageCountKnown ? pageCount : '…'}쪽
            </Pill>
            <Pressable
              disabled={
                !pdfPageCountKnown || pageIndex >= pageCount - 1
              }
              onPress={() =>
                setPageIndex(value => Math.min(pageCount - 1, value + 1))
              }
              style={[
                styles.pageButton,
                (!pdfPageCountKnown || pageIndex >= pageCount - 1) &&
                  styles.pageButtonDisabled,
              ]}>
              <AppText style={styles.pageButtonText}>›</AppText>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.toolbar, softShadow]}>
          <View style={styles.palette}>
            {PALETTE.map(item => (
              <Pressable
                key={item}
                onPress={() => setColor(item)}
                style={[
                  styles.colorOuter,
                  color === item && styles.colorOuterActive,
                ]}>
                <View style={[styles.colorDot, {backgroundColor: item}]} />
              </Pressable>
            ))}
          </View>
          <View style={styles.toolRow}>
            {[4, 7, 11].map(value => (
              <Pressable
                key={value}
                onPress={() => setSize(value)}
                style={[
                  styles.sizeButton,
                  size === value && styles.sizeButtonActive,
                ]}>
                <View
                  style={[
                    styles.sizeDot,
                    {
                      width: value,
                      height: value,
                      borderRadius: value / 2,
                      backgroundColor: color,
                    },
                  ]}
                />
              </Pressable>
            ))}
            <View style={styles.toolSpacer} />
            <Pressable
              onPress={() => setMemoOpen(true)}
              style={styles.toolButton}>
              <AppText style={styles.toolEmoji}>📝</AppText>
            </Pressable>
            <Pressable
              onPress={() => {
                const ownedIndex = findLastOwnedStroke(
                  strokesRef.current,
                  currentUser.id,
                );
                if (ownedIndex < 0) {
                  return;
                }
                const target = strokesRef.current[ownedIndex];
                const next = strokesRef.current.filter(
                  (_, index) => index !== ownedIndex,
                );
                strokesRef.current = next;
                setStrokes(next);
                void deleteStroke(
                  lecture.id,
                  lecture.activeMaterialVersionId,
                  target.id,
                );
              }}
              style={styles.toolButton}>
              <AppText style={styles.toolEmoji}>↩</AppText>
            </Pressable>
            <Pressable
              onPress={() => {
                const next = strokesRef.current.filter(
                  stroke =>
                    stroke.authorId && stroke.authorId !== currentUser.id,
                );
                strokesRef.current = next;
                setStrokes(next);
                void clearMyStrokes(
                  lecture.id,
                  lecture.activeMaterialVersionId,
                );
              }}
              style={styles.toolButton}>
              <AppText style={styles.toolEmoji}>🧹</AppText>
            </Pressable>
          </View>
        </View>

        {feedback ? <AppText style={styles.saveFeedback}>{feedback}</AppText> : null}
        <View style={styles.boardActions}>
          <AppButton
            compact
            variant="secondary"
            title="중간 저장"
            onPress={() => void saveProgress()}
            style={styles.boardSave}
          />
          <AppButton
            compact
            title="수업 끝내고 저장 💾"
            onPress={() => void finishClass()}
            style={styles.boardFinish}
          />
        </View>
      </View>

      <Sheet
        visible={memoOpen}
        onClose={() => setMemoOpen(false)}
        title="내 메모 남기기 📝">
        <Field
          multiline
          value={memo}
          onChangeText={setMemo}
          placeholder="나만 볼 수 있는 복습 메모를 적어보세요."
          style={styles.memoField}
        />
        <AppButton
          title="메모 저장하기"
          onPress={() => {
            void saveProgress(true);
            setMemoOpen(false);
          }}
          style={styles.sheetAction}
        />
      </Sheet>

      <Sheet
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        title="수업 채팅 💬">
        <View style={styles.chatList}>
          {chatMessages.map(message => {
            const mine = message.authorId === currentUser.id;
            return (
              <View
                key={message.id}
                style={[styles.chatMessage, mine && styles.chatMessageMine]}>
                {!mine ? (
                  <AppText style={styles.chatAuthor}>
                    {findUser(message.authorId)?.displayName}
                  </AppText>
                ) : null}
                <View style={[styles.bubble, mine && styles.bubbleMine]}>
                  <AppText style={styles.bubbleText}>{message.body}</AppText>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.chatComposer}>
          <TextInput
            value={chat}
            onChangeText={setChat}
            placeholder="수업 친구들에게 말하기"
            placeholderTextColor={colors.muted}
            selectionColor={colors.pink}
            style={styles.chatInput}
          />
          <Pressable
            disabled={!chat.trim()}
            onPress={() => void sendMessage()}
            style={[styles.sendButton, !chat.trim() && styles.sendDisabled]}>
            <AppText style={styles.sendText}>↑</AppText>
          </Pressable>
        </View>
      </Sheet>
    </View>
  );
}

function findLastOwnedStroke(strokes: Stroke[], userId: string) {
  for (let index = strokes.length - 1; index >= 0; index -= 1) {
    if (!strokes[index].authorId || strokes[index].authorId === userId) {
      return index;
    }
  }
  return -1;
}

function drawStrokesOnPdf(
  pdf: PDFDocument,
  strokes: Stroke[],
  boardSize: {width: number; height: number},
) {
  const pages = pdf.getPages();
  strokes.forEach(stroke => {
    const page = pages[stroke.pageIndex ?? 0];
    if (!page || stroke.points.length === 0) {
      return;
    }

    const {width, height} = page.getSize();
    const points = stroke.points.map(point => {
      const normalized =
        point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1
          ? point
          : {
              x: clamp01(point.x / Math.max(1, boardSize.width)),
              y: clamp01(point.y / Math.max(1, boardSize.height)),
            };
      return {
        x: normalized.x * width,
        y: (1 - normalized.y) * height,
      };
    });
    const strokeColor = hexToPdfColor(stroke.color);
    const thickness = Math.max(
      0.8,
      (stroke.size / Math.max(320, boardSize.width)) * width,
    );

    if (points.length === 1) {
      page.drawCircle({
        x: points[0].x,
        y: points[0].y,
        size: thickness / 2,
        color: strokeColor,
        opacity: 0.88,
      });
      return;
    }

    for (let index = 1; index < points.length; index += 1) {
      page.drawLine({
        start: points[index - 1],
        end: points[index],
        thickness,
        color: strokeColor,
        opacity: 0.88,
      });
    }
  });
}

function hexToPdfColor(hexColor: string) {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hexColor);
  if (!match) {
    return rgb(0.33, 0.31, 0.35);
  }
  return rgb(
    Number.parseInt(match[1], 16) / 255,
    Number.parseInt(match[2], 16) / 255,
    Number.parseInt(match[3], 16) / 255,
  );
}

function interpolate(points: Point[], step: number) {
  if (points.length < 2) {
    return points;
  }
  const result: Point[] = [points[0]];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const segments = Math.max(1, Math.ceil(distance / step));
    for (let part = 1; part <= segments; part += 1) {
      result.push({
        x: previous.x + (dx * part) / segments,
        y: previous.y + (dy * part) / segments,
      });
    }
  }
  return result;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getDrawingSurface(
  boardSize: {width: number; height: number},
  pageAspectRatio: number,
  containsPdf: boolean,
): DrawingSurface {
  if (!containsPdf) {
    return {left: 0, top: 0, ...boardSize};
  }

  const boardAspectRatio = boardSize.width / boardSize.height;
  if (boardAspectRatio > pageAspectRatio) {
    const width = boardSize.height * pageAspectRatio;
    return {
      left: (boardSize.width - width) / 2,
      top: 0,
      width,
      height: boardSize.height,
    };
  }

  const height = boardSize.width / pageAspectRatio;
  return {
    left: 0,
    top: (boardSize.height - height) / 2,
    width: boardSize.width,
    height,
  };
}

function toNormalizedPoint(
  x: number,
  y: number,
  surface: DrawingSurface,
): Point {
  return {
    x: clamp01((x - surface.left) / surface.width),
    y: clamp01((y - surface.top) / surface.height),
  };
}

function toBoardPoint(point: Point, surface: DrawingSurface) {
  const isNormalized =
    point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
  return isNormalized
    ? {
        x: surface.left + point.x * surface.width,
        y: surface.top + point.y * surface.height,
      }
    : point;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  lobbyContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 30,
  },
  lobbyHero: {
    minHeight: 130,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lobbyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginTop: 10,
  },
  lobbySub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 5,
  },
  lobbyCharacter: {
    position: 'absolute',
    width: 150,
    height: 150,
    right: -18,
    bottom: -18,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  codeCaption: {
    fontSize: 11,
    color: colors.muted,
  },
  code: {
    fontFamily: fonts.display,
    fontSize: 27,
    letterSpacing: 4,
    color: colors.pink,
    marginTop: 2,
  },
  lobbySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  lobbySectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.mint,
    marginLeft: 'auto',
  },
  onlineText: {
    fontSize: 10,
    color: colors.mintDark,
    marginLeft: 5,
  },
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 24,
  },
  memberCard: {
    width: '31.5%',
    minHeight: 140,
    padding: 11,
    alignItems: 'center',
  },
  memberAvatar: {
    width: 47,
    height: 47,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberEmoji: {
    fontSize: 27,
  },
  memberName: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: colors.ink,
    marginVertical: 7,
  },
  emptyMember: {
    width: '31.5%',
    minHeight: 140,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DED0D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMemberPlus: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: '#CBBBC1',
  },
  emptyMemberText: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 4,
  },
  materialCard: {
    minHeight: 82,
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
  },
  fileIcon: {
    width: 45,
    height: 55,
    borderRadius: 10,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileEmoji: {
    fontSize: 24,
  },
  fileCopy: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
  },
  fileMeta: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
  },
  fileCheck: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.mint,
  },
  materialReplace: {
    height: 34,
    borderRadius: 13,
    paddingHorizontal: 11,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialReplaceText: {
    fontFamily: fonts.display,
    fontSize: 10,
    color: '#6B5B93',
  },
  materialVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
    marginHorizontal: 3,
  },
  materialVersionText: {
    flex: 1,
    fontSize: 9,
    color: colors.muted,
  },
  materialFeedback: {
    fontFamily: fonts.doodleBold,
    fontSize: 11,
    lineHeight: 16,
    color: colors.pinkDark,
    marginTop: 7,
    marginHorizontal: 4,
  },
  waitingCopy: {
    fontFamily: fonts.doodleBold,
    fontSize: 15,
    textAlign: 'center',
    color: '#B7A2B2',
    marginTop: 19,
  },
  lobbyActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },
  readyButton: {
    flex: 0.42,
  },
  startButton: {
    flex: 0.58,
  },
  boardPage: {
    flex: 1,
    backgroundColor: '#F3ECEE',
  },
  boardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  chatButton: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonIcon: {
    fontSize: 19,
  },
  boardPaper: {
    flex: 1,
    minHeight: 360,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFDFC',
    paddingHorizontal: 22,
    paddingTop: 26,
  },
  uploadedPdfPaper: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  pdfPage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFDFC',
  },
  pdfError: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 38,
    backgroundColor: '#FFFDFC',
  },
  pdfLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDFC',
  },
  pdfErrorEmoji: {
    fontSize: 34,
  },
  pdfErrorText: {
    marginTop: 10,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  paperTape: {
    position: 'absolute',
    width: 70,
    height: 21,
    top: -5,
    left: '40%',
    backgroundColor: 'rgba(251,212,107,.45)',
    transform: [{rotate: '-3deg'}],
  },
  paperEyebrow: {
    fontFamily: fonts.doodleBold,
    fontSize: 13,
    color: colors.pink,
  },
  paperTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.ink,
    marginTop: 3,
  },
  paperRule: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.pinkSoft,
    marginTop: 11,
    marginBottom: 12,
  },
  topicLine: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicNumberText: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: colors.ink,
  },
  topicText: {
    fontFamily: fonts.doodleBold,
    fontSize: 15,
    color: colors.text,
    marginLeft: 9,
  },
  topicBlank: {
    flex: 1,
    height: 7,
    marginLeft: 10,
    borderRadius: 4,
    backgroundColor: '#F0E9EC',
  },
  noteBoxes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  noteBox: {
    flex: 1,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F8F2F4',
  },
  paperLines: {
    gap: 9,
    marginTop: 18,
  },
  paperLine: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F0E9EC',
  },
  dot: {
    position: 'absolute',
    opacity: 0.88,
  },
  collaboratorCursor: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lavender,
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cursorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginRight: 4,
  },
  cursorName: {
    fontSize: 8,
    color: colors.white,
  },
  pageNavigator: {
    height: 34,
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pageButton: {
    width: 34,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  pageButtonDisabled: {
    opacity: 0.35,
  },
  pageButtonText: {
    color: colors.lavender,
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 25,
  },
  toolbar: {
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 9,
    marginTop: 9,
  },
  palette: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  colorOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOuterActive: {
    borderWidth: 2,
    borderColor: colors.ink,
  },
  colorDot: {
    width: 19,
    height: 19,
    borderRadius: 10,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  sizeButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButtonActive: {
    backgroundColor: '#F3ECEE',
  },
  sizeDot: {},
  toolSpacer: {
    flex: 1,
  },
  toolButton: {
    width: 39,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#F3ECEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  toolEmoji: {
    fontSize: 18,
  },
  boardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 9,
  },
  boardSave: {
    flex: 0.34,
  },
  boardFinish: {
    flex: 0.66,
  },
  saveFeedback: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 72,
    zIndex: 3,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: colors.ink,
    color: colors.white,
    fontSize: 11,
  },
  memoField: {
    marginTop: 8,
  },
  sheetAction: {
    marginTop: 16,
  },
  chatList: {
    gap: 13,
    paddingVertical: 9,
  },
  chatMessage: {
    alignSelf: 'flex-start',
    maxWidth: '84%',
  },
  chatMessageMine: {
    alignSelf: 'flex-end',
  },
  chatAuthor: {
    fontSize: 9,
    color: colors.muted,
    marginLeft: 6,
    marginBottom: 3,
  },
  bubble: {
    borderRadius: 5,
    borderTopRightRadius: 17,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    backgroundColor: colors.white,
    paddingHorizontal: 13,
    paddingVertical: 10,
    ...softShadow,
  },
  bubbleMine: {
    borderRadius: 5,
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    backgroundColor: colors.pinkSoft,
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  chatComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  chatInput: {
    flex: 1,
    height: 48,
    borderRadius: 18,
    paddingHorizontal: 15,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 17,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendText: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 21,
  },
  finishPage: {
    flex: 1,
    backgroundColor: '#FCF1F2',
  },
  finishContent: {
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 35,
  },
  finishHero: {
    minHeight: 240,
    alignItems: 'center',
    paddingTop: 123,
  },
  finishCharacter: {
    position: 'absolute',
    width: 150,
    height: 150,
    top: -12,
  },
  finishTitle: {
    fontFamily: fonts.display,
    fontSize: 27,
    color: colors.ink,
    marginTop: 9,
  },
  finishSubtitle: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
    color: colors.text,
    marginTop: 6,
  },
  savedCard: {
    minHeight: 91,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
  },
  savedFile: {
    width: 49,
    height: 61,
    borderRadius: 11,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedFileEmoji: {
    fontSize: 26,
  },
  savedCopy: {
    flex: 1,
    marginLeft: 12,
  },
  savedName: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.ink,
  },
  savedMeta: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 5,
  },
  savedCheck: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.mint,
  },
  exportActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 9,
  },
  pdfButton: {
    marginTop: 12,
  },
  exportFeedback: {
    fontSize: 10,
    color: colors.pinkDark,
    textAlign: 'center',
    marginTop: 7,
  },
  exportMain: {
    flex: 1,
  },
  exportOther: {
    width: 106,
  },
  finishSection: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
    marginTop: 25,
    marginBottom: 11,
    marginLeft: 3,
  },
  matesCard: {
    paddingVertical: 2,
  },
  mateRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mateBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  mateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6ECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mateEmoji: {
    fontSize: 22,
  },
  mateCopy: {
    flex: 1,
    marginLeft: 10,
  },
  mateName: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
  },
  mateMajor: {
    fontSize: 9.5,
    color: colors.muted,
    marginTop: 2,
  },
  continueCard: {
    minHeight: 96,
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: '#CBE6D6',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: 15,
  },
  continueCharacter: {
    width: 92,
    height: 92,
    marginLeft: -8,
  },
  continueCopy: {
    flex: 1,
  },
  continueTitle: {
    fontFamily: fonts.display,
    color: colors.mintDark,
    fontSize: 14,
  },
  continueSubtitle: {
    fontSize: 9.5,
    lineHeight: 14,
    color: '#6E8D79',
    marginTop: 3,
  },
  continueArrow: {
    fontSize: 25,
    color: colors.mint,
  },
  pressed: {
    opacity: 0.78,
    transform: [{scale: 0.99}],
  },
});

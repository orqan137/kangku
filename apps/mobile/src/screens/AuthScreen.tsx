import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {CharacterImage} from '../components/CharacterImage';
import {AppButton, AppText, Card, Field, Pill} from '../components/ui';
import {useApp} from '../store/AppProvider';
import {colors, fonts, shadow, type} from '../theme';

export function AuthScreen() {
  const {signIn, signUp} = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setMessage('');
    setBusy(true);
    const result =
      mode === 'login'
        ? await signIn(loginId, password)
        : await signUp(loginId, password, name, major);
    if (!result.ok) {
      setMessage(result.message);
    }
    setBusy(false);
  };

  const demoLogin = async () => {
    setLoginId('demo');
    setPassword('kangku123');
    setMessage('');
    setBusy(true);
    const result = await signIn('demo', 'kangku123');
    if (!result.ok) {
      setMessage(result.message);
    }
    setBusy(false);
  };

  const changeMode = (next: 'login' | 'signup') => {
    setMode(next);
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}>
        <View style={styles.sparkleOne}>
          <AppText style={styles.sparkle}>✦</AppText>
        </View>
        <View style={styles.sparkleTwo}>
          <AppText style={styles.sparkleSmall}>♡</AppText>
        </View>

        <View style={styles.brand}>
          <View style={styles.brandLine}>
            <AppText style={type.hero}>강꾸</AppText>
            <AppText style={styles.heart}>♡</AppText>
          </View>
          <AppText style={styles.slogan}>Decorate your lecture!</AppText>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBubble}>
            <Pill>함께라서 더 즐거운 공부</Pill>
            <AppText style={styles.heroTitle}>
              친구들과 수업을 듣고{'\n'}필기를 함께 꾸며요
            </AppText>
          </View>
          <CharacterImage name="mongle" style={styles.character} />
        </View>

        <Card style={styles.formCard}>
          <View style={styles.tabs}>
            <Pressable
              onPress={() => changeMode('login')}
              style={[styles.tab, mode === 'login' && styles.tabActive]}>
              <AppText
                style={[styles.tabLabel, mode === 'login' && styles.tabLabelActive]}>
                로그인
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => changeMode('signup')}
              style={[styles.tab, mode === 'signup' && styles.tabActive]}>
              <AppText
                style={[
                  styles.tabLabel,
                  mode === 'signup' && styles.tabLabelActive,
                ]}>
                회원가입
              </AppText>
            </Pressable>
          </View>

          <Field
            label="아이디"
            value={loginId}
            onChangeText={setLoginId}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            placeholder="4자 이상 입력해 주세요"
            style={styles.field}
          />
          <Field
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
            placeholder="8자 이상 입력해 주세요"
            style={styles.field}
          />

          {mode === 'signup' ? (
            <>
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
              <View style={styles.codeHint}>
                <AppText style={styles.codeHintIcon}>🎟️</AppText>
                <AppText style={styles.codeHintText}>
                  가입과 동시에 나만의 6자리 강꾸방 코드가 생겨요.
                </AppText>
              </View>
            </>
          ) : null}

          {message ? <AppText style={styles.error}>{message}</AppText> : null}

          <AppButton
            title={
              busy
                ? '잠시만요…'
                : mode === 'login'
                  ? '강꾸 시작하기 →'
                  : '내 강꾸방 만들기 ✨'
            }
            disabled={busy}
            onPress={() => {
              void submit();
            }}
            style={styles.submit}
          />

          {mode === 'login' ? (
            <Pressable disabled={busy} onPress={() => void demoLogin()}>
              <AppText style={styles.demo}>
                먼저 둘러볼래요 · demo / kangku123
              </AppText>
            </Pressable>
          ) : null}
        </Card>

        <AppText style={styles.footer}>
          강꾸와 함께 예쁘게 공부해요 💗
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
  },
  brand: {
    marginTop: 8,
    zIndex: 2,
  },
  brandLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  heart: {
    fontFamily: fonts.doodleBold,
    fontSize: 35,
    lineHeight: 42,
    color: colors.pink,
    transform: [{rotate: '-12deg'}],
  },
  slogan: {
    fontFamily: fonts.doodle,
    fontSize: 19,
    lineHeight: 22,
    color: '#B7A2B2',
    letterSpacing: 0.6,
  },
  hero: {
    minHeight: 175,
    marginTop: 5,
    justifyContent: 'center',
  },
  heroBubble: {
    width: '75%',
    zIndex: 2,
  },
  heroTitle: {
    marginTop: 10,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 30,
    color: colors.ink,
  },
  character: {
    position: 'absolute',
    right: -25,
    bottom: -18,
    width: 175,
    height: 175,
  },
  sparkleOne: {
    position: 'absolute',
    right: 35,
    top: 23,
  },
  sparkleTwo: {
    position: 'absolute',
    right: 92,
    top: 91,
  },
  sparkle: {
    fontSize: 23,
    color: colors.yellow,
  },
  sparkleSmall: {
    fontFamily: fonts.doodleBold,
    fontSize: 25,
    color: colors.pink,
  },
  formCard: {
    borderRadius: 28,
    padding: 20,
    ...shadow,
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#F6ECE9',
    borderRadius: 18,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadow,
    shadowOpacity: 0.07,
    elevation: 1,
  },
  tabLabel: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.pinkDark,
  },
  field: {
    marginTop: 12,
  },
  codeHint: {
    marginTop: 14,
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.lavenderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeHintIcon: {
    fontSize: 22,
  },
  codeHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#786897',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
  submit: {
    marginTop: 18,
  },
  demo: {
    fontFamily: fonts.doodle,
    fontSize: 15,
    color: '#A792A1',
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    fontFamily: fonts.doodle,
    textAlign: 'center',
    color: '#C6BAC2',
    fontSize: 15,
    marginTop: 22,
  },
});


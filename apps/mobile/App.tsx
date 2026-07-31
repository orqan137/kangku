import React, {useState} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {BottomNav, MainTab} from './src/components/BottomNav';
import {CharacterImage} from './src/components/CharacterImage';
import {AppText} from './src/components/ui';
import {ClassesScreen} from './src/screens/ClassesScreen';
import {AuthScreen} from './src/screens/AuthScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {LectureScreen} from './src/screens/LectureScreen';
import {MyScreen} from './src/screens/MyScreen';
import {StudyScreen} from './src/screens/StudyScreen';
import {AppProvider, useApp} from './src/store/AppProvider';
import {colors, fonts} from './src/theme';

function KangkuApp() {
  const {ready, currentUser} = useApp();
  const [tab, setTab] = useState<MainTab>('home');
  const [lectureId, setLectureId] = useState<string>();

  if (!ready) {
    return (
      <SafeAreaView style={styles.splash}>
        <CharacterImage name="mongle" style={styles.splashCharacter} />
        <AppText style={styles.splashBrand}>강꾸</AppText>
        <AppText style={styles.splashText}>오늘의 공부방을 꾸미는 중…</AppText>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <AuthScreen />
      </SafeAreaView>
    );
  }

  if (lectureId) {
    return (
      <SafeAreaView style={styles.safe}>
        <LectureScreen
          lectureId={lectureId}
          onBack={() => setLectureId(undefined)}
          onContinueStudy={() => {
            setLectureId(undefined);
            setTab('study');
          }}
        />
      </SafeAreaView>
    );
  }

  const openTab = (next: MainTab) => {
    setLectureId(undefined);
    setTab(next);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.main}>
        {tab === 'home' ? (
          <HomeScreen
            onOpenClasses={() => openTab('classes')}
            onOpenStudy={() => openTab('study')}
            onOpenMy={() => openTab('my')}
            onOpenLecture={setLectureId}
          />
        ) : null}
        {tab === 'classes' ? (
          <ClassesScreen onOpenLecture={setLectureId} />
        ) : null}
        {tab === 'study' ? <StudyScreen /> : null}
        {tab === 'my' ? (
          <MyScreen
            onOpenClasses={() => openTab('classes')}
            onOpenStudy={() => openTab('study')}
            onOpenLecture={setLectureId}
          />
        ) : null}
        <BottomNav active={tab} onChange={openTab} />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        translucent={false}
        backgroundColor={colors.canvas}
        barStyle="dark-content"
      />
      <AppProvider>
        <KangkuApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  main: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashCharacter: {
    width: 190,
    height: 190,
  },
  splashBrand: {
    fontFamily: fonts.display,
    fontSize: 35,
    lineHeight: 43,
    color: colors.ink,
    marginTop: -13,
  },
  splashText: {
    fontFamily: fonts.doodle,
    fontSize: 16,
    color: '#B7A2B2',
    marginTop: 4,
  },
});


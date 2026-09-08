import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { Animated, Easing, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

const STEPS = [
  ['01', 'Reveal your Interest DNA', 'See the useful intersection between what you know and what you want to explore.'],
  ['02', 'Meet your missing piece', 'Find a small creator whose skills complete the idea—not someone with the biggest audience.'],
  ['03', 'Ship something together', 'Start with a clear brief, divided roles and a focused 14-day collaboration sprint.'],
];

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 820;
  const navIn = useRef(new Animated.Value(0)).current;
  const copyIn = useRef(new Animated.Value(0)).current;
  const graphIn = useRef(new Animated.Value(0)).current;
  const linesIn = useRef(new Animated.Value(0)).current;
  const projectIn = useRef(new Animated.Value(0)).current;
  const stepsIn = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const flow = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(navIn, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(copyIn, { toValue: 1, damping: 18, stiffness: 110, useNativeDriver: true }),
      ]),
      Animated.spring(graphIn, { toValue: 1, damping: 18, stiffness: 95, useNativeDriver: true }),
      Animated.timing(linesIn, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(projectIn, { toValue: 1, damping: 15, stiffness: 130, useNativeDriver: true }),
        Animated.stagger(85, stepsIn.map(value => Animated.timing(value, { toValue: 1, duration: 350, useNativeDriver: true }))),
      ]),
    ]).start();
    const flowLoop = Animated.loop(Animated.timing(flow, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }));
    const breatheLoop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    flowLoop.start(); breatheLoop.start();
    return () => { flowLoop.stop(); breatheLoop.stop(); };
  }, [breathe, copyIn, flow, graphIn, linesIn, navIn, projectIn, stepsIn]);

  const enter = (value: Animated.Value, distance = 18) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });
  const projectScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.07] });
  const particleMove = flow.interpolate({ inputRange: [0, 1], outputRange: [0, 126] });

  return (
    <SafeAreaView style={styles.page}>
      <View pointerEvents="none" style={styles.purpleGlow} />
      <View pointerEvents="none" style={styles.orangeGlow} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.shell}>
          <Animated.View style={[styles.nav, enter(navIn, 8)]}>
            <View style={styles.brand}><View style={styles.mark}><View style={styles.markCore} /></View><Text style={styles.wordmark}>TrueSignal</Text></View>
            <View style={styles.creatorFirst}><View style={styles.orangeDot} /><Text style={styles.creatorFirstText}>CREATOR-FIRST PLATFORM</Text></View>
          </Animated.View>

          <View style={[styles.hero, compact && styles.heroCompact]}>
            <Animated.View style={[styles.heroCopy, compact && styles.fullWidth, enter(copyIn, 24)]}>
              <Text style={styles.forCreators}>MADE FOR SMALL CREATORS</Text>
              <Text style={[styles.title, compact && styles.titleCompact]}>Find the creator who <Text style={styles.purple}>completes</Text> your idea.</Text>
              <Text style={styles.body}>Your follower count should not decide who discovers you. TrueSignal matches complementary creators, gives them a reason to meet and helps them ship something together.</Text>
              <View style={styles.outcomes}>
                <View style={styles.outcome}><Text style={styles.outcomeNumber}>3</Text><Text style={styles.outcomeText}>relevant collaborators, not an endless feed</Text></View>
                <View style={styles.divider} />
                <View style={styles.outcome}><Text style={[styles.outcomeNumber, styles.orange]}>14</Text><Text style={styles.outcomeText}>days from first message to shared project</Text></View>
              </View>
              <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/onboarding')} style={styles.primary}>
                <Text style={styles.primaryText}>Find my missing piece</Text><View style={styles.arrow}><Text style={styles.arrowText}>→</Text></View>
              </TouchableOpacity>
              <Text style={styles.caption}>Build your Interest DNA in 90 seconds · no follower count required</Text>
            </Animated.View>

            <Animated.View style={[styles.graphCard, compact && styles.fullWidth, enter(graphIn, 30)]}>
              <View style={styles.graphTop}>
                <View><Text style={styles.graphEyebrow}>COLLABORATION FORMING</Text><Text style={styles.graphTitle}>Two skill sets. One buildable idea.</Text></View>
                <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
              </View>
              <View style={styles.graph}>
                <Animated.View style={[styles.link, styles.leftLink, { opacity: linesIn, transform: [{ rotate: '18deg' }, { scaleX: linesIn }] }]}>
                  <Animated.View style={[styles.particlePurple, { transform: [{ translateX: particleMove }] }]} />
                </Animated.View>
                <Animated.View style={[styles.link, styles.rightLink, { opacity: linesIn, transform: [{ rotate: '-18deg' }, { scaleX: linesIn }] }]}>
                  <Animated.View style={[styles.particleOrange, { transform: [{ translateX: particleMove }] }]} />
                </Animated.View>
                <Animated.View style={[styles.person, styles.you]}><View style={[styles.avatar, styles.youAvatar]}><Text style={styles.avatarText}>YOU</Text></View><Text style={styles.personName}>Technical creator</Text><Text style={styles.personNeed}>has the system</Text></Animated.View>
                <Animated.View style={[styles.person, styles.maya]}><View style={[styles.avatar, styles.mayaAvatar]}><Text style={styles.avatarText}>MC</Text></View><Text style={styles.personName}>Maya Chen</Text><Text style={styles.personNeed}>has the story</Text></Animated.View>
                <Animated.View style={[styles.projectHalo, { transform: [{ scale: projectScale }] }]} />
                <Animated.View style={[styles.project, { opacity: projectIn, transform: [{ scale: projectIn.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }] }]}>
                  <Text style={styles.projectLabel}>POSSIBLE TOGETHER</Text><Text style={styles.projectTitle}>Interactive character</Text><Text style={styles.projectTime}>one-week prototype</Text>
                </Animated.View>
                <View style={[styles.skill, styles.skillAI]}><View style={styles.skillDotPurple} /><Text style={styles.skillText}>AI + CODE</Text></View>
                <View style={[styles.skill, styles.skillStory]}><View style={styles.skillDotOrange} /><Text style={styles.skillText}>STORY + MOTION</Text></View>
              </View>
              <View style={styles.graphResult}><View style={styles.resultMark}><Text style={styles.resultMarkText}>✓</Text></View><View><Text style={styles.resultLabel}>THE MATCH HAS A REASON</Text><Text style={styles.resultText}>Their skills solve each other’s unfinished idea.</Text></View></View>
            </Animated.View>
          </View>

          <View style={[styles.steps, compact && styles.stepsCompact]}>
            {STEPS.map((step, index) => (
              <Animated.View key={step[0]} style={[styles.step, enter(stepsIn[index], 16)]}>
                <View style={[styles.stepNumber, index === 1 && styles.stepNumberOrange]}><Text style={styles.stepNumberText}>{step[0]}</Text></View>
                <Text style={styles.stepTitle}>{step[1]}</Text><Text style={styles.stepText}>{step[2]}</Text>
              </Animated.View>
            ))}
          </View>
          <Text style={styles.finalLine}>Find your people. Share the work. Grow together.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF9F5' },
  scroll: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  shell: { width: '100%', maxWidth: 1080, alignSelf: 'center' },
  purpleGlow: { position: 'absolute', width: 460, height: 460, borderRadius: 230, backgroundColor: '#EEE4FF', right: -250, top: -180, opacity: 0.9 },
  orangeGlow: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: '#FFE5D4', left: -220, bottom: -170, opacity: 0.75 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#E9DDFF', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '7deg' }] },
  markCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.signal },
  wordmark: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.7 },
  creatorFirst: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E6D9F4', backgroundColor: '#FFFFFF', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  orangeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
  creatorFirstText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 1.05 },
  hero: { flexDirection: 'row', gap: 42, alignItems: 'center', paddingTop: 54 },
  heroCompact: { flexDirection: 'column', gap: spacing.xl, paddingTop: 36 },
  heroCopy: { flex: 0.95 },
  fullWidth: { width: '100%' },
  forCreators: { alignSelf: 'flex-start', color: colors.signal, fontSize: 9, fontWeight: '900', letterSpacing: 1.55, backgroundColor: '#E9DDFF', borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 7 },
  title: { color: '#181127', fontSize: 50, lineHeight: 53, fontWeight: '900', letterSpacing: -2.1, marginTop: spacing.md },
  titleCompact: { fontSize: 40, lineHeight: 44 },
  purple: { color: colors.signal },
  body: { color: '#70687A', fontSize: 15, lineHeight: 23, marginTop: spacing.md, maxWidth: 530 },
  outcomes: { flexDirection: 'row', marginTop: spacing.lg },
  outcome: { flex: 1 },
  outcomeNumber: { color: colors.signal, fontSize: 26, fontWeight: '900' },
  orange: { color: colors.orangeDark },
  outcomeText: { color: '#4F4659', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 2, maxWidth: 150 },
  divider: { width: 1, backgroundColor: '#E5DCEB', marginHorizontal: spacing.md },
  primary: { alignSelf: 'flex-start', minWidth: 285, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: spacing.lg, borderRadius: 16, backgroundColor: colors.signal, marginTop: spacing.lg, shadowColor: colors.signal, shadowOpacity: 0.24, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 5 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  arrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: '#FFFFFF', fontSize: 17 },
  caption: { color: '#8C8493', fontSize: 9, marginTop: spacing.sm },
  graphCard: { flex: 1.05, minHeight: 500, borderRadius: 30, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DAF1', padding: spacing.md, shadowColor: colors.signal, shadowOpacity: 0.13, shadowRadius: 25, shadowOffset: { width: 0, height: 14 }, elevation: 6 },
  graphTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  graphEyebrow: { color: colors.orangeDark, fontSize: 8, fontWeight: '900', letterSpacing: 1.35 },
  graphTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 5 },
  live: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: '#FFF0E7', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.orange },
  liveText: { color: colors.orangeDark, fontSize: 7, fontWeight: '900' },
  graph: { flex: 1, minHeight: 350, position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  link: { position: 'absolute', width: 135, height: 1.5, backgroundColor: '#CAB9E8', left: '50%', top: '50%' },
  leftLink: { marginLeft: -158, marginTop: -54 },
  rightLink: { marginLeft: 24, marginTop: -54, backgroundColor: '#F0AE86' },
  particlePurple: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.signal, marginTop: -3 },
  particleOrange: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange, marginTop: -3 },
  person: { position: 'absolute', alignItems: 'center' },
  you: { left: '6%', top: '24%' },
  maya: { right: '6%', top: '24%' },
  avatar: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  youAvatar: { backgroundColor: colors.signal, shadowColor: colors.signal, transform: [{ rotate: '-4deg' }] },
  mayaAvatar: { backgroundColor: colors.orange, shadowColor: colors.orange, transform: [{ rotate: '4deg' }] },
  avatarText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  personName: { color: colors.text, fontSize: 11, fontWeight: '900', marginTop: 8 },
  personNeed: { color: colors.muted, fontSize: 8, marginTop: 2 },
  projectHalo: { position: 'absolute', width: 142, height: 142, borderRadius: 71, backgroundColor: '#F0E7FF', opacity: 0.58 },
  project: { width: 126, minHeight: 126, borderRadius: 42, backgroundColor: '#271B3C', alignItems: 'center', justifyContent: 'center', padding: spacing.sm, zIndex: 3, shadowColor: colors.signal, shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  projectLabel: { color: '#BFA5FF', fontSize: 6, fontWeight: '900', letterSpacing: 1 },
  projectTitle: { color: '#FFFFFF', fontSize: 16, lineHeight: 19, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  projectTime: { color: '#D5C9E3', fontSize: 7, marginTop: 5 },
  skill: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: '#E7DFF0', backgroundColor: '#FFF9F5', paddingHorizontal: 9, paddingVertical: 6 },
  skillAI: { left: '16%', bottom: '10%' },
  skillStory: { right: '12%', bottom: '10%' },
  skillDotPurple: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.signal },
  skillDotOrange: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.orange },
  skillText: { color: colors.text, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  graphResult: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderTopWidth: 1, borderColor: '#E9E0EE', paddingTop: spacing.sm },
  resultMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFE3D1', alignItems: 'center', justifyContent: 'center' },
  resultMarkText: { color: colors.orangeDark, fontWeight: '900' },
  resultLabel: { color: colors.signal, fontSize: 7, fontWeight: '900', letterSpacing: 1.15 },
  resultText: { color: '#4F4758', fontSize: 10, fontWeight: '700', marginTop: 3 },
  steps: { flexDirection: 'row', gap: spacing.md, marginTop: 54 },
  stepsCompact: { flexDirection: 'column' },
  step: { flex: 1, borderTopWidth: 2, borderTopColor: '#DED2ED', paddingTop: spacing.md },
  stepNumber: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#E9DDFF', alignItems: 'center', justifyContent: 'center' },
  stepNumberOrange: { backgroundColor: '#FFE3D1' },
  stepNumberText: { color: colors.text, fontSize: 9, fontWeight: '900' },
  stepTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: spacing.sm },
  stepText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  finalLine: { color: colors.orangeDark, fontSize: 12, fontWeight: '800', fontStyle: 'italic', textAlign: 'center', marginTop: spacing.xl, paddingBottom: spacing.lg },
});

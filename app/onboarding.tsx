import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Choice = { label: string; detail: string; tags: string[] };
type Prompt = { eyebrow: string; question: string; left: Choice; right: Choice };

const PROMPTS: Prompt[] = [
  {
    eyebrow: 'A FREE EVENING APPEARS',
    question: 'Which rabbit hole gets the first click?',
    left: { label: 'Build an AI agent', detail: 'Make a useful idea think and act.', tags: ['Artificial Intelligence', 'Product Building'] },
    right: { label: 'Design its interface', detail: 'Turn complexity into something intuitive.', tags: ['UI/UX Design', 'Product Design'] },
  },
  {
    eyebrow: 'PICK THE BETTER KIND OF PROBLEM',
    question: 'What sounds more exciting to untangle?',
    left: { label: 'Train a robot', detail: 'Code meets movement and the physical world.', tags: ['Robotics', 'Hardware'] },
    right: { label: 'Find security flaws', detail: 'Think like an attacker to protect a system.', tags: ['Cybersecurity', 'Open Source'] },
  },
  {
    eyebrow: 'TONIGHT\'S SIDE PROJECT',
    question: 'Which one would you actually start?',
    left: { label: 'Film a visual story', detail: 'Build a feeling one frame at a time.', tags: ['Filmmaking', 'Storytelling'] },
    right: { label: 'Prototype an app', detail: 'Make the rough version real by morning.', tags: ['App Development', 'Startups'] },
  },
  {
    eyebrow: 'FOLLOW THE STRONGER PULL',
    question: 'Where does your curiosity go first?',
    left: { label: 'Understand the system', detail: 'Find the hidden rules underneath it.', tags: ['Science', 'Machine Learning'] },
    right: { label: 'Make someone feel', detail: 'Use words, sound, or images to connect.', tags: ['Writing', 'Music Production'] },
  },
  {
    eyebrow: 'CHOOSE A WORLD TO ENTER',
    question: 'Which intersection feels more like you?',
    left: { label: 'Vision + physical space', detail: 'Teach machines to see and navigate.', tags: ['Computer Vision', '3D Design'] },
    right: { label: 'Animation + play', detail: 'Create worlds people can move through.', tags: ['Animation', 'Game Development'] },
  },
  {
    eyebrow: 'THE MOMENT THAT FEELS WORTH IT',
    question: 'What kind of breakthrough do you chase?',
    left: { label: 'A clever technical leap', detail: 'The system finally does the impossible.', tags: ['Creative Coding', 'Artificial Intelligence'] },
    right: { label: 'A powerful creative idea', detail: 'The concept suddenly becomes undeniable.', tags: ['Illustration', 'Storytelling'] },
  },
  {
    eyebrow: 'YOUR NATURAL ROLE',
    question: 'When a group gets stuck, what do you do?',
    left: { label: 'Build the missing piece', detail: 'Prototype first; explain after it works.', tags: ['Product Building', 'Hardware'] },
    right: { label: 'Make the idea clear', detail: 'Find the story everyone can understand.', tags: ['Writing', 'Filmmaking'] },
  },
  {
    eyebrow: 'ONE LAST SIGNAL',
    question: 'What would you rather be known for?',
    left: { label: 'Inventing what comes next', detail: 'Push an unfinished future into the present.', tags: ['Startups', 'Robotics'] },
    right: { label: 'Seeing hidden connections', detail: 'Notice the pattern other people overlook.', tags: ['Psychology', 'Creative Coding'] },
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<'left' | 'right' | null>(null);
  const locked = useRef(false);
  const questionIn = useRef(new Animated.Value(0)).current;
  const leftIn = useRef(new Animated.Value(0)).current;
  const rightIn = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const ambient = useRef(new Animated.Value(0)).current;

  const prompt = PROMPTS[step];
  const unique = useMemo(() => Array.from(new Set(answers)), [answers]);
  const recentSignals = unique.slice(-3).reverse();

  useEffect(() => {
    questionIn.setValue(0);
    leftIn.setValue(0);
    rightIn.setValue(0);

    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: (step + 1) / PROMPTS.length,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(questionIn, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.stagger(75, [leftIn, rightIn].map(value =>
          Animated.spring(value, { toValue: 1, damping: 17, stiffness: 140, mass: 0.75, useNativeDriver: true })
        )),
      ]),
    ]).start();
  }, [leftIn, progressAnim, questionIn, rightIn, step]);

  useEffect(() => {
    const ambientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambient, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(ambient, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    ambientLoop.start();
    return () => ambientLoop.stop();
  }, [ambient]);

  const choose = (choice: Choice, side: 'left' | 'right') => {
    if (locked.current) return;
    locked.current = true;
    setSelected(side);
    const selectedValue = side === 'left' ? leftIn : rightIn;

    Animated.sequence([
      Animated.timing(selectedValue, { toValue: 0.94, duration: 90, useNativeDriver: true }),
      Animated.spring(selectedValue, { toValue: 1, damping: 12, stiffness: 220, useNativeDriver: true }),
      Animated.timing(questionIn, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      const next = [...answers, ...choice.tags];
      if (step === PROMPTS.length - 1) {
        const finalInterests = Array.from(new Set(next)).slice(0, 10);
        router.replace({ pathname: '/dna', params: { interests: finalInterests.join(',') } });
        return;
      }
      setAnswers(next);
      setStep(value => value + 1);
      setSelected(null);
      locked.current = false;
    });
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const ambientY = ambient.interpolate({ inputRange: [0, 1], outputRange: [-8, 10] });
  const entrance = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      { scale: value.interpolate({ inputRange: [0, 0.94, 1], outputRange: [0.98, 0.98, 1] }) },
    ],
  });

  return (
    <SafeAreaView style={styles.page}>
      <Animated.View pointerEvents="none" style={[styles.ambientShape, { transform: [{ translateY: ambientY }, { rotate: '14deg' }] }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shell}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.stepLabel}>INTEREST DNA</Text>
            <Text style={styles.stepHint}>Choose by instinct</Text>
          </View>
          <Text style={styles.counter}>{String(step + 1).padStart(2, '0')} / {String(PROMPTS.length).padStart(2, '0')}</Text>
        </View>

        <View style={styles.track}><Animated.View style={[styles.fill, { width: progressWidth }]} /></View>

        <View style={styles.signalRow}>
          <View style={styles.readingRow}><View style={styles.readingDot} /><Text style={styles.signalText}>{step < 2 ? 'Reading your first signals' : step < 5 ? 'Your map is taking shape' : 'Finding rare intersections'}</Text></View>
          <Text style={styles.signalCount}>{unique.length} found</Text>
        </View>

        <Animated.View style={[styles.center, entrance(questionIn)]}>
          <Text style={styles.eyebrow}>{prompt.eyebrow}</Text>
          <Text style={styles.question}>{prompt.question}</Text>
          <Text style={styles.helper}>There is no strategic answer. Choose the one that creates a little spark.</Text>

          <View style={styles.cards}>
            <Animated.View style={entrance(leftIn)}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${prompt.left.label}. ${prompt.left.detail}`}
                activeOpacity={0.9}
                style={[styles.card, selected === 'left' && styles.cardSelected]}
                onPress={() => choose(prompt.left, 'left')}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardIndex}><Text style={styles.cardIndexText}>A</Text></View>
                  <Text style={styles.cardAction}>THIS ONE <Text style={styles.cardArrow}>↗</Text></Text>
                </View>
                <Text style={styles.cardText}>{prompt.left.label}</Text>
                <Text style={styles.cardDetail}>{prompt.left.detail}</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OR</Text><View style={styles.orLine} /></View>

            <Animated.View style={entrance(rightIn)}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${prompt.right.label}. ${prompt.right.detail}`}
                activeOpacity={0.9}
                style={[styles.card, styles.cardOrange, selected === 'right' && styles.cardSelectedOrange]}
                onPress={() => choose(prompt.right, 'right')}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.cardIndex, styles.cardIndexOrange]}><Text style={[styles.cardIndexText, styles.cardIndexTextOrange]}>B</Text></View>
                  <Text style={[styles.cardAction, styles.cardActionOrange]}>THIS ONE <Text style={styles.cardArrow}>↗</Text></Text>
                </View>
                <Text style={styles.cardText}>{prompt.right.label}</Text>
                <Text style={styles.cardDetail}>{prompt.right.detail}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.signalPreview}>
            {recentSignals.length === 0 ? (
              <Text style={styles.emptySignal}>Your first signal will appear here.</Text>
            ) : recentSignals.map((signal, index) => (
              <View key={signal} style={[styles.signalChip, index === 0 && styles.signalChipFresh]}>
                <Text numberOfLines={1} style={[styles.signalChipText, index === 0 && styles.signalChipTextFresh]}>{signal}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footerNote}>TrueSignal maps curiosity, not popularity.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  shell: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.lg },
  ambientShape: { position: 'absolute', width: 260, height: 260, borderRadius: 86, right: -150, top: 170, backgroundColor: colors.orangeWash, opacity: 0.75 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  backButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: colors.text, fontSize: 20, lineHeight: 22 },
  topCenter: { alignItems: 'center' },
  stepLabel: { color: colors.signal, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  stepHint: { color: colors.muted, fontSize: 9, marginTop: 2 },
  counter: { minWidth: 38, color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  track: { height: 5, backgroundColor: colors.surfaceRaised, borderRadius: 3, marginTop: spacing.md, overflow: 'hidden' },
  fill: { height: 5, backgroundColor: colors.signal, borderRadius: 3 },
  signalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  readingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
  signalText: { color: colors.orangeDark, fontSize: 11, fontWeight: '800' },
  signalCount: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', paddingVertical: spacing.md },
  eyebrow: { color: colors.orangeDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: spacing.sm },
  question: { color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.1, maxWidth: 590 },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, marginBottom: spacing.lg, maxWidth: 550 },
  cards: { gap: 9 },
  card: { minHeight: 136, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, shadowColor: colors.signal, shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  cardOrange: { backgroundColor: '#FFFCFA', shadowColor: colors.orange },
  cardSelected: { borderColor: colors.signal, backgroundColor: colors.lavenderWash },
  cardSelectedOrange: { borderColor: colors.orange, backgroundColor: colors.orangeWash },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIndex: { width: 27, height: 27, borderRadius: 9, backgroundColor: colors.signalSoft, alignItems: 'center', justifyContent: 'center' },
  cardIndexOrange: { backgroundColor: colors.peach },
  cardIndexText: { color: colors.signal, fontSize: 10, fontWeight: '900' },
  cardIndexTextOrange: { color: colors.orangeDark },
  cardAction: { color: colors.signal, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  cardActionOrange: { color: colors.orangeDark },
  cardArrow: { fontSize: 11 },
  cardText: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '900', marginTop: spacing.sm },
  cardDetail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  orRow: { height: 18, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  footer: { gap: spacing.sm },
  signalPreview: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptySignal: { color: colors.muted, fontSize: 10, fontStyle: 'italic' },
  signalChip: { maxWidth: 120, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  signalChipFresh: { backgroundColor: colors.signalSoft, borderColor: colors.signalSoft },
  signalChipText: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  signalChipTextFresh: { color: colors.signal },
  footerNote: { color: colors.muted, textAlign: 'center', fontSize: 10 },
});

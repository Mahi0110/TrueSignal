import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  Animated, Easing, Image, PanResponder, SafeAreaView, StyleSheet, Text,
  TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Creator = {
  name: string;
  handle: string;
  role: string;
  score: number;
  location: string;
  audience: string;
  shared: string[];
  lookingFor: string;
  offers: string;
  possibility: string;
  opener: string;
  image: string;
  accent: string;
};

const CREATORS: Creator[] = [
  {
    name: 'Maya Chen',
    handle: '@mayamakesworlds',
    role: 'Independent 3D artist and character animator',
    score: 91,
    location: 'Bengaluru · open to remote',
    audience: '640-person community',
    shared: ['AI', 'Storytelling', 'Creative Coding'],
    lookingFor: 'A technical collaborator who can make her characters respond to people in real time.',
    offers: 'Character design, animation and a strong visual storytelling process.',
    possibility: 'Build a small interactive character prototype together in one weekend.',
    opener: 'Your character work made me think about an interactive idea. Want to compare notes for 15 minutes?',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=88',
    accent: '#7C4DFF',
  },
  {
    name: 'Arun Rao',
    handle: '@builtbyarun',
    role: 'Hardware maker and robotics builder',
    score: 86,
    location: 'Pune · open to remote',
    audience: '412-person community',
    shared: ['Robotics', 'Open Source', 'Product Design'],
    lookingFor: 'Someone who can turn rough hardware experiments into a clear product experience.',
    offers: 'Rapid prototyping, electronics and practical build experience.',
    possibility: 'Turn one of your software concepts into a working physical demo.',
    opener: 'I like how you prototype in public. I have a software idea that could use a physical form—can I show you?',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=88',
    accent: '#E86F2D',
  },
  {
    name: 'Noor Ellis',
    handle: '@noorframes',
    role: 'Independent filmmaker and interaction designer',
    score: 82,
    location: 'London · remote',
    audience: '795-person community',
    shared: ['Filmmaking', 'Design', 'Science'],
    lookingFor: 'Technical creators with meaningful projects that deserve a story people can understand.',
    offers: 'Concept films, visual direction and a thoughtful audience perspective.',
    possibility: 'Create a short visual story around one of your most ambitious experiments.',
    opener: 'You make technical ideas feel human. I’m working on one that needs exactly that—would you take a look?',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1000&q=88',
    accent: '#8D5AC7',
  },
];

const SWIPE_THRESHOLD = 80;

export default function Discover() {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const contentWidth = Math.min(width - (compact ? 28 : 64), 940);
  const [current, setCurrent] = useState(0);
  const [introReady, setIntroReady] = useState<string[]>([]);
  const position = useRef(new Animated.ValueXY()).current;
  const pageIn = useRef(new Animated.Value(0)).current;
  const profileIn = useRef(new Animated.Value(0)).current;
  const storyIn = useRef(new Animated.Value(0)).current;
  const actionIn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const active = CREATORS[current % CREATORS.length];
  const next = CREATORS[(current + 1) % CREATORS.length];
  const ready = introReady.includes(active.handle);

  const reveal = () => {
    profileIn.setValue(0);
    storyIn.setValue(0);
    actionIn.setValue(0);
    Animated.stagger(90, [
      Animated.spring(profileIn, { toValue: 1, damping: 18, stiffness: 120, useNativeDriver: true }),
      Animated.timing(storyIn, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(actionIn, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    Animated.timing(pageIn, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    reveal();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const advance = (direction: 1 | -1) => {
    Animated.parallel([
      Animated.timing(position, { toValue: { x: direction * (width + 120), y: 8 }, duration: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(storyIn, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrent(value => value + 1);
      reveal();
    });
  };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8,
    onPanResponderMove: (_, gesture) => position.setValue({ x: gesture.dx, y: Math.abs(gesture.dx) * 0.025 }),
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) advance(gesture.dx > 0 ? 1 : -1);
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, damping: 16, stiffness: 170, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start(),
  }), [position, width]);

  const cardRotate = position.x.interpolate({
    inputRange: [-width, 0, width], outputRange: ['-3deg', '0deg', '3deg'], extrapolate: 'clamp',
  });
  const nextScale = position.x.interpolate({
    inputRange: [-width, 0, width], outputRange: [1, 0.975, 1], extrapolate: 'clamp',
  });
  const appear = (value: Animated.Value, distance = 14) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const prepareIntro = () => {
    if (!ready) setIntroReady(value => [...value, active.handle]);
  };

  return (
    <SafeAreaView style={styles.page}>
      <Animated.View style={[styles.shell, { width: contentWidth }, appear(pageIn, 8)]}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>TRUE CONNECTIONS</Text>
            <Text style={styles.title}>Don’t network wider. Find the right person.</Text>
          </View>
          <Text style={styles.count}>{String((current % CREATORS.length) + 1).padStart(2, '0')} / {String(CREATORS.length).padStart(2, '0')}</Text>
        </View>
        <Text style={styles.subtitle}>TrueSignal looks past popularity to find creators whose skills and needs actually fit yours.</Text>

        <View style={styles.deck}>
          <Animated.View style={[styles.matchCard, styles.cardBehind, { transform: [{ scale: nextScale }] }]}>
            <Image source={{ uri: next.image }} style={styles.behindImage} />
          </Animated.View>

          <Animated.View {...panResponder.panHandlers} style={[styles.matchCard, {
            transform: [...position.getTranslateTransform(), { rotate: cardRotate }],
          }]}>
            <View style={[styles.cardLayout, compact && styles.cardLayoutCompact]}>
              <Animated.View style={[styles.identity, compact && styles.identityCompact, appear(profileIn, 18)]}>
                <Image source={{ uri: active.image }} style={[styles.portrait, compact && styles.portraitCompact]} />
                <View style={styles.availability}>
                  <View>
                    <Animated.View style={[styles.availabilityPulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
                    <View style={styles.availabilityDot} />
                  </View>
                  <Text style={styles.availabilityText}>OPEN TO COLLABORATE</Text>
                </View>
                <View style={styles.identityCopy}>
                  <Text style={styles.name}>{active.name}</Text>
                  <Text style={styles.handle}>{active.handle}</Text>
                  <Text style={styles.role}>{active.role}</Text>
                  <Text style={styles.meta}>{active.location}</Text>
                  <Text style={styles.meta}>{active.audience}</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.story, compact && styles.storyCompact, appear(storyIn, 18)]}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreText}><Text style={{ color: active.accent }}>{active.score}%</Text> signal overlap</Text>
                  <Text style={styles.swipe}>drag to see next →</Text>
                </View>
                <View style={styles.sharedRow}>
                  {active.shared.map(item => <Text key={item} style={styles.shared}>{item}</Text>)}
                </View>

                <View style={styles.exchange}>
                  <View style={styles.exchangeBlock}>
                    <Text style={styles.blockLabel}>THE GAP THEY’RE TRYING TO SOLVE</Text>
                    <Text style={styles.blockText}>{active.lookingFor}</Text>
                  </View>
                  <View style={styles.connector}>
                    <View style={[styles.connectorLine, { backgroundColor: active.accent }]} />
                    <View style={[styles.connectorMark, { borderColor: active.accent }]}><Text style={[styles.connectorPlus, { color: active.accent }]}>+</Text></View>
                    <View style={[styles.connectorLine, { backgroundColor: active.accent }]} />
                  </View>
                  <View style={styles.exchangeBlock}>
                    <Text style={styles.blockLabel}>WHAT THEY BRING</Text>
                    <Text style={styles.blockText}>{active.offers}</Text>
                  </View>
                </View>

                <View style={styles.possibility}>
                  <Text style={styles.possibilityLabel}>A GOOD FIRST PROJECT</Text>
                  <Text style={styles.possibilityText}>{active.possibility}</Text>
                </View>

                {ready && (
                  <Animated.View style={[styles.opener, appear(actionIn, 10)]}>
                    <Text style={styles.openerLabel}>A HUMAN WAY TO START</Text>
                    <Text style={styles.openerText}>“{active.opener}”</Text>
                  </Animated.View>
                )}
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.actions, appear(actionIn, 12)]}>
          <TouchableOpacity accessibilityRole="button" onPress={() => advance(-1)} style={styles.passButton}>
            <Text style={styles.passText}>Not the right fit</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={prepareIntro} style={[styles.introButton, { backgroundColor: active.accent }]}>
            <Text style={styles.introButtonText}>{ready ? 'Introduction ready ✓' : `Start a conversation with ${active.name.split(' ')[0]}`}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.footerNote}>No follower race. No cold pitch. Just a clear reason to make something together.</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FCFAF7' },
  shell: { flex: 1, alignSelf: 'center', paddingVertical: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#DDD8D1', alignItems: 'center', justifyContent: 'center' },
  back: { color: '#1F1C1A', fontSize: 20 },
  heading: { flex: 1, marginHorizontal: spacing.md },
  eyebrow: { color: colors.orangeDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  title: { color: '#1F1C1A', fontSize: 28, lineHeight: 32, fontWeight: '800', letterSpacing: -0.8, marginTop: 2 },
  count: { color: '#8A837D', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  subtitle: { color: '#6E6863', fontSize: 13, lineHeight: 19, marginLeft: 56, marginTop: 6, maxWidth: 620 },
  deck: { flex: 1, minHeight: 490, maxHeight: 610, marginTop: spacing.md, position: 'relative' },
  matchCard: { position: 'absolute', width: '100%', height: '100%', borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E2DC', overflow: 'hidden', shadowColor: '#33291F', shadowOpacity: 0.1, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 5 },
  cardBehind: { opacity: 0.16, top: 8 },
  behindImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardLayout: { flex: 1, flexDirection: 'row' },
  cardLayoutCompact: { flexDirection: 'column' },
  identity: { width: '38%', backgroundColor: '#F0E9FF' },
  identityCompact: { width: '100%', height: '43%' },
  portrait: { width: '100%', height: '57%', resizeMode: 'cover' },
  portraitCompact: { position: 'absolute', width: '43%', height: '100%', left: 0 },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: spacing.md, marginTop: spacing.md },
  availabilityPulse: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#38A56D' },
  availabilityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#238856' },
  availabilityText: { color: '#35614A', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  identityCopy: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  name: { color: '#1F1C1A', fontSize: 27, fontWeight: '800', letterSpacing: -0.7 },
  handle: { color: '#7A726C', fontSize: 11, marginTop: 1 },
  role: { color: '#302B28', fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: spacing.sm },
  meta: { color: '#817A74', fontSize: 10, marginTop: 5 },
  story: { flex: 1, padding: spacing.lg },
  storyCompact: { padding: spacing.md, paddingTop: spacing.sm },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreText: { color: '#393431', fontSize: 13, fontWeight: '800' },
  swipe: { color: '#948C85', fontSize: 8, fontWeight: '700' },
  sharedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: spacing.sm },
  shared: { color: '#5D5651', fontSize: 9, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: '#B8B0A9', paddingBottom: 3 },
  exchange: { flexDirection: 'row', alignItems: 'stretch', marginTop: spacing.lg },
  exchangeBlock: { flex: 1 },
  blockLabel: { color: '#8A817A', fontSize: 7, fontWeight: '900', letterSpacing: 1.05 },
  blockText: { color: '#292522', fontSize: 12, lineHeight: 17, marginTop: 6 },
  connector: { width: 42, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 },
  connectorLine: { width: 1, flex: 1, opacity: 0.3 },
  connectorMark: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  connectorPlus: { fontSize: 15 },
  possibility: { backgroundColor: '#F7F3ED', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  possibilityLabel: { color: colors.orangeDark, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  possibilityText: { color: '#24201E', fontSize: 14, lineHeight: 19, fontWeight: '700', marginTop: 6 },
  opener: { borderLeftWidth: 2, borderLeftColor: colors.signal, paddingLeft: spacing.sm, marginTop: spacing.md },
  openerLabel: { color: colors.signal, fontSize: 7, fontWeight: '900', letterSpacing: 1.15 },
  openerText: { color: '#4E4843', fontSize: 11, lineHeight: 16, fontStyle: 'italic', marginTop: 5 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  passButton: { width: 150, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#CFC8C1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  passText: { color: '#4B4541', fontSize: 12, fontWeight: '700' },
  introButton: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  introButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  footerNote: { color: '#8A837D', fontSize: 9, textAlign: 'center', marginTop: spacing.sm },
});

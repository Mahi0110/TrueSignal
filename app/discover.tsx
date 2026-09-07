import { useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Animated, Image, PanResponder, SafeAreaView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Creator = {
  name: string; handle: string; role: string; score: number; audience: string;
  shared: string[]; edge: string; image: string; tint: string;
};

const CREATORS: Creator[] = [
  {
    name: 'Maya Chen', handle: '@mayamakesworlds', role: '3D artist + character animator',
    score: 91, audience: '640 people', shared: ['AI', 'Storytelling', 'Creative Coding'],
    edge: 'Your computer-vision experiments and Maya’s animation practice could become an interactive character project.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85', tint: '#BDA4FF',
  },
  {
    name: 'Arun Rao', handle: '@builtbyarun', role: 'Hardware maker + robotics builder',
    score: 86, audience: '412 people', shared: ['Robotics', 'Open Source', 'Product Design'],
    edge: 'You share robotics, while Arun adds the physical prototyping experience that could move an idea off-screen.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85', tint: '#FFB184',
  },
  {
    name: 'Noor Ellis', handle: '@noorframes', role: 'Filmmaker + interaction designer',
    score: 82, audience: '795 people', shared: ['Filmmaking', 'Design', 'Science'],
    edge: 'Noor turns technical ideas into visual stories—a complementary match for explaining the systems you build.',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85', tint: '#F3A9C5',
  },
];

const SWIPE_THRESHOLD = 85;

export default function Discover() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.lg * 2, 430);
  const [current, setCurrent] = useState(0);
  const [connected, setConnected] = useState<string[]>([]);
  const position = useRef(new Animated.ValueXY()).current;
  const detailIn = useRef(new Animated.Value(1)).current;
  const active = CREATORS[current % CREATORS.length];
  const next = CREATORS[(current + 1) % CREATORS.length];

  const advance = (direction: 1 | -1) => {
    Animated.parallel([
      Animated.timing(position, { toValue: { x: direction * (width + 100), y: 12 }, duration: 260, useNativeDriver: true }),
      Animated.timing(detailIn, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      position.setValue({ x: 0, y: 0 });
      detailIn.setValue(0);
      setCurrent(value => value + 1);
      Animated.spring(detailIn, { toValue: 1, damping: 16, stiffness: 150, useNativeDriver: true }).start();
    });
  };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8,
    onPanResponderMove: (_, gesture) => position.setValue({ x: gesture.dx, y: Math.abs(gesture.dx) * 0.035 }),
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) advance(gesture.dx > 0 ? 1 : -1);
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, tension: 70, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start(),
  }), [position, width]);

  const rotation = position.x.interpolate({
    inputRange: [-width, 0, width], outputRange: ['-8deg', '0deg', '8deg'], extrapolate: 'clamp',
  });
  const nextScale = position.x.interpolate({
    inputRange: [-width, 0, width], outputRange: [1, 0.94, 1], extrapolate: 'clamp',
  });
  const nextLift = position.x.interpolate({
    inputRange: [-width, 0, width], outputRange: [0, 14, 0], extrapolate: 'clamp',
  });
  const isConnected = connected.includes(active.handle);
  const connect = () => {
    if (!isConnected) setConnected(value => [...value, active.handle]);
  };

  return (
    <SafeAreaView style={styles.page}>
      <View pointerEvents="none" style={styles.glowPurple} />
      <View pointerEvents="none" style={styles.glowOrange} />
      <View style={styles.shell}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.roundButton}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headingCopy}>
            <Text style={styles.kicker}>SIGNAL MATCHES</Text>
            <Text style={styles.title}>People worth knowing.</Text>
          </View>
          <View style={styles.counter}><Text style={styles.counterText}>{(current % CREATORS.length) + 1}/{CREATORS.length}</Text></View>
        </View>
        <Text style={styles.intro}>Creative compatibility first. Follower count never decides who you see.</Text>

        <View style={[styles.deck, { width: cardWidth }]}>
          <Animated.View style={[styles.card, styles.nextCard, { transform: [{ scale: nextScale }, { translateY: nextLift }] }]}>
            <Image source={{ uri: next.image }} style={styles.photo} />
          </Animated.View>
          <Animated.View {...panResponder.panHandlers} style={[styles.card, { transform: [...position.getTranslateTransform(), { rotate: rotation }] }]}>
            <Image source={{ uri: active.image }} style={styles.photo} />
            <View style={[styles.photoWash, { backgroundColor: active.tint }]} />
            <View style={styles.cardTop}>
              <View style={styles.smallCreator}><View style={styles.liveDot} /><Text style={styles.smallCreatorText}>SMALL CREATOR</Text></View>
              <View style={styles.matchBubble}><Text style={styles.matchNumber}>{active.score}%</Text><Text style={styles.matchLabel}>MATCH</Text></View>
            </View>
            <Animated.View style={[styles.profilePanel, {
              opacity: detailIn,
              transform: [{ translateY: detailIn.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
            }]}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{active.name}</Text>
                <View style={styles.verified}><Text style={styles.verifiedText}>✓</Text></View>
              </View>
              <Text style={styles.handle}>{active.handle} · {active.audience}</Text>
              <Text style={styles.role}>{active.role}</Text>
              <View style={styles.chips}>
                {active.shared.map(item => <View key={item} style={styles.chip}><Text style={styles.chipText}>{item}</Text></View>)}
              </View>
              <View style={styles.why}>
                <Text style={styles.whyLabel}>WHY YOUR SIGNALS ALIGN</Text>
                <Text style={styles.whyText}>{active.edge}</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        <Text style={styles.swipeHint}>DRAG THE CARD TO DISCOVER ANOTHER CREATOR</Text>
        <View style={[styles.actions, { width: cardWidth }]}>
          <TouchableOpacity accessibilityRole="button" onPress={() => advance(-1)} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={connect} style={[styles.connectButton, isConnected && styles.connectedButton]}>
            <Text style={styles.connectText}>{isConnected ? 'Request sent ✓' : 'Connect'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.viewProfile}>
          <Text style={styles.viewProfileText}>View full profile →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' },
  glowPurple: { position: 'absolute', width: 330, height: 330, borderRadius: 165, backgroundColor: colors.lavenderWash, left: -180, top: 110, opacity: 0.85 },
  glowOrange: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: colors.orangeWash, right: -160, bottom: 30, opacity: 0.9 },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.text, fontSize: 33, lineHeight: 34, marginTop: -3 },
  headingCopy: { flex: 1, marginHorizontal: spacing.md },
  kicker: { color: colors.signal, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.7, marginTop: 2 },
  counter: { minWidth: 42, height: 42, paddingHorizontal: 9, borderRadius: 21, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' },
  counterText: { color: colors.orangeDark, fontSize: 10, fontWeight: '900' },
  intro: { color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: spacing.sm, marginBottom: spacing.md },
  deck: { flex: 1, maxHeight: 560, minHeight: 430, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  card: { position: 'absolute', width: '100%', height: '100%', maxHeight: 550, minHeight: 430, borderRadius: 34, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#3B285C', shadowOpacity: 0.18, shadowRadius: 26, shadowOffset: { width: 0, height: 16 }, elevation: 8 },
  nextCard: { opacity: 0.42, backgroundColor: colors.surfaceRaised },
  photo: { position: 'absolute', width: '100%', height: '63%', top: 0, resizeMode: 'cover' },
  photoWash: { position: 'absolute', width: '100%', height: '63%', opacity: 0.14 },
  cardTop: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  smallCreator: { flexDirection: 'row', gap: 6, alignItems: 'center', borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.90)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
  smallCreatorText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  matchBubble: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center', shadowColor: colors.signal, shadowOpacity: 0.25, shadowRadius: 12 },
  matchNumber: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  matchLabel: { color: '#FFFFFF', fontSize: 6, fontWeight: '900', letterSpacing: 1.1 },
  profilePanel: { position: 'absolute', left: 10, right: 10, bottom: 10, borderRadius: 26, padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.96)' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  verified: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  verifiedText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  handle: { color: colors.muted, fontSize: 10, marginTop: 2 },
  role: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  chip: { backgroundColor: colors.signalSoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { color: colors.signal, fontSize: 8, fontWeight: '900' },
  why: { borderTopWidth: 1, borderColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm },
  whyLabel: { color: colors.orangeDark, fontSize: 7, fontWeight: '900', letterSpacing: 1.25 },
  whyText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 4 },
  swipeHint: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1.25, marginTop: spacing.sm, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  skipButton: { height: 50, width: 104, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.signal, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  skipText: { color: colors.signal, fontWeight: '900' },
  connectButton: { flex: 1, height: 50, borderRadius: radius.pill, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center', shadowColor: colors.signal, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } },
  connectedButton: { backgroundColor: colors.orange },
  connectText: { color: '#FFFFFF', fontWeight: '900' },
  viewProfile: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  viewProfileText: { color: colors.text, fontSize: 11, fontWeight: '800' },
});

import { useEffect, useRef } from 'react';
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

const proofPoints = [
  'People matched by creative chemistry',
  'Ideas discovered before follower counts',
  'Clear reasons behind every connection',
];

export default function WelcomeScreen() {
  const brandIn = useRef(new Animated.Value(0)).current;
  const copyIn = useRef(new Animated.Value(0)).current;
  const proofIn = useRef(new Animated.Value(0)).current;
  const mapIn = useRef(new Animated.Value(0)).current;
  const actionIn = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [brandIn, copyIn, proofIn, mapIn, actionIn].map(value =>
      Animated.spring(value, {
        toValue: 1,
        damping: 18,
        stiffness: 120,
        mass: 0.8,
        useNativeDriver: true,
      })
    )).start();

    const orbitLoop = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    orbitLoop.start();
    pulseLoop.start();
    driftLoop.start();

    return () => {
      orbitLoop.stop();
      pulseLoop.stop();
      driftLoop.stop();
    };
  }, [actionIn, brandIn, copyIn, drift, mapIn, orbit, proofIn, pulse]);

  const enterStyle = (value: Animated.Value, distance = 18) => ({
    opacity: value,
    transform: [{
      translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }),
    }],
  });

  const orbitRotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const driftUp = drift.interpolate({ inputRange: [0, 1], outputRange: [2, -5] });
  const driftDown = drift.interpolate({ inputRange: [0, 1], outputRange: [-2, 5] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.18] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <SafeAreaView style={styles.page}>
      <View pointerEvents="none" style={styles.ambientPurple} />
      <View pointerEvents="none" style={styles.ambientOrange} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.top, enterStyle(brandIn, 10)]}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><View style={styles.brandMarkCore} /></View>
            <Text style={styles.wordmark}>TrueSignal</Text>
          </View>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>CREATOR-FIRST</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.hero, enterStyle(copyIn, 24)]}>
          <View style={styles.miniLabel}>
            <Text style={styles.miniLabelText}>FOR SMALL + EMERGING CREATORS</Text>
          </View>
          <Text style={styles.title}>
            Your next collaborator{`\n`}is hiding in your <Text style={styles.purple}>interests.</Text>
          </Text>
          <Text style={styles.body}>
            TrueSignal is a creator-first network that sees your curiosity before it sees your numbers.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.proofBox, enterStyle(proofIn, 20)]}>
          {proofPoints.map((point, index) => (
            <View key={point} style={styles.promise}>
              <View style={[styles.proofNumber, index === 1 && styles.proofNumberOrange]}>
                <Text style={[styles.proofNumberText, index === 1 && styles.proofNumberTextOrange]}>{index + 1}</Text>
              </View>
              <Text style={styles.promiseText}>{point}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.signalCard, enterStyle(mapIn, 24)]}>
          <View style={styles.signalCardTop}>
            <View>
              <Text style={styles.signalEyebrow}>LIVE INTEREST SIGNAL</Text>
              <Text style={styles.signalTitle}>Different interests. One possible idea.</Text>
            </View>
            <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>MAPPING</Text></View>
          </View>

          <View style={styles.constellation}>
            <View style={[styles.connection, styles.lineOne]} />
            <View style={[styles.connection, styles.lineTwo]} />
            <View style={[styles.connection, styles.lineThree]} />

            <Animated.View style={[styles.orbit, { transform: [{ rotate: orbitRotation }] }]}>
              <View style={[styles.orbitMark, styles.orbitMarkOne]} />
              <View style={[styles.orbitMark, styles.orbitMarkTwo]} />
            </Animated.View>

            <Animated.View style={[styles.topic, styles.topicAI, { transform: [{ translateY: driftUp }] }]}>
              <View style={[styles.topicDot, { backgroundColor: colors.signal }]} />
              <Text style={styles.topicText}>AI</Text>
            </Animated.View>
            <Animated.View style={[styles.topic, styles.topicFilm, { transform: [{ translateY: driftDown }] }]}>
              <View style={[styles.topicDot, { backgroundColor: colors.orange }]} />
              <Text style={styles.topicText}>FILM</Text>
            </Animated.View>
            <Animated.View style={[styles.topic, styles.topicDesign, { transform: [{ translateY: driftUp }] }]}>
              <View style={[styles.topicDot, { backgroundColor: colors.violet }]} />
              <Text style={styles.topicText}>DESIGN</Text>
            </Animated.View>

            <Animated.View style={[styles.coreHalo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />
            <View style={styles.centerBubble}>
              <Text style={styles.centerSmall}>YOUR</Text>
              <Text style={styles.centerText}>SIGNAL</Text>
            </View>
          </View>

          <View style={styles.handNote}>
            <View style={styles.noteLine} />
            <Text style={styles.note}>Small audience. Big creative surface area.</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.actions, enterStyle(actionIn, 18)]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Build my Interest DNA"
            activeOpacity={0.88}
            style={styles.primary}
            onPress={() => router.push('/onboarding')}
          >
            <Text style={styles.primaryText}>Build my Interest DNA</Text>
            <View style={styles.arrowCircle}><Text style={styles.arrow}>→</Text></View>
          </TouchableOpacity>
          <Text style={styles.caption}>A playful 90-second map · no follower count required</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  ambientPurple: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: colors.lavenderWash, top: -150, right: -120, opacity: 0.75 },
  ambientOrange: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: colors.orangeWash, bottom: -130, left: -100, opacity: 0.7 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 25, height: 25, borderRadius: 9, backgroundColor: colors.signalSoft, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  brandMarkCore: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.signal },
  wordmark: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 7 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
  badgeText: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  hero: { marginTop: spacing.xl },
  miniLabel: { alignSelf: 'flex-start', backgroundColor: colors.signalSoft, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill, marginBottom: spacing.md },
  miniLabelText: { color: colors.signal, fontSize: 9, fontWeight: '900', letterSpacing: 1.35 },
  title: { color: colors.text, fontSize: 45, lineHeight: 49, fontWeight: '900', letterSpacing: -1.9, maxWidth: 680 },
  purple: { color: colors.signal },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: spacing.md, maxWidth: 580 },
  proofBox: { marginTop: spacing.lg, gap: 11 },
  promise: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  proofNumber: { width: 24, height: 24, borderRadius: 9, backgroundColor: colors.signalSoft, alignItems: 'center', justifyContent: 'center' },
  proofNumberOrange: { backgroundColor: colors.peach },
  proofNumberText: { color: colors.signal, fontSize: 10, fontWeight: '900' },
  proofNumberTextOrange: { color: colors.orangeDark },
  promiseText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  signalCard: { marginTop: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.md, shadowColor: colors.signal, shadowOpacity: 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 3 },
  signalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  signalEyebrow: { color: colors.signal, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  signalTitle: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '800', marginTop: 4 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.orangeWash, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.orange },
  liveText: { color: colors.orangeDark, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  constellation: { height: 164, position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  orbit: { position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border },
  orbitMark: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
  orbitMarkOne: { left: 14, top: 20 },
  orbitMarkTwo: { right: 6, bottom: 42, backgroundColor: colors.signal },
  connection: { position: 'absolute', height: 1, backgroundColor: colors.border, left: '50%', top: '50%' },
  lineOne: { width: 106, transform: [{ rotate: '-150deg' }, { translateX: 2 }] },
  lineTwo: { width: 110, transform: [{ rotate: '-28deg' }, { translateX: 2 }] },
  lineThree: { width: 96, transform: [{ rotate: '136deg' }, { translateX: 2 }] },
  topic: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  topicAI: { left: '8%', top: 23 },
  topicFilm: { right: '7%', top: 34 },
  topicDesign: { left: '13%', bottom: 16 },
  topicDot: { width: 6, height: 6, borderRadius: 3 },
  topicText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  coreHalo: { position: 'absolute', width: 76, height: 76, borderRadius: 38, backgroundColor: colors.signalSoft },
  centerBubble: { width: 70, height: 70, borderRadius: 24, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-3deg' }], shadowColor: colors.signal, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  centerSmall: { color: '#FFFFFF', opacity: 0.72, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  centerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, marginTop: 2 },
  handNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm },
  noteLine: { width: 28, height: 2, backgroundColor: colors.orange, transform: [{ rotate: '-5deg' }] },
  note: { flex: 1, color: colors.orangeDark, fontSize: 11, lineHeight: 16, fontStyle: 'italic', fontWeight: '800' },
  actions: { marginTop: spacing.lg },
  primary: { backgroundColor: colors.text, minHeight: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: spacing.md, shadowColor: colors.text, shadowOpacity: 0.16, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  arrowCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  arrow: { color: '#FFFFFF', fontSize: 18, lineHeight: 21 },
  caption: { color: colors.muted, textAlign: 'center', fontSize: 11, marginTop: spacing.sm },
});

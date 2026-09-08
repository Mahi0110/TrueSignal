import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Animated, Easing, SafeAreaView, ScrollView, StyleSheet, Text,
  TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

const STEPS = [
  { day: '01', title: 'Choose the right person', copy: 'Three collaboration-ready matches based on skills, needs and your Interest DNA.' },
  { day: '02', title: 'Skip the awkward opening', copy: 'A warm introduction and a one-page project brief built around what both of you bring.' },
  { day: '03–14', title: 'Make something small', copy: 'A private sprint room with clear roles, lightweight milestones and check-ins that keep momentum alive.' },
  { day: 'SHIP', title: 'Turn work into credibility', copy: 'Publish together, earn verified collaboration proof and unlock a discovery boost for both creators.' },
];

export default function OfferScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const { creator = 'your match', project = 'Build a small project together.' } =
    useLocalSearchParams<{ creator?: string; project?: string }>();
  const [started, setStarted] = useState(false);
  const heroIn = useRef(new Animated.Value(0)).current;
  const offerIn = useRef(new Animated.Value(0)).current;
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(heroIn, { toValue: 1, damping: 18, stiffness: 110, useNativeDriver: true }),
      Animated.parallel([
        Animated.stagger(80, stepAnims.map(value =>
          Animated.timing(value, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true })
        )),
        Animated.timing(offerIn, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, heroIn, offerIn, stepAnims]);

  const enter = (value: Animated.Value, distance = 18) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] });

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.shell}>
          <Animated.View style={[styles.hero, enter(heroIn, 24)]}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View style={styles.founding}><View style={styles.foundingDot} /><Text style={styles.foundingText}>FOUNDING CREATOR OFFER</Text></View>
            <Text style={styles.eyebrow}>CREATOR LAUNCH CIRCLE</Text>
            <Text style={styles.title}>Don’t collect contacts. Ship one real collaboration in 14 days.</Text>
            <Text style={styles.subtitle}>TrueSignal turns a promising match into a small finished project—so creators leave with a relationship, proof of work and new people discovering them.</Text>
            <View style={styles.liveProject}>
              <Text style={styles.liveLabel}>YOUR FIRST POSSIBLE SPRINT WITH {String(creator).toUpperCase()}</Text>
              <Text style={styles.liveText}>{project}</Text>
            </View>
          </Animated.View>

          <View style={[styles.main, compact && styles.mainCompact]}>
            <View style={styles.timeline}>
              <Text style={styles.sectionTitle}>From “we should collaborate” to shipped.</Text>
              {STEPS.map((step, index) => (
                <Animated.View key={step.day} style={[styles.step, enter(stepAnims[index], 14)]}>
                  <View style={styles.stepRail}>
                    <View style={[styles.stepDot, index === STEPS.length - 1 && styles.stepDotShip]} />
                    {index < STEPS.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <Text style={styles.day}>{step.day}</Text>
                  <View style={styles.stepCopy}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepText}>{step.copy}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            <Animated.View style={[styles.offer, enter(offerIn, 20)]}>
              <Animated.View pointerEvents="none" style={[styles.offerGlow, { transform: [{ scale: glowScale }] }]} />
              <Text style={styles.offerKicker}>START WITH A FIT, NOT A PAYMENT</Text>
              <Text style={styles.offerTitle}>Your first collaboration sprint is free.</Text>
              <Text style={styles.offerBody}>Review your three matches first. Your 14-day trial begins only when you accept someone you genuinely want to create with.</Text>

              <View style={styles.promise}>
                <Text style={styles.check}>✓</Text>
                <View style={styles.promiseCopy}>
                  <Text style={styles.promiseTitle}>No good fit? Refresh all three.</Text>
                  <Text style={styles.promiseText}>You are never locked into a weak recommendation.</Text>
                </View>
              </View>
              <View style={styles.promise}>
                <Text style={styles.check}>✓</Text>
                <View style={styles.promiseCopy}>
                  <Text style={styles.promiseTitle}>Cancel anytime.</Text>
                  <Text style={styles.promiseText}>Your profile and completed collaborations remain yours.</Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.price}>₹199<Text style={styles.perMonth}> / month</Text></Text>
                  <Text style={styles.priceNote}>after the free sprint · founding price</Text>
                </View>
                <View style={styles.valueTag}><Text style={styles.valueTagText}>LESS THAN ₹7/DAY</Text></View>
              </View>

              <TouchableOpacity accessibilityRole="button" onPress={() => setStarted(true)} style={[styles.cta, started && styles.ctaStarted]}>
                <Text style={styles.ctaText}>{started ? 'Launch Circle reserved ✓' : 'Show me my 3 matches →'}</Text>
              </TouchableOpacity>
              <Text style={styles.finePrint}>No charge today. Trial starts only after you accept a match. Demo checkout for the hackathon build.</Text>
            </Animated.View>
          </View>

          <Text style={styles.close}>The goal is not more scrolling. It is one person, one small project and a reason to keep creating.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FCF8F3' },
  scroll: { paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  shell: { width: '100%', maxWidth: 1040, alignSelf: 'center' },
  hero: { alignItems: 'center', position: 'relative' },
  back: { position: 'absolute', left: 0, top: 0, width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#DCD4CB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  backText: { color: '#231E1B', fontSize: 20 },
  founding: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#EEE5FF', borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 7 },
  foundingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.signal },
  foundingText: { color: colors.signal, fontSize: 8, fontWeight: '900', letterSpacing: 1.25 },
  eyebrow: { color: colors.orangeDark, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: spacing.md },
  title: { color: '#1D1714', fontSize: 42, lineHeight: 46, fontWeight: '900', letterSpacing: -1.5, textAlign: 'center', maxWidth: 790, marginTop: spacing.sm },
  subtitle: { color: '#6E655F', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 700, marginTop: spacing.sm },
  liveProject: { maxWidth: 700, width: '100%', borderLeftWidth: 3, borderLeftColor: colors.orange, backgroundColor: '#FFF0E7', padding: spacing.md, marginTop: spacing.lg },
  liveLabel: { color: colors.orangeDark, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  liveText: { color: '#382D27', fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 5 },
  main: { flexDirection: 'row', gap: spacing.lg, alignItems: 'stretch', marginTop: spacing.xl },
  mainCompact: { flexDirection: 'column' },
  timeline: { flex: 1, padding: spacing.md },
  sectionTitle: { color: '#231E1B', fontSize: 21, fontWeight: '800', letterSpacing: -0.4, marginBottom: spacing.lg },
  step: { flexDirection: 'row', minHeight: 88 },
  stepRail: { width: 20, alignItems: 'center' },
  stepDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.signal, backgroundColor: '#FCF8F3', zIndex: 2 },
  stepDotShip: { backgroundColor: colors.orange, borderColor: colors.orange },
  stepLine: { width: 1, flex: 1, backgroundColor: '#CFC2E3' },
  day: { width: 50, color: colors.signal, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginLeft: 8 },
  stepCopy: { flex: 1, paddingBottom: spacing.md },
  stepTitle: { color: '#29231F', fontSize: 14, fontWeight: '800' },
  stepText: { color: '#756D67', fontSize: 11, lineHeight: 17, marginTop: 5 },
  offer: { flex: 1.05, minHeight: 465, overflow: 'hidden', backgroundColor: '#20182F', borderRadius: 28, padding: spacing.xl, shadowColor: colors.signal, shadowOpacity: 0.22, shadowRadius: 25, shadowOffset: { width: 0, height: 14 }, elevation: 7 },
  offerGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, right: -100, top: -120, backgroundColor: '#7C4DFF', opacity: 0.22 },
  offerKicker: { color: '#C9B5FF', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  offerTitle: { color: '#FFFFFF', fontSize: 29, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8, marginTop: spacing.sm },
  offerBody: { color: '#CFC7D8', fontSize: 12, lineHeight: 19, marginTop: spacing.sm },
  promise: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  check: { width: 22, height: 22, borderRadius: 11, color: '#FFFFFF', backgroundColor: colors.signal, textAlign: 'center', lineHeight: 22, fontSize: 11, fontWeight: '900' },
  promiseCopy: { flex: 1 },
  promiseTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  promiseText: { color: '#AAA1B4', fontSize: 10, lineHeight: 15, marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#3B304D', paddingTop: spacing.md, marginTop: spacing.lg },
  price: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  perMonth: { color: '#BDB3C8', fontSize: 12, fontWeight: '600' },
  priceNote: { color: '#9F96AA', fontSize: 8, marginTop: 2 },
  valueTag: { backgroundColor: '#403154', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 },
  valueTagText: { color: '#E1D3FF', fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  cta: { height: 54, borderRadius: 13, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  ctaStarted: { backgroundColor: '#3B9A68' },
  ctaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  finePrint: { color: '#8F859A', fontSize: 8, lineHeight: 12, textAlign: 'center', marginTop: spacing.sm },
  close: { color: '#6E655F', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.xl, paddingBottom: spacing.lg },
});

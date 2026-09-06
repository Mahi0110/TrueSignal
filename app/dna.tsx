import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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

const POSITIONS = [
  { top: 20, left: '39%' },
  { top: 83, left: '5%' },
  { top: 76, right: '4%' },
  { top: 180, left: '2%' },
  { top: 186, right: '1%' },
  { bottom: 56, left: '14%' },
  { bottom: 42, right: '12%' },
  { bottom: 4, left: '41%' },
] as const;

const FALLBACK_INTERESTS = [
  'Artificial Intelligence',
  'Product Design',
  'Robotics',
  'Storytelling',
  'Creative Coding',
];

function archetype(items: string[]) {
  const tech = items.filter(item => /AI|Machine|Robot|Computer|Cyber|Hardware|Coding|App|Open Source/i.test(item)).length;
  const creative = items.filter(item => /Design|Film|Story|Writing|Music|Illustration|Animation|3D/i.test(item)).length;
  if (tech >= 4 && creative >= 2) return 'THE CREATIVE SYSTEM BUILDER';
  if (tech >= 4) return 'THE SYSTEM BUILDER';
  if (creative >= 4) return 'THE CREATIVE EXPLORER';
  return 'THE CROSS-DISCIPLINARY EXPLORER';
}

function signalDescription(item: string, index: number) {
  if (index < 3) return `${item} is one of your strongest signals. It will carry extra weight when TrueSignal looks for collaborators.`;
  if (index < 6) return `${item} acts as a bridge in your map—the kind of interest that can connect two otherwise different creator worlds.`;
  return `${item} sits at the edge of your map. Exploring it may reveal a surprising new creative direction.`;
}

export default function DnaScreen() {
  const { interests = '' } = useLocalSearchParams<{ interests: string }>();
  const items = useMemo(() => {
    const parsed = interests.split(',').map(item => item.trim()).filter(Boolean).slice(0, 8);
    return parsed.length ? parsed : FALLBACK_INTERESTS;
  }, [interests]);

  const [focused, setFocused] = useState(items[0]);
  const headerIn = useRef(new Animated.Value(0)).current;
  const mapIn = useRef(new Animated.Value(0)).current;
  const insightIn = useRef(new Animated.Value(0)).current;
  const nodeAnims = useRef(POSITIONS.map(() => new Animated.Value(0))).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  const title = archetype(items);
  const rare = items.length >= 3 ? `${items[0]} × ${items[1]} × ${items[2]}` : items.join(' × ');
  const focusedIndex = Math.max(items.indexOf(focused), 0);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(headerIn, { toValue: 1, damping: 18, stiffness: 115, mass: 0.8, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(mapIn, { toValue: 1, damping: 18, stiffness: 100, mass: 0.9, useNativeDriver: true }),
        Animated.stagger(65, nodeAnims.slice(0, items.length).map(value =>
          Animated.spring(value, { toValue: 1, damping: 13, stiffness: 150, mass: 0.7, useNativeDriver: true })
        )),
      ]),
      Animated.timing(insightIn, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const orbitLoop = Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true })
    );
    pulseLoop.start();
    orbitLoop.start();

    return () => {
      pulseLoop.stop();
      orbitLoop.stop();
    };
  }, [headerIn, insightIn, items.length, mapIn, nodeAnims, orbit, pulse]);

  const enter = (value: Animated.Value, distance = 18) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.22] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const orbitRotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.page}>
      <View pointerEvents="none" style={styles.ambientPurple} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View style={enter(headerIn, 24)}>
          <View style={styles.readyRow}>
            <View style={styles.readyPill}><View style={styles.readyDot} /><Text style={styles.step}>YOUR SIGNAL IS READY</Text></View>
            <Text style={styles.signalTotal}>{items.length} SIGNALS</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>This is not a personality box. It is a living map of what pulls you in—and where those interests might lead together.</Text>
        </Animated.View>

        <Animated.View style={[styles.mapCard, enter(mapIn, 28)]}>
          <View style={styles.mapTop}>
            <View>
              <Text style={styles.mapLabel}>YOUR INTEREST CONSTELLATION</Text>
              <Text style={styles.mapHint}>Tap any signal to inspect it</Text>
            </View>
            <View style={styles.legend}><View style={styles.legendDot} /><Text style={styles.legendText}>STRONG</Text></View>
          </View>

          <View style={styles.map}>
            <View style={[styles.connection, styles.lineNorth]} />
            <View style={[styles.connection, styles.lineEast]} />
            <View style={[styles.connection, styles.lineSouth]} />
            <View style={[styles.connection, styles.lineWest]} />
            <View style={styles.ringOuter} />
            <View style={styles.ringInner} />
            <Animated.View style={[styles.markerOrbit, { transform: [{ rotate: orbitRotation }] }]}>
              <View style={styles.orbitDotPurple} />
              <View style={styles.orbitDotOrange} />
            </Animated.View>

            <Animated.View style={[styles.corePulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
            <View style={styles.core}>
              <Text style={styles.coreSmall}>INTEREST</Text>
              <Text style={styles.coreText}>YOU</Text>
            </View>

            {items.map((item, index) => {
              const position = POSITIONS[index % POSITIONS.length];
              const value = nodeAnims[index];
              const isHot = index < 3;
              const isFocused = focused === item;
              return (
                <Animated.View
                  key={item}
                  style={[
                    styles.nodeWrap,
                    position,
                    {
                      opacity: value,
                      transform: [
                        { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                        { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Inspect ${item}`}
                    onPress={() => setFocused(item)}
                    activeOpacity={0.78}
                    style={styles.nodeButton}
                  >
                    <View style={[styles.node, isHot && styles.nodeHot, isFocused && styles.nodeFocused]}>
                      {isFocused && <View style={styles.nodeCore} />}
                    </View>
                    <Text style={[styles.label, isHot && styles.labelHot, isFocused && styles.labelFocused]} numberOfLines={2}>{item}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Explore an adjacent interest"
              style={styles.portal}
              onPress={() => router.push({ pathname: '/explore', params: { seed: focused } })}
            >
              <Text style={styles.portalDot}>+</Text>
              <Text style={styles.portalText}>UNEXPLORED</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inspectCard}>
            <View style={styles.inspectTop}>
              <Text style={styles.inspectLabel}>SIGNAL {String(focusedIndex + 1).padStart(2, '0')}</Text>
              <Text style={styles.inspectStrength}>{focusedIndex < 3 ? 'STRONG PULL' : focusedIndex < 6 ? 'BRIDGE' : 'EDGE'}</Text>
            </View>
            <Text style={styles.inspectTitle}>{focused}</Text>
            <Text style={styles.inspectText}>{signalDescription(focused, focusedIndex)}</Text>
          </View>
        </Animated.View>

        <Animated.View style={enter(insightIn, 20)}>
          <View style={styles.discovery}>
            <View style={styles.discoveryMark}><View style={styles.discoveryMarkCore} /></View>
            <View style={styles.discoveryCopy}>
              <Text style={styles.discoveryLabel}>A RARE INTERSECTION</Text>
              <Text style={styles.discoveryTitle}>{rare || 'Curiosity × Creation'}</Text>
              <Text style={styles.discoveryText}>This combination gives TrueSignal a much sharper way to find people who could stretch your work in an interesting direction.</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statNumber}>{items.length}</Text><Text style={styles.statLabel}>signals</Text></View>
            <View style={styles.stat}><Text style={styles.statNumber}>3</Text><Text style={styles.statLabel}>strong pulls</Text></View>
            <View style={styles.stat}><Text style={[styles.statNumber, styles.statNumberOrange]}>∞</Text><Text style={styles.statLabel}>paths ahead</Text></View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.secondary}
              onPress={() => router.push({ pathname: '/explore', params: { seed: focused } })}
            >
              <Text style={styles.secondaryText}>Pull a thread</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => router.push('/discover')}>
              <Text style={styles.primaryText}>Find my people</Text><Text style={styles.primaryArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  ambientPurple: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: colors.lavenderWash, right: -210, top: 60, opacity: 0.8 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.lg, paddingBottom: 44 },
  readyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  readyPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.signalSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  readyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.signal },
  step: { color: colors.signal, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  signalTotal: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.25, marginTop: spacing.md, maxWidth: 620 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: spacing.sm, maxWidth: 620 },
  mapCard: { marginTop: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.md, shadowColor: colors.signal, shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 3 },
  mapTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mapLabel: { color: colors.signal, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  mapHint: { color: colors.muted, fontSize: 10, marginTop: 4 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange },
  legendText: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  map: { height: 374, position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: spacing.xs },
  ringOuter: { position: 'absolute', width: 286, height: 286, borderRadius: 143, borderWidth: 1, borderColor: colors.border },
  ringInner: { position: 'absolute', width: 176, height: 176, borderRadius: 88, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.signalSoft },
  markerOrbit: { position: 'absolute', width: 286, height: 286, borderRadius: 143 },
  orbitDotPurple: { position: 'absolute', left: 23, top: 37, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.signal },
  orbitDotOrange: { position: 'absolute', right: 9, bottom: 84, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange },
  connection: { position: 'absolute', left: '50%', top: '50%', height: 1, backgroundColor: colors.border },
  lineNorth: { width: 154, transform: [{ rotate: '-90deg' }] },
  lineEast: { width: 150, transform: [{ rotate: '-18deg' }] },
  lineSouth: { width: 150, transform: [{ rotate: '76deg' }] },
  lineWest: { width: 145, transform: [{ rotate: '-158deg' }] },
  corePulse: { position: 'absolute', width: 94, height: 94, borderRadius: 47, backgroundColor: colors.signalSoft },
  core: { width: 88, height: 88, borderRadius: 31, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center', zIndex: 3, transform: [{ rotate: '-3deg' }], shadowColor: colors.signal, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  coreSmall: { fontSize: 7, fontWeight: '900', letterSpacing: 1.3, color: '#FFFFFF', opacity: 0.68 },
  coreText: { fontSize: 19, fontWeight: '900', letterSpacing: 1.5, color: '#FFFFFF', marginTop: 2 },
  nodeWrap: { position: 'absolute', maxWidth: 118, alignItems: 'center', zIndex: 4 },
  nodeButton: { alignItems: 'center', padding: 4 },
  node: { width: 15, height: 15, borderRadius: 8, backgroundColor: colors.violet, borderWidth: 3, borderColor: colors.surface },
  nodeHot: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.orange },
  nodeFocused: { width: 25, height: 25, borderRadius: 13, backgroundColor: colors.signalSoft, borderColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  nodeCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.signal },
  label: { color: colors.muted, fontSize: 9, lineHeight: 12, fontWeight: '800', textAlign: 'center', marginTop: 3 },
  labelHot: { color: colors.text, fontSize: 10 },
  labelFocused: { color: colors.signal, fontWeight: '900' },
  portal: { position: 'absolute', right: 5, bottom: 62, alignItems: 'center', zIndex: 5 },
  portalDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.orange, color: colors.orangeDark, textAlign: 'center', lineHeight: 31, fontSize: 20, fontWeight: '500', backgroundColor: colors.orangeWash },
  portalText: { color: colors.orangeDark, fontSize: 7, fontWeight: '900', letterSpacing: 1.1, marginTop: 4 },
  inspectCard: { minHeight: 118, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  inspectTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inspectLabel: { color: colors.signal, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  inspectStrength: { color: colors.orangeDark, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  inspectTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 7 },
  inspectText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  discovery: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  discoveryMark: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '7deg' }] },
  discoveryMarkCore: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.orange },
  discoveryCopy: { flex: 1 },
  discoveryLabel: { color: colors.orangeDark, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  discoveryTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: '900', marginTop: 7 },
  discoveryText: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  stat: { flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  statNumber: { color: colors.signal, fontSize: 18, fontWeight: '900' },
  statNumberOrange: { color: colors.orangeDark },
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
  secondary: { flex: 1, borderWidth: 1, borderColor: colors.signal, paddingVertical: 17, borderRadius: radius.md, alignItems: 'center' },
  secondaryText: { color: colors.signal, fontWeight: '900' },
  primary: { flex: 1.25, backgroundColor: colors.text, paddingVertical: 17, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryText: { color: '#FFFFFF', fontWeight: '900' },
  primaryArrow: { color: colors.orange, fontSize: 18 },
});

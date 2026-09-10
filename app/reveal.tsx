import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Animated, Easing, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STAGES = ['Reading your strongest pulls', 'Finding unexpected intersections', 'Mapping potential collaborators', 'Your Interest DNA is ready'];

export default function RevealScreen() {
  const { interests = '', creatorRole = 'Creator' } = useLocalSearchParams<{ interests: string; creatorRole: string }>();
  const items = useMemo(() => interests.split(',').map(item => item.trim()).filter(Boolean), [interests]);
  const [stage, setStage] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const copy = useRef(new Animated.Value(1)).current;

  const openDna = () => router.replace({ pathname: '/dna', params: { interests, creatorRole } });

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 4600, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    const orbitLoop = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 6200, easing: Easing.linear, useNativeDriver: true }));
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    orbitLoop.start(); pulseLoop.start();
    const timers = [1000, 2200, 3400].map((time, index) => setTimeout(() => {
      Animated.sequence([
        Animated.timing(copy, { toValue: 0, duration: 130, useNativeDriver: true }),
        Animated.timing(copy, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setStage(index + 1);
    }, time));
    const finish = setTimeout(openDna, 4700);
    return () => { timers.forEach(clearTimeout); clearTimeout(finish); orbitLoop.stop(); pulseLoop.stop(); };
  }, [copy, orbit, progress, pulse]);

  const rotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.glowPurple}/><View style={styles.glowOrange}/>
      <View style={styles.shell}>
        <Text style={styles.brand}>TRUESIGNAL / INTEREST DNA</Text>
        <View style={styles.visual}>
          <Animated.View style={[styles.orbit, { transform: [{ rotate: rotation }] }]}>
            {items.slice(0, 8).map((item, index) => <View key={item} style={[styles.node, { transform: [{ rotate: `${index * 45}deg` }, { translateX: 132 }, { rotate: `${-index * 45}deg` }] }]}><Text style={styles.nodeText} numberOfLines={1}>{item}</Text></View>)}
          </Animated.View>
          <Animated.View style={[styles.pulse, { opacity: pulse.interpolate({ inputRange: [0,1], outputRange: [.5,0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0,1], outputRange: [.9,1.45] }) }] }]}/>
          <View style={styles.core}><Text style={styles.coreSmall}>YOUR</Text><Text style={styles.coreText}>SIGNAL</Text></View>
        </View>
        <View style={styles.glassCard}>
          <Text style={styles.eyebrow}>{String(stage + 1).padStart(2, '0')} / 04 · {creatorRole.toUpperCase()} MODE</Text>
          <Animated.Text style={[styles.title, { opacity: copy, transform: [{ translateY: copy.interpolate({ inputRange: [0,1], outputRange: [8,0] }) }] }]}>{STAGES[stage]}</Animated.Text>
          <Text style={styles.body}>Finding patterns. Connecting dots. Uncovering the people who could make your next idea stronger.</Text>
          <View style={styles.track}><Animated.View style={[styles.fill, { width: progress.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) }]}/></View>
          <View style={styles.chips}>{items.slice(0,4).map(item => <View key={item} style={styles.chip}><Text style={styles.chipText}>{item}</Text></View>)}</View>
        </View>
        <TouchableOpacity onPress={openDna} style={styles.skip}><Text style={styles.skipText}>Reveal now →</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#17112E',overflow:'hidden'},shell:{flex:1,width:'100%',maxWidth:760,alignSelf:'center',alignItems:'center',justifyContent:'center',padding:24},brand:{position:'absolute',top:28,color:'#CBB9FF',fontSize:9,fontWeight:'900',letterSpacing:1.8},
  glowPurple:{position:'absolute',width:420,height:420,borderRadius:210,backgroundColor:'#7548FF',opacity:.2,right:-130,top:-140},glowOrange:{position:'absolute',width:330,height:330,borderRadius:165,backgroundColor:'#FF8954',opacity:.15,left:-160,bottom:-100},
  visual:{width:340,height:340,alignItems:'center',justifyContent:'center'},orbit:{position:'absolute',width:270,height:270,borderRadius:135,borderWidth:1,borderColor:'rgba(203,185,255,.28)',alignItems:'center',justifyContent:'center'},node:{position:'absolute',width:68,paddingVertical:6,paddingHorizontal:8,borderRadius:12,backgroundColor:'rgba(255,255,255,.12)',borderWidth:1,borderColor:'rgba(255,255,255,.2)'},nodeText:{color:'#FFF',fontSize:7,fontWeight:'800',textAlign:'center'},pulse:{position:'absolute',width:108,height:108,borderRadius:38,backgroundColor:'#8C66FF'},core:{width:104,height:104,borderRadius:35,backgroundColor:'#7548FF',alignItems:'center',justifyContent:'center',shadowColor:'#9A79FF',shadowOpacity:.7,shadowRadius:25,elevation:8},coreSmall:{color:'#D8CAFF',fontSize:8,fontWeight:'900',letterSpacing:1.5},coreText:{color:'#FFF',fontSize:19,fontWeight:'900',letterSpacing:1},
  glassCard:{width:'100%',borderRadius:26,padding:24,backgroundColor:'rgba(255,255,255,.10)',borderWidth:1,borderColor:'rgba(255,255,255,.22)',shadowColor:'#000',shadowOpacity:.18,shadowRadius:24},eyebrow:{color:'#FF9A6C',fontSize:9,fontWeight:'900',letterSpacing:1.3},title:{color:'#FFF',fontSize:28,lineHeight:34,fontWeight:'900',marginTop:10},body:{color:'#C9C0D4',fontSize:12,lineHeight:19,marginTop:8,maxWidth:520},track:{height:6,borderRadius:3,backgroundColor:'rgba(255,255,255,.12)',overflow:'hidden',marginTop:20},fill:{height:6,borderRadius:3,backgroundColor:'#FF8954'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:16},chip:{paddingHorizontal:10,paddingVertical:7,borderRadius:20,backgroundColor:'rgba(117,72,255,.25)',borderWidth:1,borderColor:'rgba(203,185,255,.25)'},chipText:{color:'#E8E0FF',fontSize:8,fontWeight:'800'},skip:{marginTop:18,padding:12},skipText:{color:'#CBB9FF',fontSize:11,fontWeight:'900'},
});

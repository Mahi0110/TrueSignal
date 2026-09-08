import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Animated, Easing, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Niche = { name: string; category: string; people: string };
const CATEGORIES = ['All', 'Technology', 'Design', 'Film', 'Stories', 'Build', 'Science', 'Business', 'Culture', 'Impact'];
const CREATOR_ROLES = ['Creator', 'Builder', 'Designer', 'Filmmaker', 'Writer', 'Researcher', 'Founder', 'Explorer'];
const NICHES: Niche[] = [
  ['Artificial Intelligence','Technology','AI builders'], ['Computer Vision','Technology','visual engineers'],
  ['Robotics','Technology','robot makers'], ['Machine Learning','Technology','ML creators'],
  ['Cybersecurity','Technology','security builders'], ['Creative Coding','Technology','creative technologists'],
  ['Product Design','Design','product designers'], ['UI/UX Design','Design','experience designers'],
  ['3D Design','Design','3D artists'], ['Illustration','Design','illustrators'],
  ['Animation','Film','animators'], ['Filmmaking','Film','filmmakers'],
  ['Motion Design','Film','motion designers'], ['Documentary','Film','documentary creators'],
  ['Storytelling','Stories','storytellers'], ['Writing','Stories','writers'],
  ['Music Production','Stories','music producers'], ['Product Building','Build','product builders'],
  ['Startups','Build','early-stage founders'], ['Hardware','Build','hardware makers'],
  ['Open Source','Build','open-source contributors'], ['Game Development','Build','game creators'],
  ['Medical Imaging','Science','health-tech researchers'], ['Space Technology','Science','space builders'],
  ['Climate Science','Science','climate creators'], ['Neuroscience','Science','brain researchers'],
  ['Biotechnology','Science','bio-tech builders'], ['Human–AI Interaction','Science','HCI researchers'],
  ['3D Gaussian Splatting','Technology','spatial AI creators'], ['Generative Vision','Technology','generative artists'],
  ['Autonomous Vehicles','Technology','autonomy engineers'], ['Visual Robotics','Technology','vision-robotics builders'],
  ['No-Code Tools','Build','no-code makers'], ['Mobile Apps','Build','app creators'],
  ['Web Development','Build','web builders'], ['Indie Hacking','Build','indie founders'],
  ['Creator Economy','Business','creator strategists'], ['Brand Strategy','Business','brand builders'],
  ['Digital Marketing','Business','growth creators'], ['Community Building','Business','community leaders'],
  ['Social Entrepreneurship','Business','impact founders'], ['E-commerce','Business','commerce creators'],
  ['Photography','Film','photographers'], ['Cinematography','Film','cinematographers'],
  ['Video Editing','Film','video editors'], ['Sound Design','Film','sound designers'],
  ['Podcasting','Stories','podcasters'], ['Screenwriting','Stories','screenwriters'],
  ['Journalism','Stories','journalists'], ['Worldbuilding','Stories','worldbuilders'],
  ['Fashion Design','Culture','fashion creators'], ['Architecture','Culture','architectural creators'],
  ['Digital Art','Culture','digital artists'], ['Education','Impact','learning creators'],
  ['Accessibility','Impact','inclusive designers'], ['Sustainability','Impact','sustainability creators'],
  ['Civic Technology','Impact','civic-tech builders'], ['Mental Health Advocacy','Impact','wellbeing advocates'],
].map(([name, category, people]) => ({ name, category, people }));

function NicheCard({ niche, selected, index, onPress }: { niche: Niche; selected: boolean; index: number; onPress: () => void }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 280, delay: Math.min(index * 30, 240), easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [entrance, index]);
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 11, stiffness: 230, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={[styles.cardWrap, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0,1], outputRange: [14,0] }) }, { scale }] }]}> 
      <TouchableOpacity activeOpacity={0.88} onPress={press} style={[styles.card, selected && styles.cardSelected]}>
        <View style={styles.cardTop}>
          <View style={[styles.dot, ['Film','Build'].includes(niche.category) && styles.dotOrange]} />
          <View style={[styles.check, selected && styles.checkSelected]}><Text style={styles.checkText}>{selected ? '✓' : '+'}</Text></View>
        </View>
        <Text style={[styles.nicheName, selected && styles.white]}>{niche.name}</Text>
        <Text style={[styles.nicheMeta, selected && styles.lavender]}>Meet {niche.people}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Onboarding() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [creatorRole, setCreatorRole] = useState('Creator');
  const [customNiche, setCustomNiche] = useState('');
  const pulse = useRef(new Animated.Value(0)).current;
  const hero = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(hero, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [hero, pulse]);
  const visible = useMemo(() => NICHES.filter(n => (category === 'All' || n.category === category) && n.name.toLowerCase().includes(query.trim().toLowerCase())), [category, query]);
  const toggle = (name: string) => setSelected(current => current.includes(name) ? current.filter(item => item !== name) : current.length < 10 ? [...current, name] : current);
  const ready = selected.length >= 3;
  const addCustomNiche = () => {
    const value = customNiche.trim();
    if (!value || selected.length >= 10) return;
    if (!selected.some(item => item.toLowerCase() === value.toLowerCase())) setSelected(current => [...current, value]);
    setCustomNiche('');
  };
  const go = () => ready && router.replace({ pathname: '/dna', params: { interests: selected.join(','), creatorRole } });
  return (
    <SafeAreaView style={styles.page}>
      <Animated.View pointerEvents="none" style={[styles.ambientPurple, { transform: [{ translateY: pulse.interpolate({ inputRange: [0,1], outputRange: [-8,12] }) }] }]} />
      <Animated.View pointerEvents="none" style={[styles.ambientOrange, { transform: [{ translateX: pulse.interpolate({ inputRange: [0,1], outputRange: [8,-10] }) }] }]} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.shell}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></TouchableOpacity>
          <View style={styles.brandRow}><View style={styles.brandDot}/><Text style={styles.brand}>TrueSignal</Text></View>
          <Text style={styles.step}>INTEREST DNA · 01</Text>
        </View>
        <Animated.View style={{ opacity: hero, transform: [{ translateY: hero.interpolate({ inputRange: [0,1], outputRange: [18,0] }) }] }}>
          <View style={styles.pill}><View style={styles.liveDot}/><Text style={styles.eyebrow}>BUILD YOUR CREATIVE SIGNAL</Text></View>
          <Text style={styles.title}>What could you talk about{`\n`}for hours?</Text>
          <Text style={styles.subtitle}>Choose 3–10 niches. Each signal sharpens who you meet and why you should create together.</Text>
        </Animated.View>
        <View style={styles.roleSection}>
          <View style={styles.sectionRow}><Text style={styles.sectionTitle}>HOW DO YOU CREATE?</Text><Text style={styles.sectionHint}>Choose the role that feels closest</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {CREATOR_ROLES.map(role => <TouchableOpacity key={role} onPress={() => setCreatorRole(role)} style={[styles.roleCard, creatorRole === role && styles.roleCardActive]}><Text style={[styles.roleText, creatorRole === role && styles.roleTextActive]}>{role}</Text></TouchableOpacity>)}
          </ScrollView>
        </View>
        <View style={styles.readiness}>
          <Text style={styles.readyLabel}>{ready ? 'YOUR MAP IS READY' : `${3 - selected.length} MORE TO UNLOCK YOUR MAP`}</Text>
          <Text style={styles.readyValue}>{selected.length}<Text style={styles.readyMuted}> / 10 signals</Text></Text>
          <View style={styles.miniMap}>
            <Animated.View style={[styles.halo, { opacity: pulse.interpolate({ inputRange: [0,1], outputRange: [0.25,0.7] }), transform: [{ scale: pulse.interpolate({ inputRange: [0,1], outputRange: [0.9,1.12] }) }] }]}/>
            <View style={styles.core}><Text style={styles.coreText}>YOU</Text></View>
            {selected.slice(0,5).map((item,i) => <View key={item} style={[styles.mapNode, { transform: [{ rotate: `${i*72}deg` }, { translateX: 42 }, { rotate: `${-i*72}deg` }] }]}/>) }
          </View>
          <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(selected.length / 3, 1) * 100}%` }]}/></View>
        </View>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search a niche — animation, robotics, writing..." placeholderTextColor={colors.muted} style={styles.search}/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {CATEGORIES.map(item => <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.filter, category === item && styles.filterActive]}><Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item}</Text></TouchableOpacity>)}
        </ScrollView>
        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{category === 'All' ? 'EXPLORE ALL NICHES' : category.toUpperCase()}</Text><Text style={styles.sectionHint}>Tap anything that pulls you in</Text></View>
        <View style={styles.grid}>{visible.map((niche,index) => <NicheCard key={niche.name} niche={niche} index={index} selected={selected.includes(niche.name)} onPress={() => toggle(niche.name)}/>)}</View>
        <View style={styles.customCard}>
          <View style={styles.customCopy}><Text style={styles.customLabel}>CAN'T FIND YOUR NICHE?</Text><Text style={styles.customTitle}>Add your own signal.</Text></View>
          <View style={styles.customRow}>
            <TextInput value={customNiche} onChangeText={setCustomNiche} onSubmitEditing={addCustomNiche} placeholder="Type a specific niche" placeholderTextColor={colors.muted} style={styles.customInput}/>
            <TouchableOpacity onPress={addCustomNiche} disabled={!customNiche.trim() || selected.length >= 10} style={[styles.addButton, (!customNiche.trim() || selected.length >= 10) && styles.addDisabled]}><Text style={styles.addText}>Add +</Text></TouchableOpacity>
          </View>
          <Text style={styles.customHint}>Try something precise, like “Bio-inspired robotics” or “Interactive documentaries.”</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>{ready ? 'NEXT: SEE THE CONNECTIONS' : 'NO WRONG ANSWERS. JUST SIGNALS.'}</Text>
          <Text style={styles.footerTitle}>{ready ? 'Your collaborator map is taking shape.' : 'Pick what feels true right now.'}</Text>
          <TouchableOpacity disabled={!ready} onPress={go} style={[styles.continueButton, !ready && styles.disabled]}><Text style={styles.continueText}>{ready ? 'Build my Interest DNA  →' : `Choose ${3-selected.length} more`}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#FFF9F5',overflow:'hidden'}, shell:{width:'100%',maxWidth:980,alignSelf:'center',paddingHorizontal:spacing.lg,paddingTop:spacing.md,paddingBottom:44},
  ambientPurple:{position:'absolute',width:300,height:300,borderRadius:150,right:-160,top:70,backgroundColor:'#EEE5FF'}, ambientOrange:{position:'absolute',width:220,height:220,borderRadius:110,left:-150,bottom:40,backgroundColor:'#FFE9DC'},
  topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:42}, back:{width:40,height:40,borderRadius:14,borderWidth:1,borderColor:'#E8DDF0',backgroundColor:'#FFF',alignItems:'center',justifyContent:'center'}, backText:{color:'#17112E',fontSize:20},
  brandRow:{flexDirection:'row',alignItems:'center',gap:8},brandDot:{width:12,height:12,borderRadius:6,backgroundColor:'#7548FF'},brand:{color:'#17112E',fontSize:17,fontWeight:'900'},step:{color:'#6F6680',fontSize:9,fontWeight:'900',letterSpacing:1.3},
  pill:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:12,paddingVertical:8,borderRadius:radius.pill,backgroundColor:'#EADFFF'},liveDot:{width:6,height:6,borderRadius:3,backgroundColor:'#7548FF'},eyebrow:{color:'#7548FF',fontSize:9,fontWeight:'900',letterSpacing:1.5},
  title:{color:'#17112E',fontSize:46,lineHeight:49,fontWeight:'900',letterSpacing:-1.8,marginTop:spacing.md},subtitle:{color:'#756D83',fontSize:15,lineHeight:23,maxWidth:670,marginTop:spacing.sm},
  roleSection:{marginTop:spacing.xl},roleCard:{minWidth:112,paddingHorizontal:18,paddingVertical:14,borderRadius:16,borderWidth:1,borderColor:'#E6DCEF',backgroundColor:'#FFF',alignItems:'center'},roleCardActive:{backgroundColor:'#17112E',borderColor:'#17112E'},roleText:{color:'#6F6680',fontSize:11,fontWeight:'900'},roleTextActive:{color:'#FF8954'},
  readiness:{marginTop:spacing.xl,backgroundColor:'#17112E',borderRadius:24,padding:spacing.lg,overflow:'hidden',minHeight:142},readyLabel:{color:'#FF8954',fontSize:9,fontWeight:'900',letterSpacing:1.4},readyValue:{color:'#FFF',fontSize:31,fontWeight:'900',marginTop:8},readyMuted:{color:'#A9A0B8',fontSize:13},
  miniMap:{position:'absolute',width:110,height:110,right:35,top:10,alignItems:'center',justifyContent:'center'},halo:{position:'absolute',width:78,height:78,borderRadius:39,borderWidth:1,borderColor:'#9E7AFF'},core:{width:42,height:42,borderRadius:15,backgroundColor:'#7548FF',alignItems:'center',justifyContent:'center'},coreText:{color:'#FFF',fontSize:9,fontWeight:'900'},mapNode:{position:'absolute',width:7,height:7,borderRadius:4,backgroundColor:'#FF8954'},
  track:{position:'absolute',left:spacing.lg,right:spacing.lg,bottom:spacing.md,height:5,borderRadius:3,backgroundColor:'#302847',overflow:'hidden'},fill:{height:5,borderRadius:3,backgroundColor:'#FF8954'},
  search:{marginTop:spacing.lg,height:52,borderRadius:17,borderWidth:1,borderColor:'#E6DCEF',backgroundColor:'#FFF',paddingHorizontal:spacing.md,color:'#17112E',fontSize:14},filters:{gap:8,paddingVertical:spacing.md},filter:{paddingHorizontal:16,paddingVertical:10,borderRadius:radius.pill,borderWidth:1,borderColor:'#E6DCEF',backgroundColor:'#FFF'},filterActive:{backgroundColor:'#7548FF',borderColor:'#7548FF'},filterText:{color:'#6F6680',fontSize:11,fontWeight:'800'},filterTextActive:{color:'#FFF'},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:spacing.sm},sectionTitle:{color:'#7548FF',fontSize:10,fontWeight:'900',letterSpacing:1.4},sectionHint:{color:'#8A8294',fontSize:10},grid:{flexDirection:'row',flexWrap:'wrap',marginHorizontal:-5},cardWrap:{width:'50%',padding:5},card:{minHeight:126,borderRadius:19,borderWidth:1,borderColor:'#E7DDED',backgroundColor:'#FFF',padding:spacing.md},cardSelected:{backgroundColor:'#7548FF',borderColor:'#7548FF',shadowColor:'#7548FF',shadowOpacity:.2,shadowRadius:13,elevation:3},cardTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},dot:{width:8,height:8,borderRadius:4,backgroundColor:'#7548FF'},dotOrange:{backgroundColor:'#FF8954'},check:{width:24,height:24,borderRadius:8,borderWidth:1,borderColor:'#DDD2E7',alignItems:'center',justifyContent:'center'},checkSelected:{backgroundColor:'#FF8954',borderColor:'#FF8954'},checkText:{color:'#17112E',fontSize:13,fontWeight:'900'},nicheName:{color:'#17112E',fontSize:16,lineHeight:20,fontWeight:'900',marginTop:14},nicheMeta:{color:'#81798C',fontSize:10,marginTop:5},white:{color:'#FFF'},lavender:{color:'#DDD0FF'},
  customCard:{marginTop:spacing.lg,borderRadius:22,borderWidth:1,borderStyle:'dashed',borderColor:'#A98BFF',backgroundColor:'#F7F1FF',padding:spacing.lg},customCopy:{marginBottom:spacing.md},customLabel:{color:'#7548FF',fontSize:9,fontWeight:'900',letterSpacing:1.4},customTitle:{color:'#17112E',fontSize:21,fontWeight:'900',marginTop:5},customRow:{flexDirection:'row',gap:8},customInput:{flex:1,minHeight:50,borderRadius:15,borderWidth:1,borderColor:'#DED0F1',backgroundColor:'#FFF',paddingHorizontal:spacing.md,color:'#17112E',fontSize:13},addButton:{minWidth:92,borderRadius:15,backgroundColor:'#FF8954',alignItems:'center',justifyContent:'center'},addDisabled:{opacity:.45},addText:{color:'#17112E',fontSize:12,fontWeight:'900'},customHint:{color:'#756D83',fontSize:10,lineHeight:16,marginTop:spacing.sm},
  footer:{marginTop:spacing.lg,borderRadius:22,backgroundColor:'#FFF0E7',borderWidth:1,borderColor:'#FFD7C2',padding:spacing.lg,gap:spacing.sm},footerLabel:{color:'#D65822',fontSize:9,fontWeight:'900',letterSpacing:1.3},footerTitle:{color:'#17112E',fontSize:19,fontWeight:'900'},continueButton:{minHeight:54,borderRadius:17,backgroundColor:'#FF8954',alignItems:'center',justifyContent:'center',marginTop:6},disabled:{backgroundColor:'#E8D7CE'},continueText:{color:'#17112E',fontSize:13,fontWeight:'900'},
});

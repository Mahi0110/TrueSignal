import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

const THREADS: Record<string,string[]> = {
  'Artificial Intelligence':['AI Agents','Generative Interfaces','Human-AI Interaction','Embodied AI','AI Safety'],
  'Robotics':['Embodied AI','Autonomous Systems','Soft Robotics','Robot Vision','Human-Robot Interaction'],
  'Computer Vision':['Visual Robotics','Medical Imaging','Spatial Computing','Generative Vision','3D Reconstruction'],
  'Cybersecurity':['Adversarial AI','Privacy Engineering','Threat Intelligence','Secure Systems','Social Engineering Defense'],
  'UI/UX Design':['Generative Interfaces','Interaction Design','Spatial UX','Accessibility','Design Systems'],
  'Product Design':['Creator Tools','Hardware UX','Design Systems','Prototype Engineering','Community Products'],
  'Filmmaking':['Virtual Production','Interactive Storytelling','Cinematic AI','Motion Design','Documentary Tech'],
  'Storytelling':['Interactive Fiction','Narrative Design','Worldbuilding','Creator Education','Visual Storytelling'],
  'Machine Learning':['Recommendation Systems','Multimodal AI','TinyML','Reinforcement Learning','Responsible AI'],
};

const FALLBACK=['Creative Technology','Community Building','Interactive Media','Experimental Design','Digital Craft'];

export default function ExploreScreen(){
  const params=useLocalSearchParams<{seed?:string}>();
  const [trail,setTrail]=useState<string[]>([params.seed || 'Artificial Intelligence']);
  const current=trail[trail.length-1];
  const branches=useMemo(()=>THREADS[current] || FALLBACK,[current]);

  const pull=(item:string)=>setTrail(v=>[...v,item]);
  const back=()=>trail.length>1?setTrail(v=>v.slice(0,-1)):router.back();

  return <SafeAreaView style={styles.page}>
    <View style={styles.header}>
      <TouchableOpacity onPress={back}><Text style={styles.back}>←</Text></TouchableOpacity>
      <Text style={styles.kicker}>PULL A THREAD</Text>
      <Text style={styles.depth}>DEPTH {trail.length}</Text>
    </View>

    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Follow your curiosity.</Text>
      <Text style={styles.body}>Tap a branch and TrueSignal opens the next layer. There is no perfect path — the point is to notice what keeps pulling you forward.</Text>

      <View style={styles.trail}>
        {trail.map((x,i)=><View key={`${x}-${i}`} style={styles.crumb}><Text style={styles.crumbText}>{x}</Text>{i<trail.length-1&&<Text style={styles.arrow}>›</Text>}</View>)}
      </View>

      <View style={styles.canvas}>
        <View style={styles.centerNode}><Text style={styles.centerSmall}>CURRENT THREAD</Text><Text style={styles.centerText}>{current}</Text></View>
        {branches.map((item,i)=><TouchableOpacity key={item} activeOpacity={.85} onPress={()=>pull(item)} style={[styles.branch,i===0&&styles.branchFeatured]}>
          <View style={[styles.dot,i===0&&styles.dotFeatured]}/>
          <View style={styles.branchCopy}><Text style={styles.branchTitle}>{item}</Text><Text style={styles.branchHint}>{i===0?'Strong adjacent signal':'Explore this direction'}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>)}
      </View>

      <View style={styles.insight}>
        <Text style={styles.insightLabel}>WHY THIS MATTERS</Text>
        <Text style={styles.insightText}>Your exploration trail becomes another signal. TrueSignal can use the paths you choose — not just the interests you typed — to surface better creators, projects and communities.</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={()=>router.push('/discover')}><Text style={styles.buttonText}>Use this signal to find creators</Text></TouchableOpacity>
    </ScrollView>
  </SafeAreaView>
}

const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},header:{paddingHorizontal:spacing.lg,paddingTop:spacing.sm,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{color:colors.text,fontSize:28,fontWeight:'500'},kicker:{color:colors.signal,fontSize:10,fontWeight:'900',letterSpacing:1.8},depth:{color:colors.muted,fontSize:9,fontWeight:'900',letterSpacing:1.2},content:{padding:spacing.lg,paddingTop:spacing.md,paddingBottom:40},
  title:{color:colors.text,fontSize:38,lineHeight:42,fontWeight:'900',letterSpacing:-1.2},body:{color:colors.muted,fontSize:15,lineHeight:23,marginTop:spacing.sm},trail:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:6,marginTop:spacing.lg},crumb:{flexDirection:'row',alignItems:'center'},crumbText:{color:colors.cyan,fontSize:11,fontWeight:'800'},arrow:{color:colors.muted,marginLeft:6},
  canvas:{marginTop:spacing.lg,gap:10},centerNode:{backgroundColor:colors.signal,borderRadius:radius.md,padding:spacing.lg,minHeight:110,justifyContent:'center'},centerSmall:{color:'#090A0F',opacity:.55,fontSize:9,fontWeight:'900',letterSpacing:1.5},centerText:{color:'#090A0F',fontSize:26,lineHeight:31,fontWeight:'900',marginTop:5},branch:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,flexDirection:'row',alignItems:'center',gap:12},branchFeatured:{borderColor:colors.cyan,backgroundColor:colors.surfaceRaised},dot:{width:12,height:12,borderRadius:6,backgroundColor:colors.violet},dotFeatured:{backgroundColor:colors.cyan,width:15,height:15,borderRadius:8},branchCopy:{flex:1},branchTitle:{color:colors.text,fontSize:16,fontWeight:'900'},branchHint:{color:colors.muted,fontSize:11,marginTop:4},chevron:{color:colors.signal,fontSize:24},
  insight:{marginTop:spacing.lg,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.lg},insightLabel:{color:colors.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.5},insightText:{color:colors.text,fontSize:13,lineHeight:20,fontWeight:'600',marginTop:8},button:{marginTop:spacing.md,backgroundColor:colors.signal,paddingVertical:18,borderRadius:radius.md,alignItems:'center'},buttonText:{color:'#090A0F',fontWeight:'900',fontSize:15}
});

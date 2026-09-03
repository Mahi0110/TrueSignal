import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

const INTERESTS = ['Artificial Intelligence','Design','Film','Writing','Robotics','Photography','Music','Startups','3D','Gaming','Open Source','Animation','Fashion','Science','Hardware','Storytelling'];

export default function Onboarding() {
  const [selected,setSelected]=useState<string[]>([]);
  const toggle=(item:string)=>setSelected(v=>v.includes(item)?v.filter(x=>x!==item):v.length<10?[...v,item]:v);
  return <SafeAreaView style={styles.page}>
    <View style={styles.header}><Text style={styles.step}>01 / INTEREST DNA</Text><Text style={styles.count}>{selected.length}/10</Text></View>
    <Text style={styles.title}>What pulls you in?</Text>
    <Text style={styles.body}>Choose 3–10 interests. Don't optimize your profile — pick what you're genuinely curious about.</Text>
    <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
      {INTERESTS.map(item=>{const active=selected.includes(item);return <TouchableOpacity key={item} onPress={()=>toggle(item)} style={[styles.chip,active&&styles.chipActive]}><Text style={[styles.chipText,active&&styles.chipTextActive]}>{item}</Text></TouchableOpacity>})}
    </ScrollView>
    <TouchableOpacity disabled={selected.length<3} onPress={()=>router.push({pathname:'/dna',params:{interests:selected.join(',')}})} style={[styles.button,selected.length<3&&styles.disabled]}><Text style={styles.buttonText}>{selected.length<3?`Choose ${3-selected.length} more`:'Reveal my Interest DNA'}</Text></TouchableOpacity>
  </SafeAreaView>
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background,padding:spacing.lg},header:{flexDirection:'row',justifyContent:'space-between',marginBottom:spacing.xl},step:{color:colors.signal,fontSize:11,fontWeight:'900',letterSpacing:1.5},count:{color:colors.muted,fontWeight:'800'},title:{color:colors.text,fontSize:38,fontWeight:'900',letterSpacing:-1},body:{color:colors.muted,fontSize:16,lineHeight:24,marginTop:spacing.sm,marginBottom:spacing.lg},grid:{flexDirection:'row',flexWrap:'wrap',gap:10,paddingBottom:spacing.xl},chip:{borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,paddingHorizontal:16,paddingVertical:13,borderRadius:radius.pill},chipActive:{backgroundColor:colors.signal,borderColor:colors.signal},chipText:{color:colors.text,fontWeight:'700'},chipTextActive:{color:'#090A0F'},button:{backgroundColor:colors.signal,padding:18,borderRadius:radius.md,alignItems:'center'},disabled:{opacity:.3},buttonText:{color:'#090A0F',fontWeight:'900',fontSize:16}});

import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

const POSITIONS = [
  {top:18,left:'38%'},{top:80,left:'8%'},{top:76,right:'5%'},{top:165,left:'4%'},{top:172,right:'3%'},{bottom:62,left:'18%'},{bottom:35,right:'14%'},{bottom:5,left:'43%'}
] as const;

function archetype(items:string[]) {
  const tech = items.filter(x => /AI|Machine|Robot|Computer|Cyber|Hardware|Coding|App|Open Source/i.test(x)).length;
  const creative = items.filter(x => /Design|Film|Story|Writing|Music|Illustration|Animation|3D/i.test(x)).length;
  if (tech >= 4 && creative >= 2) return 'THE CREATIVE SYSTEM BUILDER';
  if (tech >= 4) return 'THE SYSTEM BUILDER';
  if (creative >= 4) return 'THE CREATIVE EXPLORER';
  return 'THE CROSS-DISCIPLINARY EXPLORER';
}

export default function DnaScreen(){
  const {interests=''}=useLocalSearchParams<{interests:string}>();
  const items=interests.split(',').filter(Boolean).slice(0,8);
  const title = archetype(items);
  const rare = items.length >= 3 ? `${items[0]} × ${items[1]} × ${items[2]}` : items.join(' × ');

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.step}>YOUR SIGNAL IS READY</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>Your Interest DNA is a living map. Strong nodes show what already pulls you in; dim paths hint at where your curiosity could go next.</Text>

        <View style={styles.map}>
          <View style={styles.ringOuter}/><View style={styles.ringInner}/>
          <View style={styles.core}><Text style={styles.coreSmall}>INTEREST</Text><Text style={styles.coreText}>YOU</Text></View>
          {items.map((x,i)=>{
            const p=POSITIONS[i % POSITIONS.length];
            return <View key={x} style={[styles.nodeWrap,p]}>
              <View style={[styles.node,i<3&&styles.nodeHot]}/>
              <Text style={[styles.label,i<3&&styles.labelHot]} numberOfLines={2}>{x}</Text>
            </View>
          })}
          <TouchableOpacity style={styles.portal} onPress={()=>router.push({pathname:'/explore',params:{seed:items[0] || 'Artificial Intelligence'}})}>
            <Text style={styles.portalDot}>+</Text><Text style={styles.portalText}>UNEXPLORED</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.discovery}>
          <Text style={styles.discoveryLabel}>WE FOUND AN INTERSECTION</Text>
          <Text style={styles.discoveryTitle}>{rare || 'Curiosity × Creation'}</Text>
          <Text style={styles.discoveryText}>This combination is more useful than a generic interest list. TrueSignal uses intersections like this to find people who can extend what you already care about.</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondary} onPress={()=>router.push({pathname:'/explore',params:{seed:items[0] || 'Artificial Intelligence'}})}><Text style={styles.secondaryText}>Pull a thread</Text></TouchableOpacity>
          <TouchableOpacity style={styles.primary} onPress={()=>router.push('/discover')}><Text style={styles.primaryText}>Find my people</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:40},step:{color:colors.signal,fontSize:11,fontWeight:'900',letterSpacing:1.8,marginTop:spacing.sm},title:{color:colors.text,fontSize:36,lineHeight:40,fontWeight:'900',letterSpacing:-1.2,marginTop:spacing.md},body:{color:colors.muted,fontSize:15,lineHeight:23,marginTop:spacing.sm},
  map:{height:390,marginTop:spacing.lg,position:'relative',alignItems:'center',justifyContent:'center',overflow:'hidden'},ringOuter:{position:'absolute',width:300,height:300,borderRadius:150,borderWidth:1,borderColor:colors.border},ringInner:{position:'absolute',width:190,height:190,borderRadius:95,borderWidth:1,borderColor:colors.surfaceRaised},core:{width:92,height:92,borderRadius:46,backgroundColor:colors.signal,alignItems:'center',justifyContent:'center',zIndex:3},coreSmall:{fontSize:8,fontWeight:'900',letterSpacing:1.3,color:'#090A0F',opacity:.6},coreText:{fontSize:19,fontWeight:'900',letterSpacing:1.5,color:'#090A0F'},
  nodeWrap:{position:'absolute',maxWidth:120,alignItems:'center',zIndex:2},node:{width:13,height:13,borderRadius:7,backgroundColor:colors.violet,borderWidth:3,borderColor:colors.background},nodeHot:{width:18,height:18,borderRadius:9,backgroundColor:colors.cyan},label:{color:colors.muted,fontSize:10,fontWeight:'800',textAlign:'center',marginTop:5},labelHot:{color:colors.text,fontSize:11},
  portal:{position:'absolute',right:12,bottom:88,alignItems:'center'},portalDot:{width:34,height:34,borderRadius:17,borderWidth:1,borderStyle:'dashed',borderColor:colors.signal,color:colors.signal,textAlign:'center',lineHeight:31,fontSize:20,fontWeight:'500'},portalText:{color:colors.signal,fontSize:8,fontWeight:'900',letterSpacing:1.2,marginTop:5},
  discovery:{backgroundColor:colors.surfaceRaised,borderRadius:radius.md,padding:spacing.lg,borderWidth:1,borderColor:colors.border},discoveryLabel:{color:colors.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.6},discoveryTitle:{color:colors.text,fontSize:20,lineHeight:26,fontWeight:'900',marginTop:8},discoveryText:{color:colors.muted,fontSize:13,lineHeight:20,marginTop:8},
  actionsRow:{flexDirection:'row',gap:10,marginTop:spacing.md},secondary:{flex:1,borderWidth:1,borderColor:colors.signal,paddingVertical:17,borderRadius:radius.md,alignItems:'center'},secondaryText:{color:colors.signal,fontWeight:'900'},primary:{flex:1,backgroundColor:colors.signal,paddingVertical:17,borderRadius:radius.md,alignItems:'center'},primaryText:{color:'#090A0F',fontWeight:'900'}
});

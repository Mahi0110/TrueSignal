import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.top}>
        <Text style={styles.wordmark}>✦  TrueSignal</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>CREATOR-FIRST PLATFORM</Text></View>
      </View>

      <View style={styles.hero}>
        <View style={styles.miniLabel}><Text style={styles.miniLabelText}>BUILT FOR EMERGING CREATORS</Text></View>
        <Text style={styles.title}>Made for{`\n`}<Text style={styles.purple}>small </Text><Text style={styles.orange}>creators.</Text></Text>
        <Text style={styles.body}>A creator-first network where your ideas and interests matter more than your follower count.</Text>

        <View style={styles.promiseBox}>
          <View style={styles.promise}><Text style={styles.check}>✓</Text><Text style={styles.promiseText}>Find creators who genuinely match your interests</Text></View>
          <View style={styles.promise}><Text style={styles.check}>✓</Text><Text style={styles.promiseText}>Turn shared curiosity into collaborations</Text></View>
          <View style={styles.promise}><Text style={styles.check}>✓</Text><Text style={styles.promiseText}>Get discovered for what you create — not your numbers</Text></View>
        </View>

        <View style={styles.sketch}>
          <View style={[styles.bubble, styles.b1]}><Text style={styles.bubbleText}>AI</Text></View>
          <View style={[styles.bubble, styles.b2]}><Text style={styles.bubbleText}>DESIGN</Text></View>
          <View style={[styles.bubble, styles.b3]}><Text style={styles.bubbleText}>FILM</Text></View>
          <View style={styles.centerBubble}><Text style={styles.centerText}>YOU</Text></View>
          <Text style={styles.note}>small creators.{`\n`}big possibilities ↗</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity activeOpacity={0.86} style={styles.primary} onPress={() => router.push('/onboarding')}>
          <Text style={styles.primaryText}>Build my Interest DNA</Text><Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.caption}>About 90 seconds · no follower count required</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background,paddingHorizontal:24,paddingTop:10},
  top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  wordmark:{color:colors.text,fontSize:18,fontWeight:'900',letterSpacing:-.4},
  badge:{backgroundColor:colors.signalSoft,borderRadius:999,paddingHorizontal:12,paddingVertical:7},
  badgeText:{color:colors.signal,fontSize:9,fontWeight:'900',letterSpacing:1.2},
  hero:{flex:1,justifyContent:'center'},
  miniLabel:{alignSelf:'flex-start',backgroundColor:'#F4EDFF',paddingHorizontal:11,paddingVertical:7,borderRadius:999,marginBottom:16},
  miniLabelText:{color:colors.signal,fontSize:9,fontWeight:'900',letterSpacing:1.4},
  title:{color:colors.text,fontSize:49,lineHeight:51,fontWeight:'900',letterSpacing:-2.1},
  purple:{color:colors.signal},orange:{color:colors.orange},
  body:{color:colors.muted,fontSize:16,lineHeight:24,marginTop:16,maxWidth:520},
  promiseBox:{marginTop:24,gap:12},promise:{flexDirection:'row',alignItems:'flex-start',gap:10},
  check:{width:22,height:22,textAlign:'center',lineHeight:22,borderRadius:11,overflow:'hidden',backgroundColor:colors.signalSoft,color:colors.signal,fontWeight:'900'},
  promiseText:{flex:1,color:colors.text,fontSize:14,lineHeight:21,fontWeight:'600'},
  sketch:{height:145,marginTop:24,position:'relative',borderRadius:26,backgroundColor:'#FFF1E8',borderWidth:1,borderColor:'#FFD8C2',alignItems:'center',justifyContent:'center'},
  centerBubble:{width:64,height:64,borderRadius:32,backgroundColor:colors.signal,alignItems:'center',justifyContent:'center'},centerText:{color:'#fff',fontWeight:'900',letterSpacing:1.5},
  bubble:{position:'absolute',paddingHorizontal:11,paddingVertical:7,borderRadius:999,backgroundColor:'#fff',borderWidth:1,borderColor:colors.border},bubbleText:{fontSize:9,color:colors.text,fontWeight:'900',letterSpacing:1},
  b1:{left:'14%',top:20},b2:{right:'12%',top:26},b3:{left:'18%',bottom:18},
  note:{position:'absolute',right:16,bottom:13,color:colors.orange,fontSize:12,fontStyle:'italic',fontWeight:'800',transform:[{rotate:'-5deg'}]},
  actions:{paddingBottom:16},primary:{backgroundColor:colors.signal,minHeight:58,borderRadius:20,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:12,shadowColor:'#7C4DFF',shadowOpacity:.18,shadowRadius:14,shadowOffset:{width:0,height:7},elevation:4},
  primaryText:{color:'#fff',fontWeight:'900',fontSize:16},arrow:{color:'#fff',fontSize:22},caption:{color:colors.muted,textAlign:'center',fontSize:11,marginTop:12}
});

import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.top}><Text style={styles.wordmark}>TRUESIGNAL</Text><Text style={styles.badge}>CREATOR-FIRST</Text></View>
      <View style={styles.hero}>
        <View style={styles.orbit}>
          <View style={[styles.node, styles.n1]} /><View style={[styles.node, styles.n2]} /><View style={[styles.node, styles.n3]} /><View style={[styles.node, styles.n4]} />
          <View style={styles.core}><Text style={styles.coreText}>YOU</Text></View>
        </View>
        <Text style={styles.eyebrow}>YOUR INTERESTS ARE A SIGNAL.</Text>
        <Text style={styles.title}>Find the people worth knowing.</Text>
        <Text style={styles.body}>TrueSignal connects emerging creators through interests, skills and creative potential — not follower count.</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primary} onPress={() => router.push('/onboarding')}><Text style={styles.primaryText}>Build my Interest DNA</Text></TouchableOpacity>
        <Text style={styles.caption}>Discover people. Understand the match. Create together.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background,padding:spacing.lg}, top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  wordmark:{color:colors.text,fontSize:16,fontWeight:'900',letterSpacing:2}, badge:{color:colors.signal,fontSize:10,fontWeight:'800',letterSpacing:1.4},
  hero:{flex:1,justifyContent:'center'}, orbit:{height:220,marginBottom:spacing.xl,position:'relative',alignItems:'center',justifyContent:'center'},
  core:{width:82,height:82,borderRadius:41,borderWidth:1,borderColor:colors.signal,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},coreText:{color:colors.signal,fontWeight:'900',letterSpacing:2},
  node:{position:'absolute',width:22,height:22,borderRadius:11,backgroundColor:colors.violet,borderWidth:4,borderColor:colors.background},n1:{top:15,left:'28%'},n2:{top:55,right:'18%',backgroundColor:colors.cyan},n3:{bottom:25,left:'18%',backgroundColor:colors.signal},n4:{bottom:5,right:'30%'},
  eyebrow:{color:colors.signal,fontWeight:'800',fontSize:12,letterSpacing:1.8,marginBottom:spacing.md},title:{color:colors.text,fontSize:44,lineHeight:48,fontWeight:'900',letterSpacing:-1.5},body:{color:colors.muted,fontSize:17,lineHeight:25,marginTop:spacing.md,maxWidth:500},
  actions:{paddingBottom:spacing.md},primary:{backgroundColor:colors.signal,paddingVertical:18,borderRadius:radius.md,alignItems:'center'},primaryText:{color:'#0A0B0D',fontWeight:'900',fontSize:16},caption:{color:colors.muted,textAlign:'center',fontSize:12,marginTop:spacing.md}
});

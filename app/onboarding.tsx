import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Choice = { label: string; tags: string[] };
type Prompt = { question: string; left: Choice; right: Choice };

const PROMPTS: Prompt[] = [
  { question: 'Which rabbit hole would you fall into first?', left: { label: 'Build an AI agent', tags: ['Artificial Intelligence','Product Building'] }, right: { label: 'Design its interface', tags: ['UI/UX Design','Product Design'] } },
  { question: 'What sounds more exciting?', left: { label: 'Train a robot', tags: ['Robotics','Hardware'] }, right: { label: 'Find security flaws', tags: ['Cybersecurity','Open Source'] } },
  { question: 'Pick the project you would start tonight.', left: { label: 'Film a visual story', tags: ['Filmmaking','Storytelling'] }, right: { label: 'Prototype an app', tags: ['App Development','Startups'] } },
  { question: 'Where does your curiosity pull harder?', left: { label: 'Understand how systems work', tags: ['Science','Machine Learning'] }, right: { label: 'Make something people feel', tags: ['Writing','Music Production'] } },
  { question: 'Which world would you rather explore?', left: { label: 'Computer vision + physical space', tags: ['Computer Vision','3D Design'] }, right: { label: 'Animation + interactive worlds', tags: ['Animation','Game Development'] } },
  { question: 'What kind of progress feels best?', left: { label: 'A clever technical breakthrough', tags: ['Creative Coding','Artificial Intelligence'] }, right: { label: 'A strong creative concept', tags: ['Illustration','Storytelling'] } },
  { question: 'Choose your instinct.', left: { label: 'Build the thing', tags: ['Product Building','Hardware'] }, right: { label: 'Explain the thing', tags: ['Writing','Filmmaking'] } },
  { question: 'Final one: what would you rather be known for?', left: { label: 'Inventing what comes next', tags: ['Startups','Robotics'] }, right: { label: 'Seeing connections others miss', tags: ['Psychology','Creative Coding'] } },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const prompt = PROMPTS[step];
  const progress = (step + 1) / PROMPTS.length;

  const unique = useMemo(() => Array.from(new Set(answers)), [answers]);

  const choose = (choice: Choice) => {
    const next = [...answers, ...choice.tags];
    if (step === PROMPTS.length - 1) {
      const finalInterests = Array.from(new Set(next)).slice(0, 10);
      router.replace({ pathname: '/dna', params: { interests: finalInterests.join(',') } });
      return;
    }
    setAnswers(next);
    setStep(v => v + 1);
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.topRow}>
        <Text style={styles.stepLabel}>INTEREST DNA</Text>
        <Text style={styles.counter}>{step + 1} / {PROMPTS.length}</Text>
      </View>

      <View style={styles.track}><View style={[styles.fill,{width:`${progress * 100}%`}]} /></View>

      <View style={styles.signalRow}>
        <Text style={styles.signalText}>{step < 2 ? 'Reading your first signals…' : step < 5 ? 'Your map is forming.' : 'We are finding your intersections.'}</Text>
        <Text style={styles.signalCount}>{unique.length} signals</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.question}>{prompt.question}</Text>
        <Text style={styles.helper}>Do not overthink it. Pick the one that pulls you in.</Text>

        <View style={styles.cards}>
          <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => choose(prompt.left)}>
            <Text style={styles.cardIndex}>A</Text>
            <Text style={styles.cardText}>{prompt.left.label}</Text>
            <Text style={styles.tap}>TAP TO CHOOSE</Text>
          </TouchableOpacity>

          <View style={styles.vs}><Text style={styles.vsText}>OR</Text></View>

          <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => choose(prompt.right)}>
            <Text style={styles.cardIndex}>B</Text>
            <Text style={styles.cardText}>{prompt.right.label}</Text>
            <Text style={styles.tap}>TAP TO CHOOSE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>TrueSignal maps curiosity, not popularity.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background,padding:spacing.lg},
  topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:spacing.sm},
  stepLabel:{color:colors.signal,fontSize:11,fontWeight:'900',letterSpacing:1.8},counter:{color:colors.muted,fontWeight:'800'},
  track:{height:4,backgroundColor:colors.surfaceRaised,borderRadius:2,marginTop:spacing.md,overflow:'hidden'},fill:{height:4,backgroundColor:colors.signal,borderRadius:2},
  signalRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:spacing.md},signalText:{color:colors.cyan,fontSize:12,fontWeight:'800'},signalCount:{color:colors.muted,fontSize:11,fontWeight:'700'},
  center:{flex:1,justifyContent:'center'},question:{color:colors.text,fontSize:34,lineHeight:39,fontWeight:'900',letterSpacing:-1.2,maxWidth:520},helper:{color:colors.muted,fontSize:15,lineHeight:22,marginTop:spacing.sm,marginBottom:spacing.xl},
  cards:{gap:12},card:{minHeight:150,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,padding:spacing.lg,justifyContent:'space-between'},cardIndex:{color:colors.signal,fontSize:11,fontWeight:'900',letterSpacing:1.5},cardText:{color:colors.text,fontSize:24,lineHeight:29,fontWeight:'900',maxWidth:'90%'},tap:{color:colors.muted,fontSize:10,fontWeight:'800',letterSpacing:1.3},
  vs:{position:'absolute',alignSelf:'center',top:'47%',zIndex:2,width:38,height:38,borderRadius:19,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},vsText:{color:colors.muted,fontSize:10,fontWeight:'900'},
  footer:{color:colors.muted,textAlign:'center',fontSize:11,marginBottom:spacing.sm}
});

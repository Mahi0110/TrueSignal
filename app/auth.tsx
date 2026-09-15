import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Button, Notice, Page, ui } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/api";
export default function Auth() {
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit() {
    if (!supabase) {
      setMessage(
        "Accounts are not connected yet. You can still explore your Interest DNA.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = signup
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
      if (result.error) throw result.error;
      if (result.data.session) router.replace("/profile");
      else
        setMessage(
          "Check your email to confirm your account, then return here to sign in.",
        );
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title={signup ? "Make room for your next idea." : "Welcome back."}
      subtitle="Save your DNA, meet creators and work together. Your email stays private."
    >
      <View style={ui.card}>
        <Text style={ui.label}>Email</Text>
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          style={ui.input}
        />
        <Text style={ui.label}>Password</Text>
        <TextInput
          accessibilityLabel="Password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete={signup ? "new-password" : "current-password"}
          value={password}
          onChangeText={setPassword}
          style={ui.input}
        />
        <Button
          label={busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
          disabled={busy || !email.trim() || password.length < 8}
          onPress={() => void submit()}
        />
        <Notice text={message} />
        <Notice text="Use at least 8 characters for your password." />
        <Button
          secondary
          disabled={busy}
          label={
            signup
              ? "Already have an account? Sign in"
              : "New here? Create an account"
          }
          onPress={() => {
            setSignup(!signup);
            setMessage("");
          }}
        />
      </View>
      <Button
        secondary
        label="Explore my interests first"
        onPress={() => router.push("/onboarding")}
      />
    </Page>
  );
}

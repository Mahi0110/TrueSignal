import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
const require = createRequire(import.meta.url);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const routes = [];
const state = {
  draft: { interest_names: [], creator_type: "Creator" },
  profile: null,
  saveDraft: async (p) => {
    state.draft = p;
  },
};
// Test real screen state and accessibility actions with native host views replaced by test hosts.
const nativeStub = `import React from 'react'; export const View='View',Text='Text',TouchableOpacity='TouchableOpacity',SafeAreaView='SafeAreaView',ScrollView='ScrollView',TextInput='TextInput',ActivityIndicator='ActivityIndicator'; export const StyleSheet={create:x=>x,absoluteFill:{}}; export const Animated={View:'AnimatedView',Value:class {constructor(v){this.v=v;}setValue(v){this.v=v;}interpolate(){return 1;}},timing:()=>({start(){},stop(){}})};`;
const outdir = await fs.mkdtemp(path.join(os.tmpdir(), "truesignal-ui-"));
async function bundle(entry) {
  const outfile = path.join(outdir, path.basename(entry) + ".cjs");
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    plugins: [
      {
        name: "native-test-hosts",
        setup(b) {
          b.onResolve({ filter: /^(react|react\/jsx-runtime)$/ }, (a) => ({
            path: require.resolve(a.path),
            external: true,
          }));
          b.onResolve({ filter: /^react-native$/ }, () => ({
            path: "native",
            namespace: "mock",
          }));
          b.onResolve({ filter: /^expo-router$/ }, () => ({
            path: "router",
            namespace: "mock",
          }));
          b.onResolve({ filter: /AppContext$/ }, () => ({
            path: "app",
            namespace: "mock",
          }));
          b.onResolve({ filter: /useReducedMotion$/ }, () => ({
            path: "motion",
            namespace: "mock",
          }));
          b.onResolve({ filter: /\/lib\/api$/ }, () => ({
            path: "api",
            namespace: "mock",
          }));
          b.onLoad({ filter: /.*/, namespace: "mock" }, (a) => ({
            loader: "js",
            contents:
              a.path === "native"
                ? nativeStub
                : a.path === "router"
                  ? `export const router={push:(r)=>globalThis.__uiRoutes.push(r),replace:(r)=>globalThis.__uiRoutes.push(r)};`
                  : a.path === "app"
                    ? `export const useApp=()=>globalThis.__uiState;`
                    : a.path === "motion"
                      ? `export const useReducedMotion=()=>true;`
                      : `export const errorMessage=e=>e.message;`,
          }));
        },
      },
    ],
  });
  return require(outfile).default;
}
globalThis.__uiRoutes = routes;
globalThis.__uiState = state;
const Onboarding = await bundle(path.resolve("app/onboarding.tsx"));
test("category circle opens niche nodes, preserves selections, searches, adds custom niches and persists DNA", async () => {
  let r;
  await act(async () => {
    r = TestRenderer.create(React.createElement(Onboarding));
  });
  const button = (label) =>
    r.root.findAll(
      (n) =>
        n.type === "TouchableOpacity" &&
        (n.props.accessibilityLabel === label ||
          n.findAll((x) => x.type === "Text" && x.props.children === label)
            .length > 0),
    )[0];
  const press = async (label) => {
    const b = button(label);
    assert.ok(b, `Missing ${label}`);
    assert.ok(!b.props.disabled);
    await act(async () => {
      b.props.onPress();
    });
  };
  assert.equal(
    r.root.findAll(
      (n) =>
        n.type === "TouchableOpacity" &&
        String(n.props.accessibilityLabel).startsWith("Open "),
    ).length,
    10,
  );
  await press("Open Stories niches");
  await press("Select Poetry");
  await press("Select Spoken Word");
  await press("Back to categories");
  await press("Open Design niches");
  await press("Select Illustration");
  assert.ok(button("Reveal my Interest DNA →"));
  await press("Back to categories");
  await press("Open Stories niches");
  assert.ok(button("Remove Poetry"));
  const input = (label) => r.root.findByProps({ accessibilityLabel: label });
  await act(async () => {
    input("Jump to a niche").props.onChangeText("Robotics");
  });
  await press("Select Robotics");
  await act(async () => {
    input("Your own niche").props.onChangeText("Poetry, with illustrations");
  });
  await press("Add custom niche +");
  await press("Reveal my Interest DNA →");
  assert.deepEqual(state.draft.interest_names, [
    "Poetry",
    "Spoken Word",
    "Illustration",
    "Robotics",
    "Poetry, with illustrations",
  ]);
  assert.equal(routes.at(-1), "/dna");
  await act(async () => r.unmount());
});
test("selection cap remains enforced across category switches and custom niches", async () => {
  state.draft = {
    ...state.draft,
    interest_names: Array.from({ length: 10 }, (_, i) => `Custom ${i}`),
  };
  let r;
  await act(async () => {
    r = TestRenderer.create(React.createElement(Onboarding));
  });
  const press = async (label) => {
    const b = r.root.findAll(
      (n) =>
        n.type === "TouchableOpacity" &&
        (n.props.accessibilityLabel === label ||
          n.findAll((x) => x.type === "Text" && x.props.children === label)
            .length > 0),
    )[0];
    await act(async () => b.props.onPress());
  };
  await press("Open Stories niches");
  await press("Select Poetry");
  assert.ok(
    !r.root.findAll(
      (n) =>
        n.type === "TouchableOpacity" &&
        n.props.accessibilityLabel === "Remove Poetry",
    ).length,
  );
  await press("Reveal my Interest DNA →");
  assert.equal(state.draft.interest_names.length, 10);
  await act(async () => r.unmount());
});
test.after(async () => {
  await fs.rm(outdir, { recursive: true, force: true });
  delete globalThis.__uiState;
  delete globalThis.__uiRoutes;
});

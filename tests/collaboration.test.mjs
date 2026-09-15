import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  blankProfile,
  cleanList,
  makeBrief,
  recommend,
  validPostUrl,
} from "../lib/matching.ts";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  C = "33333333-3333-4333-8333-333333333333";
const me = {
  ...blankProfile,
  id: A,
  username: "poet_a",
  display_name: "Poet A",
  interest_names: ["Poetry", "Storytelling", "Illustration"],
  skill_names: ["Writing"],
  desired_skills: ["Illustration"],
  is_onboarded: true,
};
const other = {
  ...blankProfile,
  id: B,
  username: "artist_b",
  display_name: "Artist B",
  interest_names: ["Poetry", "Digital Art", "Illustration"],
  skill_names: ["Illustration"],
  desired_skills: ["Writing"],
  intent: "Audience Share",
  is_onboarded: true,
};
const outsider = {
  ...blankProfile,
  id: C,
  username: "creator_c",
  display_name: "Creator C",
  interest_names: ["Robotics", "Hardware", "Space"],
  skill_names: ["Coding"],
  is_onboarded: true,
};
test("recommendations honor interests, complements, visibility, and selection changes", () => {
  assert.equal(recommend(me, [me, other, outsider]).length, 1);
  const result = recommend(me, [other])[0];
  assert.ok(result.reasons.some((r) => r.includes("Writing")));
  assert.ok(result.reasons.some((r) => r.includes("Illustration")));
  assert.equal(recommend(me, [{ ...other, discoverable: false }]).length, 0);
  assert.equal(recommend(me, [other], "Robotics").length, 0);
  assert.equal(
    recommend(
      {
        ...me,
        interest_names: ["Hardware"],
        skill_names: ["Coding"],
        desired_skills: [],
      },
      [other, outsider],
    )[0].profile.id,
    C,
  );
  assert.match(makeBrief(me, other).title, /illustrated spoken-word/);
  assert.deepEqual(cleanList([" Poetry ", "poetry", "", "Illustration"]), [
    "poetry",
    "Illustration",
  ]);
  assert.equal(validPostUrl("javascript:alert(1)"), false);
  assert.equal(validPostUrl("https://u:p@example.com"), false);
  assert.equal(validPostUrl("https://example.com/post"), true);
});

test("real PostgreSQL policies and RPCs protect the full collaboration and Audience Share flow", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to anon,authenticated,service_role;
 grant execute on function auth.uid() to anon,authenticated,service_role;`);
    // PGlite includes gen_random_uuid natively; the production pgcrypto extension is unnecessary in this test runtime.
    const initial = (
      await fs.readFile(
        new URL(
          "../supabase/migrations/20260903_initial_schema.sql",
          import.meta.url,
        ),
        "utf8",
      )
    ).replace('create extension if not exists "pgcrypto";', "");
    await db.exec(initial);
    await db.exec(
      await fs.readFile(
        new URL(
          "../supabase/migrations/20260915_collaboration_flow.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      await fs.readFile(
        new URL(
          "../supabase/migrations/20260915083734_harden_profile_trigger_access.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const triggerAccess = await db.query(
      "select has_function_privilege('anon','public.handle_new_user()','EXECUTE') as anon_access, has_function_privilege('authenticated','public.handle_new_user()','EXECUTE') as authenticated_access",
    );
    assert.deepEqual(triggerAccess.rows[0], {
      anon_access: false,
      authenticated_access: false,
    });
    for (const id of [A, B, C])
      await db.query("insert into auth.users(id) values($1)", [id]);
    const as = async (id) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("set role authenticated");
    };
    const rpc = async (name, args) =>
      db.query(
        `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) as result`,
        args,
      );
    const fails = async (fn) => assert.rejects(fn);
    for (const p of [me, other, outsider]) {
      await as(p.id);
      await rpc("save_creator_profile", [p]);
    }
    await as(A);
    assert.equal((await db.query("select * from profiles")).rows.length, 3);
    await fails(() =>
      db.query("update profiles set is_test=true where id=$1", [A]),
    );
    await fails(() =>
      db.query(
        "insert into product_events(user_id,event) values($1,'request_sent')",
        [A],
      ),
    );
    const brief = makeBrief(me, other);
    const id = (await rpc("create_collaboration", [B, brief])).rows[0].result;
    await fails(() => rpc("create_collaboration", [B, brief]));
    await fails(() => rpc("change_collaboration", [id, "accept"]));
    await fails(() =>
      rpc("send_collaboration_message", [
        id,
        "Cannot message before acceptance",
      ]),
    );
    const plan = {
      format: "Joint post",
      sender_channel: "Poet channel",
      recipient_channel: "Art channel",
      sender_commitment: "Publish a poem and credit the illustrator.",
      recipient_commitment: "Publish an illustration and credit the poet.",
      scheduled_for: new Date(Date.now() + 7 * 86400000)
        .toISOString()
        .slice(0, 10),
    };
    await fails(() => rpc("propose_audience_share", [id, plan]));
    await as(C);
    assert.equal(
      (await db.query("select * from collaborations")).rows.length,
      0,
    );
    await fails(() => rpc("change_collaboration", [id, "accept"]));
    await as(B);
    await rpc("change_collaboration", [id, "accept"]);
    await fails(() => rpc("change_collaboration", [id, "accept"]));
    await rpc("send_collaboration_message", [
      id,
      "Accepted. Let’s agree on credit.",
    ]);
    await as(A);
    assert.equal(
      (await db.query("select * from collaboration_messages")).rows.length,
      1,
    );
    const pid = (await rpc("propose_audience_share", [id, plan])).rows[0]
      .result;
    await fails(() => rpc("respond_audience_share", [pid, "accept"]));
    await fails(() =>
      rpc("record_audience_post", [pid, "https://example.com/poem"]),
    );
    await as(C);
    assert.equal(
      (await db.query("select * from audience_plans")).rows.length,
      0,
    );
    await fails(() => rpc("respond_audience_share", [pid, "accept"]));
    await as(B);
    await rpc("respond_audience_share", [pid, "accept"]);
    await fails(() => rpc("record_audience_post", [pid, null]));
    await fails(() => rpc("change_collaboration", [id, "complete"]));
    await rpc("record_audience_post", [pid, "https://example.com/art"]);
    let saved = (await db.query("select * from audience_plans")).rows[0];
    assert.equal(saved.sender_post_url, null);
    assert.equal(saved.recipient_post_url, "https://example.com/art");
    await fails(() =>
      db.query("update audience_plans set sender_post_url=$1 where id=$2", [
        "https://example.com/forged",
        pid,
      ]),
    );
    await fails(() =>
      rpc("record_audience_post", [pid, "javascript:alert(1)"]),
    );
    await as(A);
    await rpc("record_audience_post", [pid, "https://example.com/poem"]);
    await rpc("record_audience_post", [
      pid,
      "https://example.com/poem-updated",
    ]);
    assert.equal(
      (
        await db.query(
          "select * from product_events where event='audience_post_shared'",
        )
      ).rows.length,
      1,
    );
    await rpc("change_collaboration", [id, "complete"]);
    await fails(() => rpc("send_collaboration_message", [id, "Closed"]));
    const second = (await rpc("create_collaboration", [B, brief])).rows[0]
      .result;
    await as(B);
    await rpc("change_collaboration", [second, "decline"]);
    await as(A);
    const third = (await rpc("create_collaboration", [B, brief])).rows[0]
      .result;
    await rpc("report_creator", [B, "Test report reason"]);
    await rpc("block_creator", [B]);
    assert.equal(
      (await db.query("select * from profiles where id=$1", [B])).rows.length,
      0,
    );
    await fails(() => rpc("create_collaboration", [B, brief]));
    await as(B);
    assert.equal(
      (await db.query("select * from collaborations")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from creator_reports")).rows.length,
      0,
    );
    await fails(() => rpc("change_collaboration", [third, "accept"]));
    await fails(() =>
      rpc("record_audience_post", [pid, "https://example.com/new"]),
    );
    await as(A);
    await rpc("unblock_creator", [B]);
    assert.equal(
      (await db.query("select * from collaborations where id=$1", [third]))
        .rows[0].status,
      "cancelled",
    );
    await fails(() => db.query("select * from creator_outcomes"));
    await db.exec("reset role");
    await db.query("update profiles set is_test=true where id=$1", [C]);
    const outcomes = (
      await db.query(
        "select * from creator_outcomes where event='onboarding_completed' order by is_test",
      )
    ).rows;
    assert.deepEqual(
      outcomes.map((x) => [x.is_test, Number(x.total)]),
      [
        [false, 2],
        [true, 1],
      ],
    );
    await db.exec("set role anon");
    await fails(() => rpc("create_collaboration", [B, brief]));
  } finally {
    await db.close();
  }
});

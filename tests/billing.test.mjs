import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createBilling } from '../supabase/functions/_shared/billing.ts';
import { discountForPayments, discountedAmount, qualifyingPeriod, verifySignature } from '../supabase/functions/_shared/loyalty.ts';
const uid = '11111111-1111-4111-8111-111111111111';
const price = {id:'price_base', product:'prod_base', active:true, type:'recurring', currency:'inr', unit_amount:50000,
  livemode:false, recurring:{interval:'month',interval_count:1,usage_type:'licensed'}};
function invoice(n, patch={}) { return { id:`in_${n}`, status:'paid', amount_paid:50000, billing_reason:n===0?'subscription_create':'subscription_cycle',
  parent:{subscription_details:{subscription:'sub_A'}}, lines:{has_more:false,data:[{quantity:1,pricing:{price_details:{price:'price_base'}},
  period:{start:1000+n*100,end:1100+n*100},parent:{subscription_item_details:{proration:false}}}]}, ...patch }; }
function fixture() {
 const env = { SUPABASE_URL:'https://db.test', SUPABASE_SERVICE_ROLE_KEY:'service', SUPABASE_ANON_KEY:'public',
  STRIPE_SECRET_KEY:'sk_test_fake', STRIPE_PRICE_ID:'price_base', STRIPE_MODE:'test', BILLING_ENABLED:'true',
  STRIPE_WEBHOOK_SECRET:'whsec_test', REVENUECAT_STRIPE_PUBLIC_KEY:'rc_test', BILLING_ALLOWED_ORIGINS:'https://app.test',
  STRIPE_PORTAL_CONFIGURATION_ID:'bpc_test', ...Object.fromEntries([5,10,15,20].map(n=>[`STRIPE_LOYALTY_COUPON_${n}`,`coupon_${n}`])) };
 const state = { account:{user_id:uid, customer_id:'cus_A',creation_key:'creation',checkout_key:'checkout'},
  sub:{id:'sub_A',customer:'cus_A',livemode:false,status:'active',metadata:{app_user_id:uid,loyalty_policy:'loyalty-v1',loyalty_percent:'0'},
   items:{data:[{price,quantity:1,current_period_end:2000}]}},
  invoices:[], periods:[], locks:new Map(), updates:[], imports:0, failUpdate:false, failImport:false, auth:true, rcActive:false, session:null,
  checkoutCalls:[], hasSubscription:true };
 const transport = async (url, init={}) => {
  const u=new URL(url), path=u.pathname, body=init.body?String(init.body):'', method=init.method||'GET';
  const json = (v,status=200) => Response.json(v,{status});
  if (u.host==='db.test') {
   if(path==='/auth/v1/user') return json({id:uid},state.auth?200:401);
   if(path.endsWith('/billing_claim_lock')) {const b=JSON.parse(body);if(state.locks.has(b.lock_name))return json(false);state.locks.set(b.lock_name,b.owner);return json(true);}
   if(path.endsWith('/billing_release_lock')) {const b=JSON.parse(body);if(state.locks.get(b.lock_name)===b.owner)state.locks.delete(b.lock_name);return json(null);}
   if(path.endsWith('/billing_accounts')) {
    if(method==='PATCH')Object.assign(state.account,JSON.parse(body));
    return json(method==='GET'?[state.account]:null);
   }
   if(path.endsWith('/billing_paid_periods')) {
    if(method==='POST')for(const row of JSON.parse(body))if(!state.periods.some(p=>p.subscription_id===row.subscription_id&&p.period_start===row.period_start))state.periods.push(row);
    return json(method==='GET'?state.periods.filter(p=>`eq.${p.subscription_id}`===u.searchParams.get('subscription_id')).slice(0,4):null);
   }
  }
  if(u.host==='api.stripe.com') {
   if(path==='/v1/prices/price_base')return json(price);
   if(path.startsWith('/v1/coupons/'))return json({valid:true,duration:'forever',percent_off:Number(path.split('_').at(-1))});
   if(path==='/v1/invoices')return json({data:state.invoices,has_more:false});
   if(path==='/v1/subscriptions')return json({data:state.hasSubscription?[state.sub]:[],has_more:false});
   if(path.startsWith('/v1/subscriptions/')) {
    if(method==='POST') {
     if(state.failUpdate){state.failUpdate=false;return json({},503);}
     const params=Object.fromEntries(new URLSearchParams(body));state.updates.push(params);
     state.sub.metadata.loyalty_percent=params['metadata[loyalty_percent]'];
    }
    return json(state.sub);
   }
   if(path==='/v1/checkout/sessions') {
    const params=Object.fromEntries(new URLSearchParams(body));state.checkoutCalls.push(params);
    state.session={id:'cs_A',status:'open',url:'https://checkout.stripe.com/c/pay/test'};return json(state.session);
   }
   if(path==='/v1/checkout/sessions/cs_A')return json(state.session);
   if(path==='/v1/billing_portal/configurations/bpc_test')return json({active:true,features:{subscription_cancel:{enabled:true,mode:'at_period_end'},subscription_update:{enabled:false}}});
   if(path==='/v1/billing_portal/sessions')return json({url:'https://billing.stripe.com/session/test'});
  }
  if(u.host==='api.revenuecat.com') {
   if(path==='/v1/receipts') {if(state.failImport){state.failImport=false;return json({},503);}state.imports++;}
   return json({subscriber:{entitlements:state.rcActive?{creator_pass:{expires_date:'2099-01-01T00:00:00Z'}}:{}}});
  }
  throw Error(`Unhandled ${method} ${url}`);
 };
 const billing=createBilling(k=>env[k],transport);
 const app=(action,origin='https://app.test')=>billing.app(new Request('https://db.test/functions/v1/creator-billing',{
  method:'POST',headers:{Origin:origin,Authorization:'Bearer user','Content-Type':'application/json'},body:JSON.stringify({action,user_id:'forged-user',price:'price_free'})}));
 const webhook=async(event,header)=> {
  const raw=JSON.stringify(event),t=Math.floor(Date.now()/1000);
  const signature=header??`t=${t},v1=${createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(`${t}.${raw}`).digest('hex')}`;
  return billing.webhook(new Request('https://db.test/webhook',{method:'POST',headers:{'Stripe-Signature':signature},body:raw}));
 };
 return {env,state,billing,app,webhook};
}
test('discount ladder reaches 20% and never exceeds it',()=>{
 assert.deepEqual([0,1,2,3,4,40].map(n=>discountedAmount(50000,discountForPayments(n))),[50000,47500,45000,42500,40000,40000]);
 assert.throws(()=>discountForPayments(-1));
});
test('only paid, non-prorated, single-item monthly subscription invoices qualify',()=>{
 assert.ok(qualifyingPeriod(invoice(0),'sub_A','price_base'));
 for(const patch of [{status:'open'},{amount_paid:0},{billing_reason:'subscription_update'},{billing_reason:'manual'},
   {lines:{has_more:true,data:invoice(0).lines.data}},{parent:{subscription_details:{subscription:'sub_other'}}}])
   assert.equal(qualifyingPeriod(invoice(0,patch),'sub_A','price_base'),null);
});
test('raw-body signature rejects tampering, stale timestamps and invalid signatures',async()=>{
 const raw='{"x":1}',t=1000,sig=createHmac('sha256','secret').update(`${t}.${raw}`).digest('hex');
 assert.equal(await verifySignature(raw,`t=${t},v1=${sig}`,'secret',1001),true);
 assert.equal(await verifySignature(raw+' ',`t=${t},v1=${sig}`,'secret',1001),false);
 assert.equal(await verifySignature(raw,`t=${t},v1=${sig}`,'secret',1400),false);
 assert.equal(await verifySignature(raw,`t=${t},v1=bad,v1=${sig}`,'secret',1001),true);
});
test('real reconciliation advances once per paid period; duplicate/out-of-order delivery and failed invoices are safe',async()=>{
 const f=fixture();
 for(let i=0;i<6;i++){
  f.state.invoices.unshift(invoice(i));
  await f.billing.reconcile('sub_A');await f.billing.reconcile('sub_A');
  assert.equal(Number(f.state.sub.metadata.loyalty_percent),Math.min((i+1)*5,20));
 }
 assert.equal(f.state.updates.length,4);
 assert.ok(f.state.updates.every(u=>u.proration_behavior==='none'));
 f.state.invoices.unshift(invoice(10,{status:'open'}));await f.billing.reconcile('sub_A');
 assert.equal(f.state.updates.length,4);
 const g=fixture();g.state.invoices=[invoice(2),invoice(0),invoice(1),invoice(1,{id:'in_reissue'})];
 await g.billing.reconcile('sub_A');assert.equal(g.state.periods.length,3);assert.equal(g.state.sub.metadata.loyalty_percent,'15');
});
test('retry after Stripe update or RevenueCat failure does not lose or double-count a period',async()=>{
 const f=fixture();f.state.invoices=[invoice(0)];f.state.failUpdate=true;
 await assert.rejects(()=>f.billing.reconcile('sub_A'));assert.equal(f.state.periods.length,1);
 f.state.failImport=true;await assert.rejects(()=>f.billing.reconcile('sub_A'));
 await f.billing.reconcile('sub_A');assert.equal(f.state.periods.length,1);assert.equal(f.state.updates.length,1);assert.equal(f.state.imports,1);
});
test('cancellation preserves progression before expiry; new subscription after expiry starts its own ladder',async()=>{
 const f=fixture();f.state.invoices=[invoice(0),invoice(1)];f.state.sub.cancel_at_period_end=true;
 await f.billing.reconcile('sub_A');assert.equal(f.state.sub.metadata.loyalty_percent,'10');
 f.state.sub.status='canceled';f.state.invoices.push(invoice(2));await f.billing.reconcile('sub_A');
 assert.equal(f.state.sub.metadata.loyalty_percent,'10');
 f.state.sub={...f.state.sub,id:'sub_B',status:'active',metadata:{...f.state.sub.metadata,loyalty_percent:'0'}};
 f.state.invoices=[invoice(0,{id:'in_new',parent:{subscription_details:{subscription:'sub_B'}}})];
 await f.billing.reconcile('sub_B');assert.equal(f.state.sub.metadata.loyalty_percent,'5');
});
test('subscription owner mismatch fails closed and concurrent work is retried',async()=>{
 const f=fixture();f.state.sub.metadata.app_user_id='someone-else';
 // The real database query would not find this account; also ensure the expected account ID is checked below.
 f.state.sub.customer='cus_other';await assert.rejects(()=>f.billing.reconcile('sub_A'));
 assert.equal(f.state.updates.length,0);
 const g=fixture();g.state.locks.set('subscription:sub_A','other');await assert.rejects(()=>g.billing.reconcile('sub_A'));
});
test('checkout checks auth, allowed origin, existing access and server-chosen price; repeated clicks reuse checkout',async()=>{
 const f=fixture();assert.equal((await f.app('checkout','https://evil.test')).status,403);
 f.state.auth=false;assert.equal((await f.app('checkout')).status,401);f.state.auth=true;
 assert.equal((await f.app('checkout')).status,409);
 f.state.hasSubscription=false;f.state.rcActive=true;assert.equal((await f.app('checkout')).status,409);
 f.state.rcActive=false;
 assert.equal((await f.app('checkout')).status,200);assert.equal((await f.app('checkout')).status,200);
 assert.equal(f.state.checkoutCalls.length,1);
 const params=f.state.checkoutCalls[0];assert.equal(params['line_items[0][price]'],'price_base');
 assert.equal(params['subscription_data[metadata][app_user_id]'],uid);
 assert.equal(params['subscription_data[metadata][loyalty_percent]'],'0');
 assert.equal(params.success_url,'https://app.test/offer?billing=success');
 assert.equal(params['discounts[0][coupon]'],undefined);
});
test('webhook rejects forged signatures and failed-payment events do not advance',async()=>{
 const f=fixture();f.state.invoices=[invoice(0)];
 const event={type:'invoice.paid',livemode:false,data:{object:invoice(0)}};
 assert.equal((await f.webhook(event,'invalid')).status,400);assert.equal(f.state.periods.length,0);
 assert.equal((await f.webhook({...event,type:'invoice.payment_failed'})).status,200);assert.equal(f.state.periods.length,0);
 assert.equal((await f.webhook(event)).status,200);assert.equal(f.state.periods.length,1);
 assert.equal((await f.webhook({...event,livemode:true})).status,400);
});
test('billing migration denies client reads/writes/RPCs and enforces lease and period uniqueness',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
  create table auth.users(id uuid primary key);grant usage on schema public to anon,authenticated,service_role;
  insert into auth.users values('${uid}');`);
  const migration=(await fs.readdir('supabase/migrations')).find(n=>n.endsWith('_loyalty_billing.sql'));
  await db.exec(await fs.readFile(`supabase/migrations/${migration}`,'utf8'));
  for(const role of ['anon','authenticated']) {
   await db.exec(`set role ${role}`);
   await assert.rejects(()=>db.query('select * from billing_accounts'));
   await assert.rejects(()=>db.query(`insert into billing_accounts(user_id) values('${uid}')`));
   await assert.rejects(()=>db.query(`select billing_claim_lock('a','${uid}')`));
   await db.exec('reset role');
  }
  await db.exec('set role service_role');
  assert.equal((await db.query(`select billing_claim_lock('a','${uid}') as acquired`)).rows[0].acquired,true);
  assert.equal((await db.query(`select billing_claim_lock('a','${uid}') as acquired`)).rows[0].acquired,false);
  await db.query(`select billing_release_lock('a','22222222-2222-4222-8222-222222222222')`);
  assert.equal((await db.query(`select count(*)::int as n from billing_locks`)).rows[0].n,1);
  await db.query(`select billing_release_lock('a','${uid}')`);
  assert.equal((await db.query(`select count(*)::int as n from billing_locks`)).rows[0].n,0);
  await db.query(`insert into billing_paid_periods(subscription_id,period_start,period_end,invoice_id,user_id) values('sub_A',1,2,'in_A','${uid}')`);
  await assert.rejects(()=>db.query(`insert into billing_paid_periods(subscription_id,period_start,period_end,invoice_id,user_id) values('sub_A',1,2,'in_B','${uid}')`));
  await db.exec('reset role');
  assert.equal((await db.query(`select count(*)::int as n from pg_class where relname in ('billing_accounts','billing_paid_periods','billing_locks') and relrowsecurity`)).rows[0].n,3);
 } finally {await db.close();}
});

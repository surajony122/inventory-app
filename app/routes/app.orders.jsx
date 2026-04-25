import { useState, useMemo } from "react";
import { useLoaderData, useSubmit, Link } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F5F2EC;--surface:#FDFBF8;--surface-2:#F0EDE6;--surface-3:#E8E4DB;
  --border:rgba(60,45,20,0.09);--border-md:rgba(60,45,20,0.15);--border-strong:rgba(60,45,20,0.25);
  --text:#231F17;--text-2:#6B6251;--text-3:#A89F8E;
  --gold:#B8782A;--gold-bg:#FBF3E6;--gold-text:#7A4F18;--gold-border:rgba(184,120,42,0.25);
  --teal:#2A7A6A;--teal-bg:#E6F5F2;--teal-text:#185448;
  --blue:#2A5F9A;--blue-bg:#E6EEF8;--blue-text:#183A66;
  --rose:#9A2A3A;--rose-bg:#F8E6E8;--rose-text:#661825;
  --violet:#5A2A9A;--violet-bg:#EEE6F8;--violet-text:#38186A;
  --cyan:#2A7A8A;--cyan-bg:#E6F4F6;--cyan-text:#185460;
  --slate-bg:#EEEAE4;--slate-text:#4A4438;
  --orange-bg:#FBF0E6;--orange-text:#7A4A18;
  --r-sm:8px;--r-md:12px;--r-lg:16px;--r-xl:20px;
  --shadow-xs:0 1px 2px rgba(60,45,20,0.06);
  --shadow-sm:0 2px 6px rgba(60,45,20,0.07);
  --shadow-lg:0 16px 40px rgba(60,45,20,0.13),0 4px 8px rgba(60,45,20,0.07);
}
html,body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.55;min-height:100vh;}
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:3px;}

/* HEADER */
.pg-header{background:var(--text);padding:0 28px;display:flex;align-items:center;gap:20px;height:58px;position:sticky;top:0;z-index:60;}
.brand{display:flex;align-items:center;gap:10px;}
.brand-mark{width:30px;height:30px;border:1.5px solid rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:#fff;letter-spacing:0.02em;}
.brand-tag{font-size:10px;color:rgba(255,255,255,0.38);font-family:'DM Mono',monospace;text-transform:uppercase;margin-left:2px;}
.hd-mid{flex:1;display:flex;align-items:center;justify-content:center;}
.role-tabs{display:flex;gap:2px;}
.role-tab{font-size:12px;font-weight:500;padding:5px 14px;border-radius:6px;border:none;background:transparent;color:rgba(255,255,255,0.45);cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif;}
.role-tab:hover{color:rgba(255,255,255,0.75);}
.role-tab.active{background:rgba(255,255,255,0.12);color:#fff;}
.hd-right{display:flex;align-items:center;gap:10px;}
.hd-link{font-size:11px;font-weight:500;padding:5px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);cursor:pointer;transition:all 0.15s;text-decoration:none;display:inline-flex;align-items:center;gap:5px;}
.hd-link:hover{background:rgba(255,255,255,0.12);color:#fff;}

/* LAYOUT */
.pg-main{padding:24px 28px;max-width:1380px;margin:0 auto;}

/* STATS */
.stats-row{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;position:relative;overflow:hidden;transition:box-shadow 0.15s,transform 0.1s;}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent,transparent);}
.stat-card:hover{box-shadow:var(--shadow-sm);transform:translateY(-1px);}
.stat-label{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;}
.stat-num{font-size:28px;font-weight:300;font-family:'Cormorant Garamond',serif;line-height:1;}
.stat-num.c-rose{color:var(--rose);}
.stat-num.c-gold{color:var(--gold);}

/* TOOLBAR */
.toolbar{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;}
.srch-wrap{position:relative;flex:1;min-width:220px;}
.srch-wrap input{width:100%;padding:8px 12px 8px 34px;border:1px solid var(--border-md);border-radius:var(--r-sm);background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;transition:border-color 0.15s;}
.srch-wrap input:focus{border-color:var(--gold);}
.srch-wrap input::placeholder{color:var(--text-3);}
.srch-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3);pointer-events:none;}
.tb-sel{padding:8px 12px;border:1px solid var(--border-md);border-radius:var(--r-sm);background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;cursor:pointer;}
.tb-sel:focus{border-color:var(--gold);}
.dl-btn{display:inline-flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:8px 14px;border-radius:var(--r-sm);border:1px solid var(--teal);background:var(--teal-bg);color:var(--teal-text);cursor:pointer;transition:all 0.15s;white-space:nowrap;}
.dl-btn:hover{background:var(--teal);color:#fff;}

/* BULK BAR */
.bulk-bar{display:flex;align-items:center;gap:10px;background:var(--text);color:#fff;border-radius:var(--r-md);padding:10px 16px;margin-bottom:12px;flex-wrap:wrap;}
.bulk-count{font-size:13px;font-weight:500;}
.bulk-actions{display:flex;gap:6px;flex-wrap:wrap;}
.bbtn{font-size:12px;font-weight:500;padding:6px 14px;border-radius:var(--r-sm);border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.12s;white-space:nowrap;}
.bbtn:hover{background:rgba(255,255,255,0.2);}
.bbtn.bb-primary{background:#fff;color:var(--text);border-color:transparent;}
.bbtn.bb-primary:hover{opacity:0.88;}
.bulk-hint{font-size:11px;color:rgba(255,255,255,0.4);}
.bulk-x{margin-left:auto;background:none;border:none;cursor:pointer;font-size:18px;color:rgba(255,255,255,0.4);line-height:1;}
.bulk-x:hover{color:#fff;}

/* TABLE */
.tbl-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-xs);}
.ord-table{width:100%;border-collapse:collapse;}
.ord-table thead tr{border-bottom:1px solid var(--border-md);}
.ord-table th{text-align:left;padding:10px 14px;font-size:10px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;background:var(--surface-2);}
.ord-table th.chk-col{width:40px;}
.ord-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle;}
.ord-table tr:last-child td{border-bottom:none;}
.ord-table tbody tr{cursor:pointer;transition:background 0.08s;}
.ord-table tbody tr:hover td{background:var(--surface-2);}
.ord-table tbody tr.sel td{background:#EEF3FA;}
input[type=checkbox]{width:14px;height:14px;accent-color:var(--blue);cursor:pointer;display:block;}

/* CELLS */
.thumb{width:38px;height:38px;border-radius:7px;object-fit:cover;border:1px solid var(--border);display:block;background:var(--surface-3);}
.thumb-ph{width:38px;height:38px;border-radius:7px;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:15px;color:var(--text-3);}
.ord-id{font-weight:600;font-size:13px;font-family:'Cormorant Garamond',serif;}
.ord-sid{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-3);margin-top:1px;}
.item-txt{font-size:13px;max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sku-txt{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-2);}
.age-ok{font-size:11px;color:var(--text-3);}
.age-warn{font-size:11px;color:var(--rose);font-weight:600;}

/* BADGES */
.badge{display:inline-block;font-size:10px;font-weight:500;padding:3px 8px;border-radius:20px;white-space:nowrap;}
.b-gold{background:var(--gold-bg);color:var(--gold-text);}
.b-teal{background:var(--teal-bg);color:var(--teal-text);}
.b-blue{background:var(--blue-bg);color:var(--blue-text);}
.b-violet{background:var(--violet-bg);color:var(--violet-text);}
.b-cyan{background:var(--cyan-bg);color:var(--cyan-text);}
.b-slate{background:var(--slate-bg);color:var(--slate-text);}
.b-rose{background:var(--rose-bg);color:var(--rose-text);}
.b-orange{background:var(--orange-bg);color:var(--orange-text);}
.b-pri-h{background:var(--rose-bg);color:var(--rose-text);}
.b-pri-m{background:var(--gold-bg);color:var(--gold-text);}
.b-pri-l{background:var(--teal-bg);color:var(--teal-text);}

/* PAGINATION */
.pg-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid var(--border);font-size:12px;color:var(--text-2);flex-wrap:wrap;gap:8px;}
.pg-btns{display:flex;gap:4px;}
.pg-btn{font-size:12px;font-weight:500;padding:4px 9px;border-radius:var(--r-sm);border:1px solid var(--border-md);background:var(--surface);color:var(--text);cursor:pointer;min-width:30px;font-family:'DM Sans',sans-serif;}
.pg-btn:hover:not(:disabled){background:var(--surface-2);}
.pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
.pg-btn.cur{background:var(--text)!important;color:#fff!important;border-color:var(--text)!important;}

/* EMPTY */
.empty-box{text-align:center;padding:52px 24px;color:var(--text-3);}
.empty-glyph{font-family:'Cormorant Garamond',serif;font-size:44px;color:var(--border-strong);margin-bottom:10px;}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(35,31,23,0.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(3px);}
.modal{background:var(--surface);border-radius:var(--r-xl);width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-lg);}
.modal-hdr{padding:22px 24px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;position:sticky;top:0;background:var(--surface);z-index:1;}
.modal-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;}
.modal-sub{font-size:12px;color:var(--text-3);margin-top:3px;}
.modal-x{background:var(--surface-2);border:none;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:15px;color:var(--text-2);display:flex;align-items:center;justify-content:center;transition:background 0.12s;}
.modal-x:hover{background:var(--surface-3);}
.modal-body{padding:20px 24px;}
.modal-img{width:100%;height:200px;object-fit:cover;border-radius:var(--r-md);margin-bottom:18px;border:1px solid var(--border);}
.modal-img-ph{width:100%;height:130px;border-radius:var(--r-md);margin-bottom:18px;border:1px solid var(--border);background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:44px;color:var(--border-strong);}
.m-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;}
.m-lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin-bottom:4px;}
.m-val{font-size:13px;font-weight:500;}
.section-lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);font-weight:500;margin-bottom:8px;}
.handoff-list{margin-bottom:18px;}
.h-row{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--text-2);padding:7px 0;border-bottom:1px solid var(--border);}
.h-row:last-child{border-bottom:none;}
.h-from,.h-to{font-weight:600;color:var(--text);}
.h-arr{color:var(--text-3);}
.h-time{margin-left:auto;font-family:'DM Mono',monospace;font-size:10px;color:var(--text-3);}
.note-area{width:100%;font-family:'DM Sans',sans-serif;font-size:13px;border:1px solid var(--border-md);border-radius:var(--r-sm);padding:10px 12px;background:var(--surface-2);color:var(--text);resize:vertical;min-height:72px;outline:none;transition:border-color 0.15s;}
.note-area:focus{border-color:var(--gold);background:var(--surface);}
.modal-actions{padding:14px 24px 20px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.btn{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:8px 16px;border-radius:var(--r-sm);border:1px solid var(--border-md);background:var(--surface);color:var(--text);cursor:pointer;transition:all 0.12s;white-space:nowrap;}
.btn:hover{background:var(--surface-2);}
.btn-primary{background:var(--text);color:#fff;border-color:var(--text);}
.btn-primary:hover{opacity:0.85;}
.btn-ghost{border-color:transparent;color:var(--text-2);}
.btn-ghost:hover{background:var(--surface-2);}
.ml-a{margin-left:auto;}

/* BULK CONFIRM MODAL */
.bm-list{border:1px solid var(--border);border-radius:var(--r-sm);max-height:200px;overflow-y:auto;margin-bottom:14px;}
.bm-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border);font-size:12px;}
.bm-row:last-child{border-bottom:none;}
.bm-id{font-weight:600;min-width:70px;font-family:'Cormorant Garamond',serif;}
.bm-item{color:var(--text-2);flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}

/* BOTTOM INFO */
.info-grid{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-top:20px;}
.info-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;}
.info-title{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;margin-bottom:14px;}
.flow-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:12px;}
.flow-node{font-size:10px;font-weight:500;padding:4px 10px;border-radius:20px;background:var(--surface-2);border:1px solid var(--border-md);color:var(--text-2);}
.flow-arr{font-size:12px;color:var(--text-3);}
.step{display:flex;gap:10px;padding:9px 12px;border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:7px;background:var(--surface-2);}
.step:last-child{margin-bottom:0;}
.step-n{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--gold);min-width:18px;line-height:1.2;}
.step-t{font-size:12px;color:var(--text-2);line-height:1.5;}
.pri-row{display:flex;align-items:center;gap:10px;margin-bottom:7px;}
.pri-code{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-3);}

@media(max-width:900px){.stats-row{grid-template-columns:repeat(3,1fr);}.info-grid{grid-template-columns:1fr;}}
@media(max-width:600px){.pg-main{padding:16px;}.pg-header{padding:0 16px;}.stats-row{grid-template-columns:repeat(2,1fr);}}
`;

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ROLES     = ["admin","inventory","production","dispatch"];
const PAGE_SIZE = 25;
const PROD_STATUSES = ["Sent to Production","In Production","Production Complete"];

const STATUS_BADGE = {
  "Awaiting Inventory Check":"b-gold","Ready for Dispatch":"b-teal",
  "Sent to Production":"b-orange","In Production":"b-blue",
  "Production Complete":"b-violet","Returned to Inventory":"b-cyan",
  "Dispatched":"b-slate","On Hold":"b-rose","Cancelled":"b-rose",
};
const PAY_BADGE = { Paid:"b-teal","Payment pending":"b-gold",Authorized:"b-cyan","Partially paid":"b-orange" };
const PRI_BADGE = { High:"b-pri-h",Medium:"b-pri-m",Low:"b-pri-l" };

const ROLE_FILTER = {
  admin:      ()  => true,
  inventory:  o   => ["Awaiting Inventory Check","Returned to Inventory","Ready for Dispatch"].includes(o.status),
  production: o   => PROD_STATUSES.includes(o.status),
  dispatch:   o   => ["Ready for Dispatch","Dispatched"].includes(o.status),
};

const BULK_DEFS = [
  { label:"Stock available → dispatch", primary:true,  app:["Awaiting Inventory Check"],     ns:"Ready for Dispatch",    no:"Dispatch - Queue",   hf:{from:"Inventory",to:"Dispatch"} },
  { label:"Send to production",          primary:false, app:["Awaiting Inventory Check"],     ns:"Sent to Production",    no:"Production - Queue", hf:{from:"Inventory",to:"Production"} },
  { label:"Mark in production",          primary:true,  app:["Sent to Production"],           ns:"In Production",         no:null,                 hf:{from:"Queue",to:"Artisan"} },
  { label:"Mark production complete",    primary:true,  app:["In Production"],                ns:"Production Complete",   no:null,                 hf:{from:"Production",to:"QC"} },
  { label:"Return to inventory",         primary:true,  app:["Production Complete"],          ns:"Returned to Inventory", no:"Inventory - Queue",  hf:{from:"Production",to:"Inventory"} },
  { label:"Ready for dispatch",          primary:true,  app:["Returned to Inventory"],        ns:"Ready for Dispatch",    no:"Dispatch - Queue",   hf:{from:"Inventory",to:"Dispatch"} },
  { label:"Mark dispatched",             primary:true,  app:["Ready for Dispatch"],           ns:"Dispatched",            no:"Courier",            hf:{from:"Dispatch",to:"Courier"} },
  { label:"Put on hold",                 primary:false, app:["Awaiting Inventory Check","Returned to Inventory","Ready for Dispatch","Sent to Production","In Production"], ns:"On Hold", no:null, hf:null },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getPriority(tags=[]) {
  const t=(tags||[]).map(s=>s.toLowerCase());
  if(t.includes("priority:high")||t.includes("urgent")) return "High";
  if(t.includes("priority:low")) return "Low";
  return "Medium";
}
function getAging(d){ return Math.floor((Date.now()-new Date(d).getTime())/86400000); }
function fmtDate(d){ return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); }
function fmtPay(s){
  if(!s) return "N/A";
  const m={PAID:"Paid",PENDING:"Payment pending",AUTHORIZED:"Authorized",PARTIALLY_PAID:"Partially paid",REFUNDED:"Refunded",VOIDED:"Voided"};
  return m[s]||s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
}
function getAvailBulk(ids,orders){
  const sel=orders.filter(o=>ids.includes(o.shopifyId));
  const ss=[...new Set(sel.map(o=>o.status))];
  return BULK_DEFS.filter(d=>ss.every(s=>d.app.includes(s)));
}
function getSingleActions(status){
  switch(status){
    case "Awaiting Inventory Check": return[
      {l:"Stock available → dispatch",p:true, ns:"Ready for Dispatch",   no:"Dispatch - Queue",  hf:{from:"Inventory",to:"Dispatch"}},
      {l:"Send to production",        p:false,ns:"Sent to Production",   no:"Production - Queue",hf:{from:"Inventory",to:"Production"}},
      {l:"Put on hold",               p:false,ns:"On Hold",              no:null,                hf:null},
    ];
    case "Sent to Production":    return[{l:"Mark in production",       p:true,ns:"In Production",        no:null,               hf:{from:"Queue",to:"Artisan"}}];
    case "In Production":         return[{l:"Mark production complete", p:true,ns:"Production Complete",  no:null,               hf:{from:"Production",to:"QC"}}];
    case "Production Complete":   return[{l:"Return to inventory",      p:true,ns:"Returned to Inventory",no:"Inventory - Queue",hf:{from:"Production",to:"Inventory"}}];
    case "Returned to Inventory": return[{l:"Ready for dispatch",       p:true,ns:"Ready for Dispatch",   no:"Dispatch - Queue", hf:{from:"Inventory",to:"Dispatch"}}];
    case "Ready for Dispatch":    return[{l:"Mark dispatched",          p:true,ns:"Dispatched",           no:"Courier",          hf:{from:"Dispatch",to:"Courier"}}];
    case "On Hold":               return[{l:"Resume — inventory check", p:true,ns:"Awaiting Inventory Check",no:"Inventory - Queue",hf:null}];
    default: return[];
  }
}

// ── LOADER ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Fetch all orders with cursor pagination
  let rawOrders=[], ordersError=null;
  try{
    let cursor=null, hasNext=true;
    while(hasNext){
      const resp = await admin.graphql(`
        query($cursor:String){
          orders(first:250,after:$cursor,sortKey:CREATED_AT,reverse:true){
            pageInfo{ hasNextPage endCursor }
            edges{ node{
              id name createdAt displayFinancialStatus displayFulfillmentStatus
              totalPriceSet{ shopMoney{ amount currencyCode } }
              customer{ firstName lastName }
              lineItems(first:3){ edges{ node{ title sku quantity image{ url } } } }
              tags note
            }}
          }
        }
      `,{variables:{cursor}});
      const json=await resp.json();
      if(json.errors?.length) throw new Error(json.errors.map(e=>e.message).join(" | "));
      const pg=json.data?.orders;
      if(!pg) break;
      rawOrders=rawOrders.concat(pg.edges.map(e=>e.node));
      hasNext=pg.pageInfo.hasNextPage;
      cursor=pg.pageInfo.endCursor;
    }
  }catch(err){
    ordersError=err.message||"Orders unavailable";
    // Fallback without customer field
    try{
      let cursor=null,hasNext=true;
      while(hasNext){
        const resp=await admin.graphql(`
          query($cursor:String){
            orders(first:250,after:$cursor,sortKey:CREATED_AT,reverse:true){
              pageInfo{ hasNextPage endCursor }
              edges{ node{
                id name createdAt displayFinancialStatus displayFulfillmentStatus
                totalPriceSet{ shopMoney{ amount currencyCode } }
                lineItems(first:3){ edges{ node{ title sku quantity image{ url } } } }
                tags note
              }}
            }
          }
        `,{variables:{cursor}});
        const json=await resp.json();
        if(json.errors?.length) throw new Error(json.errors.map(e=>e.message).join(" | "));
        const pg=json.data?.orders; if(!pg) break;
        rawOrders=rawOrders.concat(pg.edges.map(e=>e.node));
        hasNext=pg.pageInfo.hasNextPage; cursor=pg.pageInfo.endCursor;
      }
      ordersError=null;
    }catch(_){ /* keep original error */ }
  }

  // Load local workflow states
  const ids=rawOrders.map(o=>o.id);
  const states=ids.length ? await prisma.orderWorkflow.findMany({where:{id:{in:ids}}}) : [];

  // Merge into flat order objects
  const orders=rawOrders.map(o=>{
    const st=states.find(s=>s.id===o.id);
    const li=o.lineItems.edges[0]?.node;
    return {
      shopifyId:o.id,
      id:o.name,
      customer:o.customer?`${o.customer.firstName} ${o.customer.lastName}`.trim():"Guest",
      item:li?.title||"—",
      sku:li?.sku||"—",
      qty:li?.quantity||1,
      imageUrl:li?.image?.url||null,
      lineItems:o.lineItems.edges.map(e=>e.node),
      orderDate:fmtDate(o.createdAt),
      createdAt:o.createdAt,
      priority:getPriority(o.tags),
      status:st?.status||"Awaiting Inventory Check",
      owner:st?.owner||"Inventory - Queue",
      handoffs:JSON.parse(st?.handoffs||"[]"),
      aging:getAging(o.createdAt),
      note:st?.note||"",
      shopifyNote:o.note||"",
      paymentStatus:fmtPay(o.displayFinancialStatus),
      fulfillStatus:o.displayFulfillmentStatus||"UNFULFILLED",
    };
  });

  return { orders, ordersError };
};

// ── ACTION ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  await authenticate.admin(request);
  const fd=await request.formData();
  const type=fd.get("type");

  if(type==="update"){
    const id=fd.get("id"), ns=fd.get("status"), no=fd.get("owner"), hfFrom=fd.get("hfFrom"), hfTo=fd.get("hfTo"), note=fd.get("note");
    const ex=await prisma.orderWorkflow.findUnique({where:{id}});
    const hfs=JSON.parse(ex?.handoffs||"[]");
    if(ns&&ns!==ex?.status&&hfFrom&&hfTo) hfs.push({from:hfFrom,to:hfTo,at:new Date().toISOString()});
    await prisma.orderWorkflow.upsert({
      where:{id},
      update:{status:ns,owner:no||ex?.owner||"Inventory - Queue",...(note!==null?{note}:{}),handoffs:JSON.stringify(hfs)},
      create:{id,status:ns,owner:no||"Inventory - Queue",note:note||"",handoffs:JSON.stringify(hfs)},
    });
    return {ok:true};
  }

  if(type==="bulk"){
    const ids=JSON.parse(fd.get("ids")||"[]"), ns=fd.get("status"), no=fd.get("owner"), hfFrom=fd.get("hfFrom"), hfTo=fd.get("hfTo");
    for(const id of ids){
      const ex=await prisma.orderWorkflow.findUnique({where:{id}});
      const hfs=JSON.parse(ex?.handoffs||"[]");
      if(hfFrom&&hfTo) hfs.push({from:hfFrom,to:hfTo,at:new Date().toISOString()});
      const upd={status:ns,handoffs:JSON.stringify(hfs)};
      if(no) upd.owner=no;
      await prisma.orderWorkflow.upsert({where:{id},update:upd,create:{id,status:ns,owner:no||"Inventory - Queue",handoffs:JSON.stringify(hfs)}});
    }
    return {ok:true};
  }

  if(type==="reset"){
    const id=fd.get("id");
    await prisma.orderWorkflow.upsert({
      where:{id},
      update:{status:"Awaiting Inventory Check",owner:"Inventory - Queue",note:"",handoffs:JSON.stringify([{from:"Reset",to:"Inventory",at:new Date().toISOString()}])},
      create:{id,status:"Awaiting Inventory Check",owner:"Inventory - Queue",handoffs:"[]"},
    });
    return {ok:true};
  }

  if(type==="note"){
    const id=fd.get("id"),note=fd.get("note")||"";
    await prisma.orderWorkflow.upsert({where:{id},update:{note},create:{id,note,status:"Awaiting Inventory Check",owner:"Inventory - Queue",handoffs:"[]"}});
    return {ok:true};
  }

  return {ok:false};
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function OrdersPage(){
  const {orders:init, ordersError}=useLoaderData();
  const submit=useSubmit();

  const [orders,   setOrders]   = useState(init);
  const [role,     setRole]     = useState("admin");
  const [query,    setQuery]    = useState("");
  const [statusF,  setStatusF]  = useState("all");
  const [priorityF,setPriorityF]= useState("all");
  const [payF,     setPayF]     = useState("all");
  const [selIds,   setSelIds]   = useState(new Set());
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null);
  const [noteVal,  setNoteVal]  = useState("");
  const [bulkPending,setBulkPending]=useState(null);

  // Sync when loader data changes
  useState(()=>{ setOrders(init); },[init]);

  // ── filtered list ─────────────────────────────────────────────────────────
  const visible=useMemo(()=>{
    return orders.filter(o=>{
      if(!ROLE_FILTER[role](o)) return false;
      if(statusF!=="all"&&o.status!==statusF) return false;
      if(priorityF!=="all"&&o.priority!==priorityF) return false;
      if(payF!=="all"&&o.paymentStatus!==payF) return false;
      if(query){
        const q=query.toLowerCase();
        if(![o.id,o.customer,o.item,o.sku,o.shopifyId].join(" ").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },[orders,role,query,statusF,priorityF,payF]);

  const totalPages=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));
  const curPage=Math.min(page,totalPages);
  const pageItems=visible.slice((curPage-1)*PAGE_SIZE,curPage*PAGE_SIZE);

  // ── stats ──────────────────────────────────────────────────────────────────
  const stats={
    total:visible.length,
    inv:visible.filter(o=>o.status==="Awaiting Inventory Check").length,
    prod:visible.filter(o=>PROD_STATUSES.includes(o.status)).length,
    disp:visible.filter(o=>o.status==="Ready for Dispatch").length,
    delayed:visible.filter(o=>o.aging>=2).length,
  };

  // ── mutations ─────────────────────────────────────────────────────────────
  function doUpdate(o,ns,no,hf){
    const fd=new FormData();
    fd.append("type","update"); fd.append("id",o.shopifyId);
    fd.append("status",ns); fd.append("owner",no||"");
    if(hf){ fd.append("hfFrom",hf.from); fd.append("hfTo",hf.to); }
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(x=>x.shopifyId!==o.shopifyId?x:{...x,status:ns,...(no?{owner:no}:{}),handoffs:[...x.handoffs,...(hf?[{from:hf.from,to:hf.to,at:new Date().toISOString()}]:[])]}));
    setSelected(null);
  }

  function doBulk(def,ids){
    const fd=new FormData();
    fd.append("type","bulk"); fd.append("ids",JSON.stringify(ids));
    fd.append("status",def.ns); if(def.no) fd.append("owner",def.no);
    if(def.hf){ fd.append("hfFrom",def.hf.from); fd.append("hfTo",def.hf.to); }
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(o=>!ids.includes(o.shopifyId)?o:{...o,status:def.ns,...(def.no?{owner:def.no}:{})}));
    setSelIds(new Set()); setBulkPending(null);
  }

  function doReset(o){
    if(!confirm("Reset this order to the beginning of the workflow?")) return;
    const fd=new FormData(); fd.append("type","reset"); fd.append("id",o.shopifyId);
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(x=>x.shopifyId!==o.shopifyId?x:{...x,status:"Awaiting Inventory Check",owner:"Inventory - Queue",note:"",handoffs:[]}));
    setSelected(null);
  }

  function saveNote(o,note){
    const fd=new FormData(); fd.append("type","note"); fd.append("id",o.shopifyId); fd.append("note",note);
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(x=>x.shopifyId!==o.shopifyId?x:{...x,note}));
  }

  function exportCSV(){
    const hdr=["Order","Customer","Item","SKU","Qty","Payment","Priority","Status","Owner","Aging(d)","Note"];
    const rows=visible.map(o=>[o.id,o.customer,o.item,o.sku,o.qty,o.paymentStatus,o.priority,o.status,o.owner,o.aging,(o.note||"").replace(/,/g," ")].map(v=>`"${v}"`).join(","));
    const csv=[hdr.join(","),...rows].join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`orders-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }

  // ── helpers ────────────────────────────────────────────────────────────────
  const selArr=[...selIds];
  const availBulk=getAvailBulk(selArr,orders);
  const allPageSel=pageItems.length>0&&pageItems.every(o=>selIds.has(o.shopifyId));
  const someSel=pageItems.some(o=>selIds.has(o.shopifyId));

  function Thumb({o,size=38}){
    if(o?.imageUrl) return <img src={o.imageUrl} className="thumb" style={{width:size,height:size}} alt="" onError={e=>{e.target.style.display="none";}}/>;
    return <div className="thumb-ph" style={{width:size,height:size}}>◈</div>;
  }

  // ── pagination ─────────────────────────────────────────────────────────────
  function Pagination(){
    if(totalPages<=1) return null;
    const start=(curPage-1)*PAGE_SIZE, end=Math.min(start+pageItems.length,visible.length);
    const pages=[];
    for(let i=1;i<=Math.min(7,totalPages);i++){
      let p; if(totalPages<=7) p=i; else if(curPage<=4) p=i; else if(curPage>=totalPages-3) p=totalPages-6+i; else p=curPage-3+i;
      if(p>=1&&p<=totalPages) pages.push(p);
    }
    return(
      <div className="pg-row">
        <span>Showing {start+1}–{end} of {visible.length} orders</span>
        <div className="pg-btns">
          <button className="pg-btn" disabled={curPage===1} onClick={()=>setPage(1)}>«</button>
          <button className="pg-btn" disabled={curPage===1} onClick={()=>setPage(p=>p-1)}>‹</button>
          {pages.map(p=><button key={p} className={`pg-btn${p===curPage?" cur":""}`} onClick={()=>setPage(p)}>{p}</button>)}
          <button className="pg-btn" disabled={curPage===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
          <button className="pg-btn" disabled={curPage===totalPages} onClick={()=>setPage(totalPages)}>»</button>
        </div>
      </div>
    );
  }

  // ── single order modal ────────────────────────────────────────────────────
  function OrderModal(){
    const o=selected; if(!o) return null;
    const actions=getSingleActions(o.status);
    return(
      <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
        <div className="modal">
          <div className="modal-hdr">
            <div>
              <div className="modal-title">{o.id} — {o.item}</div>
              <div className="modal-sub">{o.customer} · {o.orderDate} · Aging: {o.aging}d</div>
            </div>
            <button className="modal-x" onClick={()=>setSelected(null)}>✕</button>
          </div>
          <div className="modal-body">
            {o.imageUrl
              ? <img src={o.imageUrl} className="modal-img" alt={o.item} onError={e=>{e.target.style.display="none";}}/>
              : <div className="modal-img-ph">◈</div>}

            <div className="m-grid">
              <div><div className="m-lbl">SKU</div><div className="m-val" style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{o.sku}</div></div>
              <div><div className="m-lbl">Quantity</div><div className="m-val">{o.qty}</div></div>
              <div><div className="m-lbl">Payment</div><div className="m-val"><span className={`badge ${PAY_BADGE[o.paymentStatus]||"b-slate"}`}>{o.paymentStatus}</span></div></div>
              <div><div className="m-lbl">Workflow Status</div><div className="m-val"><span className={`badge ${STATUS_BADGE[o.status]||"b-slate"}`}>{o.status}</span></div></div>
              <div><div className="m-lbl">Priority</div><div className="m-val"><span className={`badge ${PRI_BADGE[o.priority]||"b-slate"}`}>{o.priority}</span></div></div>
              <div><div className="m-lbl">Owner</div><div className="m-val" style={{fontSize:12}}>{o.owner}</div></div>
              {o.shopifyNote&&(
                <div style={{gridColumn:"1/-1",background:"var(--surface-2)",padding:10,borderRadius:8,border:"1px dashed var(--border-strong)"}}>
                  <div className="m-lbl" style={{color:"var(--text-2)",fontWeight:600}}>Shopify Note</div>
                  <div className="m-val" style={{fontSize:13,fontWeight:400,fontStyle:"italic"}}>"{o.shopifyNote}"</div>
                </div>
              )}
            </div>

            {/* Line items */}
            {o.lineItems.length>0&&(
              <div style={{marginBottom:18}}>
                <div className="section-lbl">Line Items</div>
                {o.lineItems.map((li,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
                    {li.image?.url
                      ? <img src={li.image.url} style={{width:32,height:32,borderRadius:6,objectFit:"cover",border:"1px solid var(--border)"}} alt=""/>
                      : <div style={{width:32,height:32,borderRadius:6,background:"var(--surface-3)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"var(--text-3)"}}>◈</div>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{li.title}</div>
                      <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:"var(--text-3)"}}>{li.sku||"—"}</div>
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:"var(--text-2)"}}>×{li.quantity}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Handoff timeline */}
            <div className="handoff-list">
              <div className="section-lbl">Handoff Timeline</div>
              {o.handoffs.length===0
                ? <div style={{fontSize:12,color:"var(--text-3)"}}>No handoffs yet.</div>
                : o.handoffs.map((h,i)=>(
                  <div key={i} className="h-row">
                    <span className="h-from">{h.from}</span>
                    <span className="h-arr">→</span>
                    <span className="h-to">{h.to}</span>
                    <span className="h-time">{new Date(h.at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                ))}
            </div>

            {/* Note */}
            <div>
              <div className="section-lbl">Internal Note</div>
              <textarea className="note-area" value={noteVal}
                onChange={e=>setNoteVal(e.target.value)}
                onBlur={()=>saveNote(o,noteVal)}
                placeholder="Add a note for this order…"/>
            </div>
          </div>
          <div className="modal-actions">
            {actions.map((a,i)=>(
              <button key={i} className={`btn${a.p?" btn-primary":""}`}
                onClick={()=>doUpdate(o,a.ns,a.no,a.hf)}>{a.l}</button>
            ))}
            <button className="btn btn-ghost" onClick={()=>doReset(o)}>Reset Workflow</button>
            <button className="btn btn-ghost ml-a" onClick={()=>setSelected(null)}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── bulk confirm modal ─────────────────────────────────────────────────────
  function BulkModal(){
    if(!bulkPending) return null;
    const {def,ids}=bulkPending;
    const sel=orders.filter(o=>ids.includes(o.shopifyId));
    return(
      <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setBulkPending(null);}}>
        <div className="modal" style={{maxWidth:440}}>
          <div className="modal-hdr">
            <div>
              <div className="modal-title">{def.label}</div>
              <div className="modal-sub">{sel.length} order{sel.length!==1?"s":""} will be updated</div>
            </div>
            <button className="modal-x" onClick={()=>setBulkPending(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="section-lbl" style={{marginBottom:8}}>Affected orders</div>
            <div className="bm-list">
              {sel.map(o=>(
                <div key={o.shopifyId} className="bm-row">
                  <span className="bm-id">{o.id}</span>
                  <span className="bm-item">{o.item}</span>
                  <span className={`badge ${STATUS_BADGE[o.status]||"b-slate"}`} style={{fontSize:9,padding:"2px 6px"}}>{o.status}</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:13,color:"var(--text-2)"}}>
              Status → <strong>{def.ns}</strong>{def.no?`. Owner: ${def.no}`:""}.
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={()=>doBulk(def,ids)}>Confirm update</button>
            <button className="btn btn-ghost ml-a" onClick={()=>setBulkPending(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return(
    <>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* Header */}
      <header className="pg-header">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="5.5" r="2.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3"/>
              <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">Unniyarcha</span>
          <span className="brand-tag">orders</span>
        </div>

        <div className="hd-mid">
          <div className="role-tabs">
            {ROLES.map(r=>(
              <button key={r} className={`role-tab${r===role?" active":""}`}
                onClick={()=>{setRole(r);setSelIds(new Set());setPage(1);}}>
                {r[0].toUpperCase()+r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="hd-right">
          <Link to="/app" className="hd-link">← Dashboard</Link>
        </div>
      </header>

      <main className="pg-main">
        {/* Error banner */}
        {ordersError&&(
          <div style={{background:"var(--gold-bg)",border:"1px solid var(--gold-border)",borderRadius:"var(--r-md)",padding:"12px 16px",marginBottom:16,fontSize:13,color:"var(--gold-text)"}}>
            <strong>⚠ API Error:</strong> {ordersError}
          </div>
        )}

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-num">{stats.total}</div></div>
          <div className="stat-card" style={{"--accent":"#B8782A"}}><div className="stat-label">Inventory Check</div><div className="stat-num">{stats.inv}</div></div>
          <div className="stat-card" style={{"--accent":"#2A5F9A"}}><div className="stat-label">In Production</div><div className="stat-num">{stats.prod}</div></div>
          <div className="stat-card" style={{"--accent":"#2A7A6A"}}><div className="stat-label">Ready to Dispatch</div><div className="stat-num">{stats.disp}</div></div>
          <div className="stat-card" style={{"--accent":"#9A2A3A"}}><div className="stat-label">Delayed 2d+</div><div className={`stat-num${stats.delayed>0?" c-rose":""}`}>{stats.delayed}</div></div>
        </div>

        {/* Bulk bar */}
        {selIds.size>0&&(
          <div className="bulk-bar">
            <div className="bulk-count">{selIds.size} selected</div>
            <div className="bulk-actions">
              {availBulk.length===0
                ? <span className="bulk-hint">No shared actions for mixed statuses</span>
                : availBulk.map((d,i)=>(
                  <button key={i} className={`bbtn${d.primary?" bb-primary":""}`}
                    onClick={()=>setBulkPending({def:d,ids:selArr})}>
                    {d.label}
                  </button>
                ))}
            </div>
            <button className="bulk-x" onClick={()=>setSelIds(new Set())}>✕</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <div className="srch-wrap">
            <svg className="srch-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
              <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/>
            </svg>
            <input type="text" placeholder="Search order, customer, SKU…" value={query}
              onChange={e=>{setQuery(e.target.value);setPage(1);}}/>
          </div>
          <select className="tb-sel" value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
            <option value="all">All statuses</option>
            {Object.keys(STATUS_BADGE).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="tb-sel" value={priorityF} onChange={e=>{setPriorityF(e.target.value);setPage(1);}}>
            <option value="all">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select className="tb-sel" value={payF} onChange={e=>{setPayF(e.target.value);setPage(1);}}>
            <option value="all">All payments</option>
            <option value="Paid">Paid</option>
            <option value="Payment pending">Payment pending</option>
            <option value="Authorized">Authorized</option>
          </select>
          <button className="dl-btn" onClick={exportCSV}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="13" height="13">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10"/>
            </svg>
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="tbl-wrap">
          <table className="ord-table">
            <thead>
              <tr>
                <th className="chk-col">
                  <input type="checkbox" checked={allPageSel}
                    ref={el=>{if(el) el.indeterminate=!allPageSel&&someSel;}}
                    onChange={e=>{
                      const n=new Set(selIds);
                      e.target.checked?pageItems.forEach(o=>n.add(o.shopifyId)):pageItems.forEach(o=>n.delete(o.shopifyId));
                      setSelIds(n);
                    }}/>
                </th>
                <th style={{width:46}}></th>
                <th>Order</th>
                <th>Customer</th>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Payment</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Note</th>
                <th>Aging</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length===0?(
                <tr><td colSpan={12}>
                  <div className="empty-box"><div className="empty-glyph">◎</div><div>No orders match your filters</div></div>
                </td></tr>
              ):pageItems.map(o=>(
                <tr key={o.shopifyId} className={selIds.has(o.shopifyId)?"sel":""}
                  onClick={e=>{
                    if(e.target.type==="checkbox") return;
                    if(selIds.size>0){
                      const n=new Set(selIds);
                      selIds.has(o.shopifyId)?n.delete(o.shopifyId):n.add(o.shopifyId);
                      setSelIds(n); return;
                    }
                    setSelected(o); setNoteVal(o.note);
                  }}>
                  <td onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" checked={selIds.has(o.shopifyId)}
                      onChange={e=>{
                        const n=new Set(selIds);
                        e.target.checked?n.add(o.shopifyId):n.delete(o.shopifyId);
                        setSelIds(n);
                      }}/>
                  </td>
                  <td style={{padding:"8px 6px 8px 14px"}}><Thumb o={o}/></td>
                  <td>
                    <div className="ord-id">{o.id}</div>
                    <div className="ord-sid">{o.orderDate}</div>
                  </td>
                  <td style={{fontSize:13}}>{o.customer}</td>
                  <td><div className="item-txt" title={o.item}>{o.item}</div></td>
                  <td><span className="sku-txt">{o.sku}</span></td>
                  <td style={{fontWeight:600,textAlign:"center"}}>{o.qty}</td>
                  <td><span className={`badge ${PAY_BADGE[o.paymentStatus]||"b-slate"}`}>{o.paymentStatus}</span></td>
                  <td><span className={`badge ${PRI_BADGE[o.priority]||"b-slate"}`}>{o.priority}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[o.status]||"b-slate"}`}>{o.status}</span></td>
                  <td style={{fontSize:11,color:"var(--text-3)",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
                    title={o.shopifyNote||""}>{o.shopifyNote||"—"}</td>
                  <td><span className={o.aging>=2?"age-warn":"age-ok"}>{o.aging}d</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination/>
        </div>

        {/* Bottom info */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-title">Process Rules</div>
            <div className="flow-row">
              {["Shopify","Inventory","Production","Inventory","Dispatch"].map((n,i,a)=>(
                <span key={i}>
                  <span className="flow-node">{n}</span>
                  {i<a.length-1&&<span className="flow-arr"> → </span>}
                </span>
              ))}
            </div>
            {[
              "Every Shopify order enters automatically assigned to Inventory for stock check.",
              "Inventory marks stock available (→ Dispatch) or sends SKU to Production.",
              "Production completes work then returns to Inventory for QC — cannot close order directly.",
              "Only Inventory approves orders as Ready for Dispatch after receiving finished items.",
            ].map((t,i)=>(
              <div key={i} className="step">
                <div className="step-n">{i+1}</div>
                <div className="step-t">{t}</div>
              </div>
            ))}
          </div>
          <div className="info-card">
            <div className="info-title">Priority Tags</div>
            <div style={{fontSize:12,color:"var(--text-2)",marginBottom:12,lineHeight:1.6}}>Add these tags to Shopify orders:</div>
            {[
              {badge:"b-pri-h",label:"High",  code:"priority:high  or  urgent"},
              {badge:"b-pri-m",label:"Medium", code:"default (no tag)"},
              {badge:"b-pri-l",label:"Low",    code:"priority:low"},
            ].map(({badge,label,code})=>(
              <div key={label} className="pri-row">
                <span className={`badge ${badge}`}>{label}</span>
                <span className="pri-code">{code}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {selected&&<OrderModal/>}
      {bulkPending&&<BulkModal/>}
    </>
  );
}

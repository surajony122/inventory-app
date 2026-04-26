import { useState, useMemo, useEffect } from "react";
import { useLoaderData, useSubmit, redirect, useNavigate } from "react-router";
import { wfCookie } from "../workflow.cookie.server";
import { findWorkflowUser } from "../workflow.users.server";
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
  --shadow-sm:0 2px 6px rgba(60,45,20,0.07),0 1px 2px rgba(60,45,20,0.05);
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

/* TOP ROW */
.top-row{display:flex;gap:16px;margin-bottom:20px;align-items:flex-start;flex-wrap:wrap;}
.top-row .stats-row{margin-bottom:0;flex:1;min-width:0;}

/* STATS */
.stats-row{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;position:relative;overflow:hidden;transition:box-shadow 0.15s,transform 0.1s;}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent-line,transparent);}
.stat-card:hover{box-shadow:var(--shadow-sm);transform:translateY(-1px);}
.stat-label{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;}
.stat-num{font-size:28px;font-weight:300;font-family:'Cormorant Garamond',serif;line-height:1;}
.stat-num.c-rose{color:var(--rose);}
.stat-num.c-gold{color:var(--gold);}

/* ALERTS PANEL */
.alerts-panel{width:220px;flex-shrink:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;}
.alerts-panel-title{font-size:11px;font-weight:500;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;}
.alert-item{background:var(--rose-bg);border:1px solid rgba(154,42,58,0.15);border-radius:var(--r-md);padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:opacity 0.12s;display:flex;align-items:center;gap:10px;}
.alert-item:hover{opacity:0.82;}
.alert-item:last-child{margin-bottom:0;}
.alert-thumb-ph{width:32px;height:32px;border-radius:6px;background:rgba(154,42,58,0.12);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:14px;color:var(--rose-text);}
.alert-info{flex:1;min-width:0;}
.alert-id{font-size:12px;font-weight:500;color:var(--rose-text);}
.alert-status{font-size:10px;color:var(--rose);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.alert-age{font-size:10px;color:var(--rose);font-family:'DM Mono',monospace;margin-top:1px;}
.alerts-ok{background:var(--teal-bg);border:1px solid rgba(42,122,106,0.15);border-radius:var(--r-md);padding:10px 12px;font-size:11px;color:var(--teal-text);display:flex;align-items:center;gap:6px;}

/* SKU BOARD */
.sku-section{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px 18px;margin-bottom:14px;}
.section-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
.section-title{font-size:12px;font-weight:500;color:var(--text);display:flex;align-items:center;gap:8px;}
.title-pip{width:5px;height:5px;border-radius:50%;background:var(--gold);flex-shrink:0;}
.view-toggle{display:flex;gap:3px;background:var(--surface-2);border-radius:6px;padding:3px;}
.vbtn{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:4px 10px;border-radius:5px;border:none;background:transparent;color:var(--text-2);cursor:pointer;transition:all 0.12s;}
.vbtn.active{background:var(--surface);color:var(--text);box-shadow:var(--shadow-xs);}
.sku-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;}
.sku-card{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;transition:all 0.15s;overflow:hidden;}
.sku-card:hover{border-color:var(--border-strong);transform:translateY(-1px);box-shadow:var(--shadow-sm);}
.sku-card.active{border:2px solid var(--gold);background:var(--gold-bg);}
.sku-img-wrap{width:100%;height:100px;overflow:hidden;background:var(--surface-3);position:relative;}
.sku-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s;}
.sku-card:hover .sku-img{transform:scale(1.04);}
.sku-img-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:30px;color:var(--border-strong);}
.sku-body{padding:11px 13px;}
.sku-code{font-family:'DM Mono',monospace;font-size:9px;color:var(--text-3);margin-bottom:2px;letter-spacing:0.3px;}
.sku-name{font-size:12px;font-weight:500;color:var(--text);line-height:1.3;margin-bottom:7px;}
.sku-big{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;color:var(--text);line-height:1;}
.sku-meta{font-size:10px;color:var(--text-3);margin-top:2px;margin-bottom:6px;}
.sku-bar-bg{height:3px;background:var(--surface-3);border-radius:2px;overflow:hidden;margin-bottom:5px;}
.sku-bar-fill{height:100%;border-radius:2px;background:var(--blue);transition:width 0.4s ease;}
.sku-bar-fill.hot{background:var(--gold);}
.sku-chips{display:flex;gap:4px;flex-wrap:wrap;}
.schip{font-size:9px;font-weight:500;padding:2px 6px;border-radius:20px;}

/* FILTER BAR */
.filter-bar{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--gold-text);background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-sm);padding:6px 12px;margin-bottom:10px;}
.filter-clear{margin-left:auto;background:none;border:none;cursor:pointer;font-size:11px;font-family:'DM Sans',sans-serif;color:var(--gold-text);font-weight:500;padding:0;text-decoration:underline;}

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
.bulk-bar{display:flex;align-items:center;gap:10px;background:var(--text);color:#fff;border-radius:var(--r-md);padding:10px 16px;margin-bottom:12px;flex-wrap:wrap;animation:slideDown 0.15s ease;}
@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
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
.overlay{position:fixed;inset:0;background:rgba(35,31,23,0.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(3px);animation:fadeIn 0.15s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:var(--surface);border-radius:var(--r-xl);width:100%;max-width:640px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-lg);animation:slideUp 0.18s ease;}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
.modal-hdr{padding:22px 24px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;position:sticky;top:0;background:var(--surface);z-index:1;}
.modal-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;}
.modal-sub{font-size:12px;color:var(--text-3);margin-top:3px;}
.modal-x{background:var(--surface-2);border:none;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:15px;color:var(--text-2);display:flex;align-items:center;justify-content:center;transition:background 0.12s;}
.modal-x:hover{background:var(--surface-3);}
.modal-body{padding:20px 24px;}
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

/* STALE BANNER */
.stale-banner{background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-md);padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--gold-text);}

/* TOAST */
.toast-wrap{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:999;pointer-events:none;}
.toast{background:var(--text);color:#fff;padding:10px 18px;border-radius:var(--r-sm);font-size:13px;display:flex;align-items:center;gap:8px;animation:toastIn 0.2s ease;}
.toast.t-success{background:var(--teal);}
.toast.t-error{background:var(--rose);}
@keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}

@media(max-width:900px){.stats-row{grid-template-columns:repeat(3,1fr);}.top-row{flex-direction:column;}.alerts-panel{width:100%;}}
@media(max-width:600px){.pg-main{padding:16px;}.pg-header{padding:0 16px;}.stats-row{grid-template-columns:repeat(2,1fr);}}
`;

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ROLES = ["admin","inventory","production","dispatch"];
const PROD_STATUSES = ["Sent to Production","In Production","Production Complete"];

const STATUS_BADGE = {
  "Awaiting Inventory Check":"b-gold","Ready for Dispatch":"b-teal",
  "Sent to Production":"b-orange","In Production":"b-blue",
  "Production Complete":"b-violet","Returned to Inventory":"b-cyan",
  "Dispatched":"b-slate","On Hold":"b-rose","Cancelled":"b-rose",
};
const PAY_BADGE = { Paid:"b-teal","Payment pending":"b-gold",Authorized:"b-cyan","Partially paid":"b-orange" };
const PRI_BADGE = { High:"b-pri-h",Medium:"b-pri-m",Low:"b-pri-l" };
const SKU_CHIP = {
  "Sent to Production":{cls:"b-orange",lbl:"Queued"},
  "In Production":{cls:"b-blue",lbl:"Active"},
  "Production Complete":{cls:"b-violet",lbl:"Done"},
};

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
function getAging(d){ return Math.floor((Date.now()-new Date(d).getTime())/86400000); }
function fmtDate(d){ return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); }
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

const SERVER_PAGE_SIZE = 50;

// ── LOADER ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  const user = findWorkflowUser(email);
  if (!user) return redirect("/workflow");

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const skip = (page - 1) * SERVER_PAGE_SIZE;

  const [total, cached, states] = await Promise.all([
    prisma.orderCache.count(),
    prisma.orderCache.findMany({
      orderBy: { updatedAt: "desc" },
      skip,
      take: SERVER_PAGE_SIZE,
    }),
    prisma.orderWorkflow.findMany(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / SERVER_PAGE_SIZE));

  const orders = cached.map(c => {
    const st = states.find(s => s.id === c.id);
    const aging = c.createdAt ? getAging(c.createdAt) : 0;
    return {
      shopifyId: c.id,
      id: c.name,
      customer: c.customer || "Guest",
      item: c.item || "—",
      sku: c.sku || "—",
      qty: c.qty || 1,
      imageUrl: c.imageUrl || null,
      orderDate: c.orderDate || (c.createdAt ? fmtDate(c.createdAt) : "—"),
      createdAt: c.createdAt || null,
      priority: c.priority || "Medium",
      status: st?.status || "Awaiting Inventory Check",
      owner: st?.owner || "Inventory - Queue",
      handoffs: JSON.parse(st?.handoffs || "[]"),
      aging,
      note: st?.note || "",
      shopifyNote: c.shopifyNote || "",
      paymentStatus: c.paymentStatus || "N/A",
    };
  });

  return {
    orders,
    user: { email: user.email, name: user.name, access: user.access },
    page,
    totalPages,
    total,
    isEmpty: total === 0,
  };
};

// ── ACTION ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  if (!findWorkflowUser(email)) return redirect("/workflow");

  const fd = await request.formData();
  const type = fd.get("type");

  if (type === "update") {
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

  if (type === "bulk") {
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

  if (type === "reset") {
    const id=fd.get("id");
    await prisma.orderWorkflow.upsert({
      where:{id},
      update:{status:"Awaiting Inventory Check",owner:"Inventory - Queue",note:"",handoffs:JSON.stringify([{from:"Reset",to:"Inventory",at:new Date().toISOString()}])},
      create:{id,status:"Awaiting Inventory Check",owner:"Inventory - Queue",handoffs:"[]"},
    });
    return {ok:true};
  }

  if (type === "note") {
    const id=fd.get("id"),note=fd.get("note")||"";
    await prisma.orderWorkflow.upsert({where:{id},update:{note},create:{id,note,status:"Awaiting Inventory Check",owner:"Inventory - Queue",handoffs:"[]"}});
    return {ok:true};
  }

  if (type === "logout") {
    const cookieStr = await wfCookie.serialize("", { maxAge: 0 });
    return redirect("/workflow", { headers: { "Set-Cookie": cookieStr } });
  }

  return {ok:false};
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function WorkflowOrders() {
  const { orders: init, isEmpty, user, page: serverPage, totalPages, total } = useLoaderData();
  const submit = useSubmit();
  const navigate = useNavigate();

  // Determine which role tabs this user can access
  const accessibleRoles = ROLES.filter(r => user?.access?.includes(r));
  const defaultRole = accessibleRoles[0] || "admin";

  const [orders,      setOrders]      = useState(init);
  const [role,        setRole]        = useState(defaultRole);
  const [query,       setQuery]       = useState("");
  const [statusF,     setStatusF]     = useState("all");
  const [priorityF,   setPriorityF]   = useState("all");
  const [activeSKU,   setActiveSKU]   = useState(null);
  const [skuView,     setSkuView]     = useState("all");
  const [selIds,      setSelIds]      = useState(new Set());
  const [selected,    setSelected]    = useState(null);
  const [noteVal,     setNoteVal]     = useState("");
  const [bulkPending, setBulkPending] = useState(null);
  const [toast,       setToast]       = useState(null);

  useEffect(() => {
    setOrders(init);
    setSelIds(new Set());
    setActiveSKU(null);
  }, [init]);

  function showToast(msg, type="") {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3000);
  }

  function changeRole(r) {
    setRole(r); setActiveSKU(null); setSkuView("all"); setSelIds(new Set());
    setQuery(""); setStatusF("all"); setPriorityF("all");
  }

  // ── visible orders ──────────────────────────────────────────────────────
  const visible = useMemo(() => {
    return orders.filter(o => {
      if (!ROLE_FILTER[role](o)) return false;
      if (activeSKU && o.sku !== activeSKU) return false;
      if (role==="production" && skuView==="queued" && o.status!=="Sent to Production") return false;
      if (role==="production" && skuView==="active" && o.status!=="In Production") return false;
      if (statusF!=="all" && o.status!==statusF) return false;
      if (priorityF!=="all" && o.priority!==priorityF) return false;
      if (query) {
        const q = query.toLowerCase();
        if (![o.id,o.customer,o.item,o.sku].join(" ").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders,role,activeSKU,skuView,statusF,priorityF,query]);

  // All visible orders on this server page (no client-side slicing)
  const pageItems = visible;

  // ── stats ───────────────────────────────────────────────────────────────
  const roleOrders = useMemo(()=>orders.filter(o=>ROLE_FILTER[role](o)), [orders,role]);
  const delayed = roleOrders.filter(o=>o.aging>=2);

  const stats = role==="production" ? {
    total:   roleOrders.length,
    units:   roleOrders.reduce((s,o)=>s+o.qty, 0),
    queued:  roleOrders.filter(o=>o.status==="Sent to Production").length,
    active:  roleOrders.filter(o=>o.status==="In Production").length,
    delayed: delayed.length,
  } : {
    total:   roleOrders.length,
    inv:     roleOrders.filter(o=>o.status==="Awaiting Inventory Check").length,
    prod:    roleOrders.filter(o=>PROD_STATUSES.includes(o.status)).length,
    disp:    roleOrders.filter(o=>o.status==="Ready for Dispatch").length,
    delayed: delayed.length,
  };

  // ── SKU board data ──────────────────────────────────────────────────────
  const skuGroups = useMemo(() => {
    const map={};
    orders.filter(o=>PROD_STATUSES.includes(o.status)).forEach(o=>{
      if(!map[o.sku]) map[o.sku]={sku:o.sku,item:o.item,totalQty:0,n:0,ss:{},imageUrl:o.imageUrl};
      map[o.sku].totalQty+=o.qty; map[o.sku].n++;
      map[o.sku].ss[o.status]=(map[o.sku].ss[o.status]||0)+o.qty;
      if(!map[o.sku].imageUrl&&o.imageUrl) map[o.sku].imageUrl=o.imageUrl;
    });
    return Object.values(map).sort((a,b)=>b.totalQty-a.totalQty);
  }, [orders]);

  // ── mutations ────────────────────────────────────────────────────────────
  function doUpdate(o,ns,no,hf) {
    const fd=new FormData();
    fd.append("type","update"); fd.append("id",o.shopifyId);
    fd.append("status",ns); fd.append("owner",no||"");
    if(hf){fd.append("hfFrom",hf.from);fd.append("hfTo",hf.to);}
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(x=>x.shopifyId!==o.shopifyId?x:{
      ...x,status:ns,...(no?{owner:no}:{}),
      handoffs:[...x.handoffs,...(hf?[{from:hf.from,to:hf.to,at:new Date().toISOString()}]:[])],
    }));
    setSelected(null);
    showToast("Order updated","success");
  }

  function doBulk(def,ids) {
    const fd=new FormData();
    fd.append("type","bulk"); fd.append("ids",JSON.stringify(ids));
    fd.append("status",def.ns); if(def.no) fd.append("owner",def.no);
    if(def.hf){fd.append("hfFrom",def.hf.from);fd.append("hfTo",def.hf.to);}
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(o=>!ids.includes(o.shopifyId)?o:{...o,status:def.ns,...(def.no?{owner:def.no}:{})}));
    setSelIds(new Set()); setBulkPending(null);
    showToast(`${ids.length} orders updated`,"success");
  }

  function doReset(o) {
    if(!confirm("Reset this order to the beginning of the workflow?")) return;
    const fd=new FormData(); fd.append("type","reset"); fd.append("id",o.shopifyId);
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(x=>x.shopifyId!==o.shopifyId?x:{...x,status:"Awaiting Inventory Check",owner:"Inventory - Queue",note:"",handoffs:[]}));
    setSelected(null);
    showToast("Workflow reset","success");
  }

  function saveNote(o,note) {
    const fd=new FormData(); fd.append("type","note"); fd.append("id",o.shopifyId); fd.append("note",note);
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(x=>x.shopifyId!==o.shopifyId?x:{...x,note}));
  }

  function doLogout() {
    const fd=new FormData(); fd.append("type","logout");
    submit(fd,{method:"POST"});
  }

  function exportCSV() {
    const hdr=["Order","Customer","Item","SKU","Qty","Payment","Priority","Status","Owner","Aging(d)","Note"];
    const rows=visible.map(o=>[o.id,o.customer,o.item,o.sku,o.qty,o.paymentStatus,o.priority,o.status,o.owner,o.aging,(o.note||"").replace(/,/g," ")].map(v=>`"${v}"`).join(","));
    const csv=[hdr.join(","),...rows].join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`orders-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }

  // ── selection helpers ────────────────────────────────────────────────────
  const selArr=[...selIds];
  const availBulk=getAvailBulk(selArr,orders);
  const allPageSel=visible.length>0&&visible.every(o=>selIds.has(o.shopifyId));
  const someSel=visible.some(o=>selIds.has(o.shopifyId));

  // ── Pagination (server-side) ──────────────────────────────────────────────
  function Pagination() {
    const showCount = visible.length;
    const start = (serverPage - 1) * SERVER_PAGE_SIZE + 1;
    const end = Math.min(serverPage * SERVER_PAGE_SIZE, total);
    return (
      <div className="pg-row">
        <span>
          {showCount < orders.length
            ? `${showCount} filtered · `
            : ""}
          Orders {start}–{end} of {total} · Page {serverPage} of {totalPages}
        </span>
        {totalPages > 1 && (
          <div className="pg-btns">
            <button className="pg-btn" disabled={serverPage <= 1}
              onClick={() => navigate(`?page=${serverPage - 1}`)}>‹ Prev</button>
            <button className="pg-btn cur">{serverPage}</button>
            <button className="pg-btn" disabled={serverPage >= totalPages}
              onClick={() => navigate(`?page=${serverPage + 1}`)}>Next ›</button>
          </div>
        )}
      </div>
    );
  }

  // ── SKU Board ──────────────────────────────────────────────────────────
  function SKUBoard() {
    if(role!=="production") return null;
    const maxQ=Math.max(...skuGroups.map(s=>s.totalQty),1);
    return(
      <div className="sku-section">
        <div className="section-bar">
          <div className="section-title"><span className="title-pip"></span>SKU production queue</div>
          <div className="view-toggle">
            {["all","queued","active"].map(v=>(
              <button key={v} className={`vbtn${skuView===v?" active":""}`} onClick={()=>setSkuView(v)}>
                {v[0].toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {skuGroups.length===0 ? (
          <div style={{color:"var(--text-3)",fontSize:12,padding:"12px 0"}}>No SKUs in production queue.</div>
        ) : (
          <div className="sku-grid">
            {skuGroups.map(s=>{
              const pct=Math.round((s.totalQty/maxQ)*100);
              const chips=Object.entries(s.ss).map(([st,q])=>{
                const c=SKU_CHIP[st]||{cls:"b-slate",lbl:st};
                return <span key={st} className={`schip badge ${c.cls}`}>{c.lbl}: {q}</span>;
              });
              return(
                <div key={s.sku} className={`sku-card${activeSKU===s.sku?" active":""}`}
                  onClick={()=>setActiveSKU(prev=>prev===s.sku?null:s.sku)}>
                  <div className="sku-img-wrap">
                    {s.imageUrl
                      ? <img src={s.imageUrl} className="sku-img" alt={s.item} onError={e=>{e.target.parentElement.innerHTML='<div class="sku-img-ph">◈</div>';}}/>
                      : <div className="sku-img-ph">◈</div>}
                  </div>
                  <div className="sku-body">
                    <div className="sku-code">{s.sku||"—"}</div>
                    <div className="sku-name">{s.item}</div>
                    <div className="sku-big">{s.totalQty}</div>
                    <div className="sku-meta">units · {s.n} order{s.n!==1?"s":""}</div>
                    <div className="sku-bar-bg"><div className={`sku-bar-fill${s.totalQty>=3?" hot":""}`} style={{width:`${pct}%`}}/></div>
                    <div className="sku-chips">{chips}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{marginTop:12,fontSize:12,fontWeight:500,color:"var(--text-2)",display:"flex",alignItems:"center",gap:8}}>
          <span className="title-pip"></span>
          {activeSKU ? `Orders for ${activeSKU}` : "Production orders"}
        </div>
      </div>
    );
  }

  // ── Order Modal ────────────────────────────────────────────────────────
  function OrderModal() {
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

  // ── Bulk Confirm Modal ─────────────────────────────────────────────────
  function BulkModal() {
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

  // ── RENDER ─────────────────────────────────────────────────────────────
  return(
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"/>
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
          <span className="brand-tag">team workflow</span>
        </div>

        <div className="hd-mid">
          <div className="role-tabs">
            {accessibleRoles.map(r=>(
              <button key={r} className={`role-tab${r===role?" active":""}`} onClick={()=>changeRole(r)}>
                {r[0].toUpperCase()+r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="hd-right">
          {user?.name && (
            <span style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontFamily:"'DM Sans',sans-serif"}}>
              {user.name}
            </span>
          )}
          <button className="hd-link" onClick={doLogout}>Sign Out</button>
        </div>
      </header>

      <main className="pg-main">
        {/* Stale data warning */}
        {isEmpty && (
          <div className="stale-banner">
            <strong>No order data found.</strong> Ask your admin to open the admin Order Workflow page to sync orders from Shopify. This page will update automatically after sync.
          </div>
        )}

        {/* Top row: Stats + Alerts */}
        <div className="top-row">
          {role==="production" ? (
            <div className="stats-row">
              <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-num">{stats.total}</div></div>
              <div className="stat-card"><div className="stat-label">Total Units</div><div className="stat-num">{stats.units}</div></div>
              <div className="stat-card" style={{"--accent-line":"#B8782A"}}><div className="stat-label">Queued</div><div className="stat-num">{stats.queued}</div></div>
              <div className="stat-card" style={{"--accent-line":"#2A5F9A"}}><div className="stat-label">In Production</div><div className="stat-num">{stats.active}</div></div>
              <div className="stat-card" style={{"--accent-line":"#9A2A3A"}}><div className="stat-label">Delayed 2d+</div><div className={`stat-num${stats.delayed>0?" c-rose":""}`}>{stats.delayed}</div></div>
            </div>
          ) : (
            <div className="stats-row">
              <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-num">{stats.total}</div></div>
              <div className="stat-card" style={{"--accent-line":"#B8782A"}}><div className="stat-label">Inventory Check</div><div className="stat-num">{stats.inv}</div></div>
              <div className="stat-card" style={{"--accent-line":"#2A5F9A"}}><div className="stat-label">In Production</div><div className="stat-num">{stats.prod}</div></div>
              <div className="stat-card" style={{"--accent-line":"#2A7A6A"}}><div className="stat-label">Ready to Dispatch</div><div className="stat-num">{stats.disp}</div></div>
              <div className="stat-card" style={{"--accent-line":"#9A2A3A"}}><div className="stat-label">Delayed 2d+</div><div className={`stat-num${stats.delayed>0?" c-rose":""}`}>{stats.delayed}</div></div>
            </div>
          )}

          {/* Alerts panel */}
          <div className="alerts-panel">
            <div className="alerts-panel-title">Alerts</div>
            {delayed.length===0
              ? <div className="alerts-ok">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#2A7A6A" strokeWidth="1.2"/><path d="M3.5 6l1.8 1.8L8.5 4" stroke="#2A7A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  No delayed orders
                </div>
              : delayed.slice(0,6).map(o=>(
                <div key={o.shopifyId} className="alert-item" onClick={()=>{setSelected(o);setNoteVal(o.note);}}>
                  <div className="alert-thumb-ph">◈</div>
                  <div className="alert-info">
                    <div className="alert-id">{o.id}</div>
                    <div className="alert-status">{o.status}</div>
                    <div className="alert-age">{o.aging}d pending</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* SKU Production Board (production role only) */}
        <SKUBoard/>

        {/* SKU active filter bar */}
        {activeSKU&&(
          <div className="filter-bar">
            <span>Filtering by SKU: <strong>{activeSKU}</strong></span>
            <button className="filter-clear" onClick={()=>setActiveSKU(null)}>Clear filter</button>
          </div>
        )}

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
              onChange={e=>{setQuery(e.target.value);}}/>
          </div>
          <select className="tb-sel" value={statusF} onChange={e=>{setStatusF(e.target.value);}}>
            <option value="all">All statuses</option>
            {(role==="production" ? PROD_STATUSES : Object.keys(STATUS_BADGE)).map(s=>(
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="tb-sel" value={priorityF} onChange={e=>{setPriorityF(e.target.value);}}>
            <option value="all">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
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
                      e.target.checked?visible.forEach(o=>n.add(o.shopifyId)):visible.forEach(o=>n.delete(o.shopifyId));
                      setSelIds(n);
                    }}/>
                </th>
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
                <tr><td colSpan={11}>
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
      </main>

      {selected&&<OrderModal/>}
      {bulkPending&&<BulkModal/>}

      {toast&&(
        <div className="toast-wrap">
          <div className={`toast${toast.type?" t-"+toast.type:""}`}>
            {toast.type==="success"?"✓ ":toast.type==="error"?"✗ ":""}{toast.msg}
          </div>
        </div>
      )}
    </>
  );
}

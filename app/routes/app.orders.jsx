import { useState, useMemo, useEffect } from "react";
import { useLoaderData, useSubmit, Link, useLocation, useActionData } from "react-router";
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
.alert-thumb{width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0;border:1px solid var(--border);}
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
.overlay{position:fixed;inset:0;background:rgba(35,31,23,0.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(3px);animation:fadeIn 0.15s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:var(--surface);border-radius:var(--r-xl);width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-lg);animation:slideUp 0.18s ease;}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
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

/* TOAST */
.toast-wrap{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:999;pointer-events:none;}
.toast{background:var(--text);color:#fff;padding:10px 18px;border-radius:var(--r-sm);font-size:13px;display:flex;align-items:center;gap:8px;animation:toastIn 0.2s ease;}
.toast.t-success{background:var(--teal);}
.toast.t-error{background:var(--rose);}
@keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}

@media(max-width:900px){.stats-row{grid-template-columns:repeat(3,1fr);}.info-grid{grid-template-columns:1fr;}.top-row{flex-direction:column;}.alerts-panel{width:100%;}}
@media(max-width:600px){.pg-main{padding:16px;}.pg-header{padding:0 16px;}.stats-row{grid-template-columns:repeat(2,1fr);}}
`;

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ROLES = ["admin","inventory","production","dispatch"];
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
const SKU_CHIP  = {
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

// ── HELPERS (loader-side) ─────────────────────────────────────────────────────
function buildOrdersFromCache(cached, states) {
  return cached.map(c=>{
    const st=states.find(s=>s.id===c.id);
    const aging=c.createdAt?getAging(c.createdAt):0;
    return {
      shopifyId:c.id, id:c.name,
      customer:c.customer||"Guest",
      item:c.item||"—", sku:c.sku||"—", qty:c.qty||1,
      imageUrl:c.imageUrl||null, lineItems:[],
      orderDate:c.orderDate||"—", createdAt:c.createdAt||null,
      priority:c.priority||"Medium",
      status:st?.status||"Awaiting Inventory Check",
      owner:st?.owner||"Inventory - Queue",
      handoffs:JSON.parse(st?.handoffs||"[]"),
      aging, note:st?.note||"", shopifyNote:c.shopifyNote||"",
      paymentStatus:c.paymentStatus||"N/A", fulfillStatus:"UNFULFILLED",
    };
  });
}

async function fetchAndCacheFromShopify(admin) {
  const PAY_MAP={PAID:"Paid",PENDING:"Payment pending",AUTHORIZED:"Authorized",PARTIALLY_PAID:"Partially paid",REFUNDED:"Refunded",VOIDED:"Voided"};
  let rawOrders=[], ordersError=null;
  try{
    let cursor=null,hasNext=true;
    while(hasNext){
      const resp=await admin.graphql(`
        query($cursor:String){
          orders(first:250,after:$cursor,sortKey:CREATED_AT,reverse:true){
            pageInfo{ hasNextPage endCursor }
            edges{ node{
              id name createdAt displayFinancialStatus
              customer{ firstName lastName }
              lineItems(first:3){ edges{ node{ title sku quantity image{ url } } } }
              tags note
            }}
          }
        }
      `,{variables:{cursor}});
      const json=await resp.json();
      if(json.errors?.length) throw new Error(json.errors[0].message);
      const pg=json.data?.orders; if(!pg) break;
      rawOrders=rawOrders.concat(pg.edges.map(e=>e.node));
      hasNext=pg.pageInfo.hasNextPage; cursor=pg.pageInfo.endCursor;
    }
  }catch(err){
    ordersError=err.message||"Shopify API error";
    // Fallback: no customer field
    try{
      rawOrders=[]; let cursor=null,hasNext=true;
      while(hasNext){
        const resp=await admin.graphql(`
          query($cursor:String){
            orders(first:250,after:$cursor,sortKey:CREATED_AT,reverse:true){
              pageInfo{ hasNextPage endCursor }
              edges{ node{
                id name createdAt displayFinancialStatus
                lineItems(first:3){ edges{ node{ title sku quantity image{ url } } } }
                tags note
              }}
            }
          }
        `,{variables:{cursor}});
        const json=await resp.json();
        if(json.errors?.length) throw new Error(json.errors[0].message);
        const pg=json.data?.orders; if(!pg) break;
        rawOrders=rawOrders.concat(pg.edges.map(e=>e.node));
        hasNext=pg.pageInfo.hasNextPage; cursor=pg.pageInfo.endCursor;
      }
      ordersError=null;
    }catch(_){}
  }

  if(rawOrders.length>0){
    await Promise.all(rawOrders.map(o=>{
      const li=o.lineItems.edges[0]?.node;
      const tags=(o.tags||[]).map(s=>s.toLowerCase());
      const priority=tags.includes("priority:high")||tags.includes("urgent")?"High":tags.includes("priority:low")?"Low":"Medium";
      return prisma.orderCache.upsert({
        where:{id:o.id},
        update:{
          name:o.name,
          customer:o.customer?`${o.customer.firstName} ${o.customer.lastName}`.trim():"Guest",
          item:li?.title||"—",sku:li?.sku||"—",qty:li?.quantity||1,
          imageUrl:li?.image?.url||null,
          orderDate:fmtDate(o.createdAt),createdAt:o.createdAt,
          paymentStatus:PAY_MAP[o.displayFinancialStatus]||"N/A",
          priority,shopifyNote:o.note||"",
        },
        create:{
          id:o.id,name:o.name,
          customer:o.customer?`${o.customer.firstName} ${o.customer.lastName}`.trim():"Guest",
          item:li?.title||"—",sku:li?.sku||"—",qty:li?.quantity||1,
          imageUrl:li?.image?.url||null,
          orderDate:fmtDate(o.createdAt),createdAt:o.createdAt,
          paymentStatus:PAY_MAP[o.displayFinancialStatus]||"N/A",
          priority,shopifyNote:o.note||"",
        },
      });
    }));
  }
  return { count: rawOrders.length, ordersError };
}

// ── LOADER — reads from local cache (instant, no Shopify API) ────────────────
export const loader = async ({ request }) => {
  // Auth is handled by the app.jsx layout loader.
  // We don't call authenticate.admin here because:
  // 1. We only read from local DB (no Shopify API needed)
  // 2. Calling it triggers a Shopify session-token round-trip that shows "200"

  const [cached, states] = await Promise.all([
    prisma.orderCache.findMany({ orderBy:{ updatedAt:"desc" } }),
    prisma.orderWorkflow.findMany(),
  ]);

  const orders = buildOrdersFromCache(cached, states);
  const lastSync = cached.length>0 ? cached[0].updatedAt?.toISOString()||null : null;
  return { orders, lastSync, isEmpty: cached.length===0 };
};

// ── ACTION ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const fd=await request.formData();
  const type=fd.get("type");

  if(type==="sync"){
    const result = await fetchAndCacheFromShopify(admin);
    // Refresh orders from cache and return
    const [cached,states]=await Promise.all([
      prisma.orderCache.findMany({orderBy:{updatedAt:"desc"}}),
      prisma.orderWorkflow.findMany(),
    ]);
    const orders=buildOrdersFromCache(cached,states);
    return {ok:true,synced:result.count,orders,ordersError:result.ordersError,lastSync:new Date().toISOString()};
  }

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
  const {orders:init, lastSync:initLastSync, isEmpty}=useLoaderData();
  const submit=useSubmit();
  const { search }=useLocation();

  const [orders,      setOrders]      = useState(init);
  const [lastSync,    setLastSync]    = useState(initLastSync);
  const [syncing,     setSyncing]     = useState(false);
  const [role,        setRole]        = useState("admin");
  const [query,       setQuery]       = useState("");
  const [statusF,     setStatusF]     = useState("all");
  const [priorityF,   setPriorityF]   = useState("all");
  const [payF,        setPayF]        = useState("all");
  const [activeSKU,   setActiveSKU]   = useState(null);
  const [skuView,     setSkuView]     = useState("all");
  const [selIds,      setSelIds]      = useState(new Set());
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState(null);
  const [noteVal,     setNoteVal]     = useState("");
  const [bulkPending, setBulkPending] = useState(null);
  const [toast,       setToast]       = useState(null);

  useEffect(()=>{ setOrders(init); },[init]);

  const actionData = useActionData();
  useEffect(()=>{
    if(!actionData) return;
    if(actionData.orders) setOrders(actionData.orders);
    if(actionData.lastSync) setLastSync(actionData.lastSync);
    if(actionData.synced!=null){
      setSyncing(false);
      if(actionData.ordersError) showToast(`Sync error: ${actionData.ordersError}`,"error");
      else showToast(`Synced ${actionData.synced} orders from Shopify`,"success");
    }
  },[actionData]);

  function showToast(msg, type=""){
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  }

  function doSync(){
    setSyncing(true);
    const fd=new FormData(); fd.append("type","sync");
    submit(fd,{method:"POST"});
  }

  function changeRole(r){
    setRole(r); setActiveSKU(null); setSkuView("all"); setSelIds(new Set()); setPage(1);
    setQuery(""); setStatusF("all"); setPriorityF("all"); setPayF("all");
  }

  // ── visible orders ────────────────────────────────────────────────────────
  const visible=useMemo(()=>{
    return orders.filter(o=>{
      if(!ROLE_FILTER[role](o)) return false;
      if(activeSKU&&o.sku!==activeSKU) return false;
      if(role==="production"&&skuView==="queued"&&o.status!=="Sent to Production") return false;
      if(role==="production"&&skuView==="active"&&o.status!=="In Production") return false;
      if(statusF!=="all"&&o.status!==statusF) return false;
      if(priorityF!=="all"&&o.priority!==priorityF) return false;
      if(payF!=="all"&&o.paymentStatus!==payF) return false;
      if(query){
        const q=query.toLowerCase();
        if(![o.id,o.customer,o.item,o.sku,o.shopifyId].join(" ").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },[orders,role,activeSKU,skuView,statusF,priorityF,payF,query]);

  const totalPages=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));
  const curPage=Math.min(page,totalPages);
  const pageItems=visible.slice((curPage-1)*PAGE_SIZE,curPage*PAGE_SIZE);

  // ── stats (role-aware) ────────────────────────────────────────────────────
  const roleOrders=useMemo(()=>orders.filter(o=>ROLE_FILTER[role](o)),[orders,role]);
  const delayed=roleOrders.filter(o=>o.aging>=2);

  const stats = role==="production" ? {
    total:    roleOrders.length,
    units:    roleOrders.reduce((s,o)=>s+o.qty,0),
    queued:   roleOrders.filter(o=>o.status==="Sent to Production").length,
    active:   roleOrders.filter(o=>o.status==="In Production").length,
    delayed:  delayed.length,
  } : {
    total:    roleOrders.length,
    inv:      roleOrders.filter(o=>o.status==="Awaiting Inventory Check").length,
    prod:     roleOrders.filter(o=>PROD_STATUSES.includes(o.status)).length,
    disp:     roleOrders.filter(o=>o.status==="Ready for Dispatch").length,
    delayed:  delayed.length,
  };

  // ── SKU production board data ─────────────────────────────────────────────
  const skuGroups=useMemo(()=>{
    const map={};
    orders.filter(o=>PROD_STATUSES.includes(o.status)).forEach(o=>{
      if(!map[o.sku]) map[o.sku]={sku:o.sku,item:o.item,totalQty:0,n:0,ss:{},imageUrl:o.imageUrl};
      map[o.sku].totalQty+=o.qty; map[o.sku].n++;
      map[o.sku].ss[o.status]=(map[o.sku].ss[o.status]||0)+o.qty;
      if(!map[o.sku].imageUrl&&o.imageUrl) map[o.sku].imageUrl=o.imageUrl;
    });
    return Object.values(map).sort((a,b)=>b.totalQty-a.totalQty);
  },[orders]);

  // ── mutations ─────────────────────────────────────────────────────────────
  function doUpdate(o,ns,no,hf){
    const fd=new FormData();
    fd.append("type","update"); fd.append("id",o.shopifyId);
    fd.append("status",ns); fd.append("owner",no||"");
    if(hf){ fd.append("hfFrom",hf.from); fd.append("hfTo",hf.to); }
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(x=>x.shopifyId!==o.shopifyId?x:{
      ...x,status:ns,...(no?{owner:no}:{}),
      handoffs:[...x.handoffs,...(hf?[{from:hf.from,to:hf.to,at:new Date().toISOString()}]:[])],
    }));
    setSelected(null);
    showToast("Order updated","success");
  }

  function doBulk(def,ids){
    const fd=new FormData();
    fd.append("type","bulk"); fd.append("ids",JSON.stringify(ids));
    fd.append("status",def.ns); if(def.no) fd.append("owner",def.no);
    if(def.hf){ fd.append("hfFrom",def.hf.from); fd.append("hfTo",def.hf.to); }
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(o=>!ids.includes(o.shopifyId)?o:{...o,status:def.ns,...(def.no?{owner:def.no}:{})}));
    setSelIds(new Set()); setBulkPending(null);
    showToast(`${ids.length} orders updated`,"success");
  }

  function doReset(o){
    if(!confirm("Reset this order to the beginning of the workflow?")) return;
    const fd=new FormData(); fd.append("type","reset"); fd.append("id",o.shopifyId);
    submit(fd,{method:"POST"});
    setOrders(prev=>prev.map(x=>x.shopifyId!==o.shopifyId?x:{...x,status:"Awaiting Inventory Check",owner:"Inventory - Queue",note:"",handoffs:[]}));
    setSelected(null);
    showToast("Workflow reset","success");
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

  // ── selection helpers ─────────────────────────────────────────────────────
  const selArr=[...selIds];
  const availBulk=getAvailBulk(selArr,orders);
  const allPageSel=pageItems.length>0&&pageItems.every(o=>selIds.has(o.shopifyId));
  const someSel=pageItems.some(o=>selIds.has(o.shopifyId));

  // ── Thumbnail ─────────────────────────────────────────────────────────────
  function Thumb({src,size=38}){
    const [err,setErr]=useState(false);
    if(src&&!err) return <img src={src} className="thumb" style={{width:size,height:size}} alt="" onError={()=>setErr(true)}/>;
    return <div className="thumb-ph" style={{width:size,height:size}}>◈</div>;
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  function Pagination(){
    if(totalPages<=1) return null;
    const start=(curPage-1)*PAGE_SIZE, end=Math.min(start+pageItems.length,visible.length);
    const pages=[];
    for(let i=1;i<=Math.min(7,totalPages);i++){
      let p;
      if(totalPages<=7) p=i;
      else if(curPage<=4) p=i;
      else if(curPage>=totalPages-3) p=totalPages-6+i;
      else p=curPage-3+i;
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

  // ── SKU Production Board ──────────────────────────────────────────────────
  function SKUBoard(){
    if(role!=="production") return null;
    const maxQ=Math.max(...skuGroups.map(s=>s.totalQty),1);
    return(
      <div className="sku-section">
        <div className="section-bar">
          <div className="section-title">
            <span className="title-pip"></span>
            SKU production queue
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div className="view-toggle">
              {["all","queued","active"].map(v=>(
                <button key={v} className={`vbtn${skuView===v?" active":""}`}
                  onClick={()=>setSkuView(v)}>
                  {v[0].toUpperCase()+v.slice(1)}
                </button>
              ))}
            </div>
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
                    <div className="sku-bar-bg">
                      <div className={`sku-bar-fill${s.totalQty>=3?" hot":""}`} style={{width:`${pct}%`}}/>
                    </div>
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

  // ── Order Modal ───────────────────────────────────────────────────────────
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

  // ── Bulk Confirm Modal ────────────────────────────────────────────────────
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
          <span className="brand-tag">order workflow</span>
        </div>

        <div className="hd-mid">
          <div className="role-tabs">
            {ROLES.map(r=>(
              <button key={r} className={`role-tab${r===role?" active":""}`}
                onClick={()=>changeRole(r)}>
                {r[0].toUpperCase()+r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="hd-right">
          <button className="hd-link" onClick={doSync} disabled={syncing} style={{cursor:syncing?"not-allowed":"pointer"}}>
            {syncing ? "Syncing…" : "⟳ Sync Orders"}
          </button>
          <Link to={`/app${search}`} className="hd-link">← Dashboard</Link>
        </div>
      </header>

      <main className="pg-main">
        {/* Empty / stale banner */}
        {isEmpty&&(
          <div style={{background:"var(--gold-bg)",border:"1px solid var(--gold-border)",borderRadius:"var(--r-md)",padding:"12px 16px",marginBottom:16,fontSize:13,color:"var(--gold-text)"}}>
            <strong>No orders synced yet.</strong> Click <strong>⟳ Sync Orders</strong> in the header to pull orders from Shopify. This only takes a moment and updates both this page and the team workflow page.
          </div>
        )}
        {lastSync&&!isEmpty&&(
          <div style={{fontSize:11,color:"var(--text-3)",marginBottom:12,fontFamily:"'DM Mono',monospace"}}>
            Last synced: {new Date(lastSync).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
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

          {/* Alerts panel — delayed orders */}
          <div className="alerts-panel">
            <div className="alerts-panel-title">Alerts</div>
            {delayed.length===0
              ? <div className="alerts-ok">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#2A7A6A" strokeWidth="1.2"/><path d="M3.5 6l1.8 1.8L8.5 4" stroke="#2A7A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  No delayed orders
                </div>
              : delayed.slice(0,6).map(o=>(
                <div key={o.shopifyId} className="alert-item" onClick={()=>{setSelected(o);setNoteVal(o.note);}}>
                  {o.imageUrl
                    ? <img src={o.imageUrl} className="alert-thumb" alt="" onError={e=>{e.target.style.display="none";}}/>
                    : <div className="alert-thumb-ph">◈</div>}
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
              onChange={e=>{setQuery(e.target.value);setPage(1);}}/>
          </div>
          <select className="tb-sel" value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}}>
            <option value="all">All statuses</option>
            {(role==="production" ? PROD_STATUSES : Object.keys(STATUS_BADGE)).map(s=>(
              <option key={s} value={s}>{s}</option>
            ))}
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
                  <td style={{padding:"8px 6px 8px 14px"}}><Thumb src={o.imageUrl}/></td>
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

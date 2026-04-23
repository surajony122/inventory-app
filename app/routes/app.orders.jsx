import { useState, useEffect, useMemo } from "react";
import { useLoaderData, useSubmit, useNavigation, Link } from "react-router";
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
  --shadow-md:0 6px 18px rgba(60,45,20,0.09),0 2px 4px rgba(60,45,20,0.05);
  --shadow-lg:0 16px 40px rgba(60,45,20,0.13),0 4px 8px rgba(60,45,20,0.07);
}
html,body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.55;min-height:100vh;}
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:3px;}
.ord-header{background:var(--text);padding:0 28px;display:flex;align-items:center;gap:20px;height:58px;position:sticky;top:0;z-index:60;}
.brand{display:flex;align-items:center;gap:12px;}
.brand-mark{width:32px;height:32px;border:1.5px solid rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:#fff;letter-spacing:0.02em;}
.brand-tag{font-size:10px;color:rgba(255,255,255,0.38);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;margin-left:2px;}
.header-mid{flex:1;display:flex;align-items:center;justify-content:center;}
.header-right{display:flex;align-items:center;gap:10px;}
.sync-badge{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.03em;}
.back-btn{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:5px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);cursor:pointer;transition:all 0.15s;text-decoration:none;display:inline-flex;align-items:center;gap:5px;}
.back-btn:hover{background:rgba(255,255,255,0.12);color:#fff;}
.role-tabs{display:flex;gap:2px;}
.role-tab{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:5px 14px;border-radius:6px;border:none;background:transparent;color:rgba(255,255,255,0.45);cursor:pointer;transition:all 0.15s;}
.role-tab:hover{color:rgba(255,255,255,0.75);}
.role-tab.active{background:rgba(255,255,255,0.12);color:#fff;}
.ord-main{padding:24px 28px;max-width:1360px;margin:0 auto;}
.top-row{display:flex;gap:16px;margin-bottom:20px;align-items:flex-start;flex-wrap:wrap;}
.stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;flex:1;min-width:0;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;transition:box-shadow 0.15s,transform 0.1s;position:relative;overflow:hidden;}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent-line,transparent);}
.stat-card:hover{box-shadow:var(--shadow-sm);transform:translateY(-1px);}
.stat-label{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;}
.stat-num{font-size:28px;font-weight:300;color:var(--text);line-height:1;font-family:'Cormorant Garamond',serif;}
.stat-num.danger{color:var(--rose);}
.alerts-panel{width:220px;flex-shrink:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;}
.alerts-panel-title{font-size:11px;font-weight:500;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;}
.alert-item{background:var(--rose-bg);border:1px solid rgba(154,42,58,0.15);border-radius:var(--r-md);padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:opacity 0.12s;display:flex;align-items:center;gap:10px;}
.alert-item:hover{opacity:0.82;}
.alert-item:last-child{margin-bottom:0;}
.alert-thumb{width:32px;height:32px;border-radius:6px;object-fit:cover;background:var(--rose-bg);flex-shrink:0;}
.alert-thumb-ph{width:32px;height:32px;border-radius:6px;background:rgba(154,42,58,0.12);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;}
.alert-info{flex:1;min-width:0;}
.alert-id{font-size:12px;font-weight:500;color:var(--rose-text);}
.alert-status{font-size:10px;color:var(--rose);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.alert-age{font-size:10px;color:var(--rose);font-family:'DM Mono',monospace;margin-top:1px;}
.alerts-ok{background:var(--teal-bg);border:1px solid rgba(42,122,106,0.15);border-radius:var(--r-md);padding:10px 12px;font-size:11px;color:var(--teal-text);display:flex;align-items:center;gap:6px;}
.sku-section{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px 18px;margin-bottom:14px;}
.section-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
.section-title{font-size:12px;font-weight:500;color:var(--text);display:flex;align-items:center;gap:8px;}
.title-pip{width:5px;height:5px;border-radius:50%;background:var(--gold);}
.view-toggle{display:flex;gap:3px;background:var(--surface-2);border-radius:6px;padding:3px;}
.vbtn{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:4px 10px;border-radius:5px;border:none;background:transparent;color:var(--text-2);cursor:pointer;transition:all 0.12s;}
.vbtn.active{background:var(--surface);color:var(--text);box-shadow:var(--shadow-xs);}
.sku-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;}
.sku-card{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;transition:all 0.15s;overflow:hidden;}
.sku-card:hover{border-color:var(--border-strong);transform:translateY(-1px);box-shadow:var(--shadow-sm);}
.sku-card.sku-active{border:2px solid var(--gold);background:var(--gold-bg);}
.sku-img-wrap{width:100%;height:110px;overflow:hidden;background:var(--surface-3);position:relative;}
.sku-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s;}
.sku-card:hover .sku-img{transform:scale(1.04);}
.sku-img-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:32px;color:var(--border-strong);}
.sku-body{padding:12px 14px;}
.sku-code{font-family:'DM Mono',monospace;font-size:9px;color:var(--text-3);margin-bottom:3px;letter-spacing:0.3px;}
.sku-name{font-size:12px;font-weight:500;color:var(--text);line-height:1.3;margin-bottom:8px;}
.sku-big{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:400;color:var(--text);line-height:1;}
.sku-meta{font-size:10px;color:var(--text-3);margin-top:2px;margin-bottom:7px;}
.sku-bar-bg{height:3px;background:var(--surface-3);border-radius:2px;overflow:hidden;margin-bottom:6px;}
.sku-bar-fill{height:100%;border-radius:2px;background:var(--blue);transition:width 0.4s ease;}
.sku-bar-fill.hot{background:var(--gold);}
.sku-chips{display:flex;gap:4px;flex-wrap:wrap;}
.schip{font-size:9px;font-weight:500;padding:2px 6px;border-radius:20px;}
.toolbar{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;}
.search-wrap{position:relative;flex:1;min-width:200px;}
.search-wrap input{width:100%;padding:8px 12px 8px 34px;border:1px solid var(--border-md);border-radius:var(--r-sm);background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;transition:border-color 0.15s;}
.search-wrap input:focus{border-color:var(--gold);}
.search-wrap input::placeholder{color:var(--text-3);}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-3);pointer-events:none;}
.toolbar select{padding:8px 12px;border:1px solid var(--border-md);border-radius:var(--r-sm);background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;cursor:pointer;}
.toolbar select:focus{border-color:var(--gold);}
.dl-btn{display:inline-flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:7px 13px;border-radius:var(--r-sm);border:1px solid var(--teal);background:var(--teal-bg);color:var(--teal-text);cursor:pointer;transition:all 0.15s;white-space:nowrap;}
.dl-btn:hover{background:var(--teal);color:#fff;}
.filter-bar{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--gold-text);background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-sm);padding:6px 12px;margin-bottom:10px;}
.filter-clear{margin-left:auto;background:none;border:none;cursor:pointer;font-size:11px;font-family:'DM Sans',sans-serif;color:var(--gold-text);font-weight:500;padding:0;text-decoration:underline;}
.bulk-bar{display:flex;align-items:center;gap:10px;background:var(--text);color:#fff;border-radius:var(--r-md);padding:10px 16px;margin-bottom:10px;flex-wrap:wrap;}
.bulk-count{font-size:13px;font-weight:500;}
.bulk-btns{display:flex;gap:6px;flex-wrap:wrap;align-items:center;}
.bbtn{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:6px 14px;border-radius:var(--r-sm);border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;transition:background 0.12s;white-space:nowrap;}
.bbtn:hover{background:rgba(255,255,255,0.2);}
.bbtn.primary{background:#fff;color:var(--text);border-color:transparent;}
.bbtn.primary:hover{background:rgba(255,255,255,0.88);}
.bulk-hint{font-size:11px;color:rgba(255,255,255,0.38);}
.bulk-x{margin-left:auto;background:none;border:none;cursor:pointer;font-size:20px;color:rgba(255,255,255,0.3);line-height:1;transition:color 0.1s;}
.bulk-x:hover{color:#fff;}
.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-xs);}
.orders-table{width:100%;border-collapse:collapse;}
.orders-table thead tr{border-bottom:1px solid var(--border-md);}
.orders-table th{text-align:left;padding:10px 14px;font-size:10px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;background:var(--surface-2);}
.orders-table th.th-chk{width:40px;padding-right:6px;}
.orders-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle;}
.orders-table td.td-chk{padding-right:6px;}
.orders-table tr:last-child td{border-bottom:none;}
.orders-table tbody tr{cursor:pointer;transition:background 0.08s;}
.orders-table tbody tr:hover td{background:var(--surface-2);}
.orders-table tbody tr.row-sel td{background:#EEF3FA;}
input[type="checkbox"]{width:14px;height:14px;accent-color:var(--blue);cursor:pointer;display:block;}
.prod-thumb{width:38px;height:38px;border-radius:7px;object-fit:cover;background:var(--surface-3);display:block;border:1px solid var(--border);}
.prod-thumb-ph{width:38px;height:38px;border-radius:7px;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--text-3);}
.order-id{font-weight:500;font-size:13px;}
.order-sid{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-3);margin-top:1px;}
.sku-m{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-2);}
.item-n{font-size:13px;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.age-ok{font-size:11px;color:var(--text-3);}
.age-warn{font-size:11px;color:var(--rose);font-weight:500;}
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
.empty-state{text-align:center;padding:52px 24px;color:var(--text-3);font-size:13px;}
.empty-glyph{font-family:'Cormorant Garamond',serif;font-size:42px;color:var(--border-strong);margin-bottom:10px;}
.bottom-row{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-top:16px;}
.process-panel,.info-panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;}
.panel-title{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--text);margin-bottom:14px;}
.process-step{display:flex;gap:12px;align-items:flex-start;padding:10px 14px;border-radius:var(--r-md);border:1px solid var(--border);margin-bottom:8px;background:var(--surface-2);}
.process-step:last-child{margin-bottom:0;}
.step-num{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--gold);min-width:22px;line-height:1.2;}
.step-text{font-size:12px;color:var(--text-2);line-height:1.5;}
.flow-diagram{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:14px;}
.flow-node{font-size:10px;font-weight:500;padding:4px 10px;border-radius:20px;background:var(--surface-2);border:1px solid var(--border-md);color:var(--text-2);}
.flow-arrow{color:var(--text-3);font-size:12px;}
.modal-overlay{position:fixed;inset:0;background:rgba(35,31,23,0.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(3px);}
.modal{background:var(--surface);border-radius:var(--r-xl);width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-lg);}
.modal-header{padding:22px 24px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;position:sticky;top:0;background:var(--surface);z-index:1;}
.modal-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--text);}
.modal-meta{font-size:12px;color:var(--text-3);margin-top:3px;}
.modal-x{background:var(--surface-2);border:none;border-radius:7px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:var(--text-2);flex-shrink:0;transition:background 0.12s;}
.modal-x:hover{background:var(--surface-3);}
.modal-body{padding:20px 24px;}
.modal-product-img{width:100%;height:200px;object-fit:cover;border-radius:var(--r-md);margin-bottom:18px;border:1px solid var(--border);}
.modal-product-ph{width:100%;height:140px;border-radius:var(--r-md);margin-bottom:18px;border:1px solid var(--border);background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:48px;color:var(--border-strong);}
.modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;}
.mfield-lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin-bottom:4px;}
.mfield-val{font-size:13px;font-weight:500;color:var(--text);}
.section-lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin-bottom:8px;font-weight:500;}
.handoff-wrap{margin-bottom:18px;}
.handoff-row{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--text-2);padding:7px 0;border-bottom:1px solid var(--border);}
.handoff-row:last-child{border-bottom:none;}
.h-from,.h-to{font-weight:500;color:var(--text);}
.h-arrow{color:var(--text-3);}
.h-time{margin-left:auto;font-family:'DM Mono',monospace;font-size:10px;color:var(--text-3);}
.note-area{width:100%;font-family:'DM Sans',sans-serif;font-size:13px;border:1px solid var(--border-md);border-radius:var(--r-sm);padding:10px 12px;background:var(--surface-2);color:var(--text);resize:vertical;min-height:76px;outline:none;transition:border-color 0.15s;}
.note-area:focus{border-color:var(--gold);background:var(--surface);}
.modal-actions{padding:14px 24px 20px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.btn{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:8px 16px;border-radius:var(--r-sm);border:1px solid var(--border-md);background:var(--surface);color:var(--text);cursor:pointer;transition:all 0.12s;white-space:nowrap;}
.btn:hover{background:var(--surface-2);}
.btn-primary{background:var(--text);color:var(--surface);border-color:var(--text);}
.btn-primary:hover{opacity:0.85;}
.btn-ghost{border-color:transparent;color:var(--text-2);}
.btn-ghost:hover{background:var(--surface-2);color:var(--text);}
.ml-auto{margin-left:auto;}
.bm-list{border:1px solid var(--border);border-radius:var(--r-sm);max-height:200px;overflow-y:auto;margin-bottom:14px;}
.bm-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border);font-size:12px;}
.bm-row:last-child{border-bottom:none;}
.bm-id{font-weight:500;min-width:82px;}
.bm-item{color:var(--text-2);flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.bm-desc{font-size:13px;color:var(--text-2);line-height:1.6;}
.pg-btn{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:4px 9px;border-radius:var(--r-sm);border:1px solid var(--border-md);background:var(--surface);color:var(--text);cursor:pointer;transition:all 0.12s;min-width:30px;}
.pg-btn:hover:not(:disabled){background:var(--surface-2);}
.pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
.pg-active{background:var(--text)!important;color:var(--surface)!important;border-color:var(--text)!important;}
@media(max-width:900px){.stats-grid{grid-template-columns:repeat(3,1fr);}}
@media(max-width:700px){.ord-main{padding:16px;}.ord-header{padding:0 16px;}.top-row{flex-direction:column;}.alerts-panel{width:100%;}.bottom-row{grid-template-columns:1fr;}.modal-grid{grid-template-columns:1fr;}.stats-grid{grid-template-columns:repeat(2,1fr);}}
`;

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const PROD_STATUSES = ["Sent to Production", "In Production", "Production Complete"];
const ROLES = ["admin", "inventory", "production", "dispatch"];
const PAGE_SIZE = 25;

const STATUS_BADGE = {
  "Awaiting Inventory Check": "b-gold",
  "Ready for Dispatch": "b-teal",
  "Sent to Production": "b-orange",
  "In Production": "b-blue",
  "Production Complete": "b-violet",
  "Returned to Inventory": "b-cyan",
  "Dispatched": "b-slate",
  "On Hold": "b-rose",
  "Cancelled": "b-rose",
  "Paid": "b-teal",
  "Payment pending": "b-gold",
  "Authorized": "b-cyan",
  "Partially paid": "b-orange",
};
const STATUS_CHIP = {
  "Sent to Production": { cls: "b-orange", lbl: "Queued" },
  "In Production":      { cls: "b-blue",   lbl: "Active" },
  "Production Complete":{ cls: "b-violet", lbl: "Done"   },
};
const PRI_BADGE = { High: "b-pri-h", Medium: "b-pri-m", Low: "b-pri-l" };
const STAT_LINES = {
  "Awaiting Inventory Check": "#B8782A",
  "Ready for Dispatch": "#2A7A6A",
  "In Production": "#2A5F9A",
  "On Hold": "#9A2A3A",
};
const roleFilter = {
  admin:      () => true,
  inventory:  o => ["Awaiting Inventory Check", "Returned to Inventory", "Ready for Dispatch"].includes(o.status),
  production: o => PROD_STATUSES.includes(o.status),
  dispatch:   o => ["Ready for Dispatch", "Dispatched"].includes(o.status),
};
const BULK_DEFS = [
  { label: "Stock available → dispatch", primary: true,  app: ["Awaiting Inventory Check"],     ns: "Ready for Dispatch",    no: "Dispatch - Queue",   hf: { from: "Inventory", to: "Dispatch" } },
  { label: "Send to production",         primary: false, app: ["Awaiting Inventory Check"],     ns: "Sent to Production",    no: "Production - Queue", hf: { from: "Inventory", to: "Production" } },
  { label: "Mark in production",         primary: true,  app: ["Sent to Production"],           ns: "In Production",         no: null,                 hf: { from: "Queue",     to: "Artisan" } },
  { label: "Mark production complete",   primary: true,  app: ["In Production"],                ns: "Production Complete",   no: null,                 hf: { from: "Production",to: "QC" } },
  { label: "Return to inventory",        primary: true,  app: ["Production Complete"],          ns: "Returned to Inventory", no: "Inventory - Queue",  hf: { from: "Production",to: "Inventory" } },
  { label: "Ready for dispatch",         primary: true,  app: ["Returned to Inventory"],        ns: "Ready for Dispatch",    no: "Dispatch - Queue",   hf: { from: "Inventory", to: "Dispatch" } },
  { label: "Mark dispatched",            primary: true,  app: ["Ready for Dispatch"],           ns: "Dispatched",            no: "Courier",            hf: { from: "Dispatch",  to: "Courier" } },
  { label: "Put on hold",                primary: false, app: ["Awaiting Inventory Check","Returned to Inventory","Ready for Dispatch","Sent to Production","In Production"], ns: "On Hold", no: null, hf: null },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getPriority(tags = []) {
  const t = (tags || []).map(s => s.toLowerCase());
  if (t.includes("priority:high") || t.includes("urgent")) return "High";
  if (t.includes("priority:low")) return "Low";
  return "Medium";
}
function getAging(createdAt) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
}
function formatPayment(status) {
  if (!status) return "N/A";
  const map = {
    PAID: "Paid", PENDING: "Payment pending", AUTHORIZED: "Authorized",
    PARTIALLY_PAID: "Partially paid", REFUNDED: "Refunded", VOIDED: "Voided",
  };
  return map[status] || status.split("_").map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function getAvailBulk(ids, orders) {
  const sel = orders.filter(o => ids.includes(o.shopifyId));
  const ss  = [...new Set(sel.map(o => o.status))];
  return BULK_DEFS.filter(d => ss.every(s => d.app.includes(s)));
}
function getSingleActions(o) {
  switch (o.status) {
    case "Awaiting Inventory Check": return [
      { l: "Stock available → dispatch", p: true,  ns: "Ready for Dispatch",    no: "Dispatch - Queue",   hf: { from: "Inventory", to: "Dispatch" } },
      { l: "Send to production",         p: false, ns: "Sent to Production",    no: "Production - Queue", hf: { from: "Inventory", to: "Production" } },
      { l: "Put on hold",                p: false, ns: "On Hold",               no: null,                 hf: null },
    ];
    case "Sent to Production":    return [{ l: "Mark in production",       p: true, ns: "In Production",         no: null,                hf: { from: "Queue",      to: "Artisan" } }];
    case "In Production":         return [{ l: "Mark production complete", p: true, ns: "Production Complete",   no: null,                hf: { from: "Production", to: "QC" } }];
    case "Production Complete":   return [{ l: "Return to inventory",      p: true, ns: "Returned to Inventory", no: "Inventory - Queue", hf: { from: "Production", to: "Inventory" } }];
    case "Returned to Inventory": return [{ l: "Ready for dispatch",       p: true, ns: "Ready for Dispatch",    no: "Dispatch - Queue",  hf: { from: "Inventory",  to: "Dispatch" } }];
    case "Ready for Dispatch":    return [{ l: "Mark dispatched",          p: true, ns: "Dispatched",            no: "Courier",           hf: { from: "Dispatch",   to: "Courier" } }];
    case "On Hold":               return [{ l: "Resume — inventory check", p: true, ns: "Awaiting Inventory Check", no: "Inventory - Queue", hf: null }];
    default: return [];
  }
}

// ── LOADER ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  let rawOrders = [], ordersError = null;
  try {
    let cursor = null, hasNext = true;
    while (hasNext) {
      const resp = await admin.graphql(`
        query($cursor: String) {
          orders(first: 250, after: $cursor, sortKey: CREATED_AT, reverse: true) {
            pageInfo { hasNextPage endCursor }
            edges { node {
              id name createdAt displayFinancialStatus displayFulfillmentStatus
              totalPriceSet { shopMoney { amount currencyCode } }
              customer { firstName lastName email }
              lineItems(first: 5) { edges { node { title sku quantity image { url } } } }
              tags note
            }}
          }
        }
      `, { variables: { cursor } });
      const json = await resp.json();
      // GraphQL errors come back as 200 with { errors: [...] } — must check explicitly
      if (json.errors?.length) {
        throw new Error(json.errors.map(e => e.message).join(" | "));
      }
      const page = json.data?.orders;
      if (!page) break;
      rawOrders = rawOrders.concat(page.edges?.map(e => e.node) || []);
      hasNext = page.pageInfo?.hasNextPage || false;
      cursor  = page.pageInfo?.endCursor || null;
    }
  } catch (err) {
    ordersError = err.message || "Orders unavailable";
    // Fallback: try fetching orders without customer fields
    try {
      let cursor = null, hasNext = true;
      while (hasNext) {
        const resp = await admin.graphql(`
          query($cursor: String) {
            orders(first: 250, after: $cursor, sortKey: CREATED_AT, reverse: true) {
              pageInfo { hasNextPage endCursor }
              edges { node {
                id name createdAt displayFinancialStatus displayFulfillmentStatus
                totalPriceSet { shopMoney { amount currencyCode } }
                lineItems(first: 5) { edges { node { title sku quantity image { url } } } }
                tags note
              }}
            }
          }
        `, { variables: { cursor } });
        const json = await resp.json();
        if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join(" | "));
        const page = json.data?.orders;
        if (!page) break;
        rawOrders = rawOrders.concat(page.edges?.map(e => e.node) || []);
        hasNext = page.pageInfo?.hasNextPage || false;
        cursor  = page.pageInfo?.endCursor || null;
      }
      ordersError = null; // fallback succeeded, clear the error
    } catch (fallbackErr) {
      ordersError = err.message; // keep original error
    }
  }

  const orderIds = rawOrders.map(o => o.id);
  const localStates = orderIds.length
    ? await prisma.orderWorkflow.findMany({ where: { id: { in: orderIds } } })
    : [];

  const orders = rawOrders.map(o => {
    const state = localStates.find(s => s.id === o.id);
    const li0   = o.lineItems.edges[0]?.node;
    return {
      shopifyId: o.id,
      id: o.name,
      customer: o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.trim() : "Guest",
      item: li0?.title || "—",
      sku: li0?.sku || "—",
      qty: li0?.quantity || 1,
      imageUrl: li0?.image?.url || null,
      orderDate: fmtDate(o.createdAt),
      createdAt: o.createdAt,
      priority: getPriority(o.tags || []),
      status: state?.status || "Awaiting Inventory Check",
      owner: state?.owner || "Inventory - Queue",
      handoffs: JSON.parse(state?.handoffs || "[]"),
      aging: getAging(o.createdAt),
      note: state?.note || "",
      shopifyNote: o.note || "",
      paymentStatus: formatPayment(o.displayFinancialStatus),
    };
  });

  return { orders, ordersError };
};

// ── ACTION ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  await authenticate.admin(request);
  const fd = await request.formData();
  const actionType = fd.get("actionType");

  if (actionType === "updateWorkflow") {
    const orderId = fd.get("orderId");
    const status  = fd.get("status");
    const note    = fd.get("note") || undefined;
    const owner   = fd.get("owner") || undefined;
    const hfFrom  = fd.get("hfFrom");
    const hfTo    = fd.get("hfTo");
    const existing = await prisma.orderWorkflow.findUnique({ where: { id: orderId } });
    const handoffs = JSON.parse(existing?.handoffs || "[]");
    if (status && status !== existing?.status) {
      handoffs.push({ from: hfFrom || existing?.status || "Initial", to: hfTo || status, at: new Date().toISOString() });
    }
    await prisma.orderWorkflow.upsert({
      where: { id: orderId },
      update: { status, ...(note !== undefined ? { note } : {}), ...(owner ? { owner } : {}), handoffs: JSON.stringify(handoffs) },
      create: { id: orderId, status, note: note || "", owner: owner || "Inventory - Queue", handoffs: JSON.stringify(handoffs) },
    });
    return { success: true };
  }

  if (actionType === "bulkUpdate") {
    const ids    = JSON.parse(fd.get("ids") || "[]");
    const status = fd.get("status");
    const owner  = fd.get("owner") || null;
    const hfFrom = fd.get("hfFrom");
    const hfTo   = fd.get("hfTo");
    for (const id of ids) {
      const existing = await prisma.orderWorkflow.findUnique({ where: { id } });
      const handoffs = JSON.parse(existing?.handoffs || "[]");
      handoffs.push({ from: hfFrom || existing?.status || "Initial", to: hfTo || status, at: new Date().toISOString() });
      const update = { status, handoffs: JSON.stringify(handoffs) };
      if (owner) update.owner = owner;
      await prisma.orderWorkflow.upsert({
        where: { id },
        update,
        create: { id, status, owner: owner || "Inventory - Queue", handoffs: JSON.stringify(handoffs) },
      });
    }
    return { success: true };
  }

  if (actionType === "resetOrder") {
    const orderId = fd.get("orderId");
    await prisma.orderWorkflow.upsert({
      where: { id: orderId },
      update: { status: "Awaiting Inventory Check", owner: "Inventory - Queue", note: "", handoffs: JSON.stringify([{ from: "Reset", to: "Inventory", at: new Date().toISOString() }]) },
      create: { id: orderId, status: "Awaiting Inventory Check", owner: "Inventory - Queue", handoffs: JSON.stringify([]) },
    });
    return { success: true };
  }

  if (actionType === "saveNote") {
    const orderId = fd.get("orderId");
    const note    = fd.get("note") || "";
    await prisma.orderWorkflow.upsert({
      where: { id: orderId },
      update: { note },
      create: { id: orderId, note, status: "Awaiting Inventory Check", owner: "Inventory - Queue", handoffs: "[]" },
    });
    return { success: true };
  }

  return { success: false };
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function OrderWorkflowPage() {
  const { orders: loadedOrders, ordersError } = useLoaderData();
  const submit     = useSubmit();
  const navigation = useNavigation();

  // ── local state for optimistic UI ─────────────────────────────────────────
  const [orders, setOrders] = useState(loadedOrders);
  useEffect(() => { setOrders(loadedOrders); }, [loadedOrders]);

  const [role,         setRole]         = useState("admin");
  const [query,        setQuery]        = useState("");
  const [statusF,      setStatusF]      = useState("all");
  const [priorityF,    setPriorityF]    = useState("all");
  const [payF,         setPayF]         = useState("all");
  const [activeSKU,    setActiveSKU]    = useState(null);
  const [skuF,         setSkuF]         = useState("all");
  const [selectedIds,  setSelectedIds]  = useState(new Set());
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selected,     setSelected]     = useState(null);
  const [modalNote,    setModalNote]    = useState("");
  const [pendingBulk,  setPendingBulk]  = useState(null);

  // ── derived ───────────────────────────────────────────────────────────────
  const visible = useMemo(() => {
    return orders.filter(o => {
      if (!roleFilter[role](o)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (![o.id, o.customer, o.item, o.sku, o.shopifyId].join(" ").toLowerCase().includes(q)) return false;
      }
      if (statusF !== "all" && o.status !== statusF) return false;
      if (priorityF !== "all" && o.priority !== priorityF) return false;
      if (payF !== "all" && o.paymentStatus !== payF) return false;
      if (activeSKU && o.sku !== activeSKU) return false;
      if (role === "production" && skuF !== "all") {
        if (skuF === "queued" && o.status !== "Sent to Production") return false;
        if (skuF === "active" && o.status !== "In Production") return false;
      }
      return true;
    }).sort((a, b) => {
      const n = s => parseInt(String(s).replace(/\D/g, "")) || 0;
      return n(b.shopifyId) - n(a.shopifyId);
    });
  }, [orders, role, query, statusF, priorityF, payF, activeSKU, skuF]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const prodSKUs = useMemo(() => {
    const map = {};
    orders.filter(o => PROD_STATUSES.includes(o.status)).forEach(o => {
      if (!map[o.sku]) map[o.sku] = { sku: o.sku, item: o.item, totalQty: 0, n: 0, ss: {}, imageUrl: o.imageUrl };
      map[o.sku].totalQty += o.qty;
      map[o.sku].n++;
      map[o.sku].ss[o.status] = (map[o.sku].ss[o.status] || 0) + o.qty;
    });
    return Object.values(map).sort((a, b) => b.totalQty - a.totalQty);
  }, [orders]);

  const delayed = visible.filter(o => o.aging >= 2);
  const selIdArr = [...selectedIds];
  const availBulk = getAvailBulk(selIdArr, orders);

  // ── actions ───────────────────────────────────────────────────────────────
  function submitUpdate(orderId, status, no, hf) {
    const fd = new FormData();
    fd.append("actionType", "updateWorkflow");
    fd.append("orderId", orderId);
    fd.append("status", status);
    if (no) fd.append("owner", no);
    if (hf) { fd.append("hfFrom", hf.from); fd.append("hfTo", hf.to); }
    submit(fd, { method: "POST" });
    // Optimistic update
    setOrders(prev => prev.map(o => o.shopifyId !== orderId ? o : {
      ...o, status,
      ...(no ? { owner: no } : {}),
      handoffs: [...o.handoffs, ...(hf ? [{ from: hf.from, to: hf.to, at: new Date().toISOString() }] : [])],
    }));
    if (selected?.shopifyId === orderId) setSelected(null);
  }

  function submitBulk(def, ids) {
    const fd = new FormData();
    fd.append("actionType", "bulkUpdate");
    fd.append("ids", JSON.stringify(ids));
    fd.append("status", def.ns);
    if (def.no) fd.append("owner", def.no);
    if (def.hf) { fd.append("hfFrom", def.hf.from); fd.append("hfTo", def.hf.to); }
    submit(fd, { method: "POST" });
    setOrders(prev => prev.map(o => !ids.includes(o.shopifyId) ? o : {
      ...o, status: def.ns,
      ...(def.no ? { owner: def.no } : {}),
      handoffs: [...o.handoffs, ...(def.hf ? [{ from: def.hf.from, to: def.hf.to, at: new Date().toISOString() }] : [])],
    }));
    setSelectedIds(new Set());
    setPendingBulk(null);
  }

  function submitReset(orderId) {
    if (!confirm("Reset this order to the beginning of the workflow?")) return;
    const fd = new FormData();
    fd.append("actionType", "resetOrder");
    fd.append("orderId", orderId);
    submit(fd, { method: "POST" });
    setOrders(prev => prev.map(o => o.shopifyId !== orderId ? o : {
      ...o, status: "Awaiting Inventory Check", owner: "Inventory - Queue", note: "", handoffs: [],
    }));
    setSelected(null);
  }

  function handleNoteSave(orderId, note) {
    const fd = new FormData();
    fd.append("actionType", "saveNote");
    fd.append("orderId", orderId);
    fd.append("note", note);
    submit(fd, { method: "POST" });
  }

  function downloadCSV() {
    const header = ["Order", "Shopify ID", "Customer", "Item", "SKU", "Qty", "Payment", "Priority", "Status", "Owner", "Aging", "Note"];
    const rows = visible.map(o => [
      o.id, o.shopifyId, o.customer, o.item, o.sku, o.qty,
      o.paymentStatus, o.priority, o.status, o.owner, o.aging, (o.note || "").replace(/,/g, " ")
    ].map(v => `"${v}"`).join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `unniyarcha-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── sub-renders ───────────────────────────────────────────────────────────
  function Thumb({ o, size = 38 }) {
    if (o?.imageUrl) return (
      <img src={o.imageUrl} className="prod-thumb" style={{ width: size, height: size }} alt={o.item}
        onError={e => { e.target.style.display = "none"; }} />
    );
    return <div className="prod-thumb-ph" style={{ width: size, height: size }}>◈</div>;
  }

  function StatsPanel() {
    const inv  = visible.filter(o => o.status === "Awaiting Inventory Check").length;
    const prod = visible.filter(o => ["Sent to Production", "In Production"].includes(o.status)).length;
    const disp = visible.filter(o => o.status === "Ready for Dispatch").length;
    const q    = visible.filter(o => o.status === "Sent to Production").length;
    const a    = visible.filter(o => o.status === "In Production").length;
    const tq   = visible.reduce((s, o) => s + o.qty, 0);

    return (
      <div className="top-row">
        <div className="stats-grid">
          {role === "production" ? <>
            <div className="stat-card"><div className="stat-label">Total orders</div><div className="stat-num">{visible.length}</div></div>
            <div className="stat-card"><div className="stat-label">Total units</div><div className="stat-num">{tq}</div></div>
            <div className="stat-card" style={{ "--accent-line": STAT_LINES["Awaiting Inventory Check"] }}><div className="stat-label">Queued</div><div className="stat-num">{q}</div></div>
            <div className="stat-card" style={{ "--accent-line": STAT_LINES["In Production"] }}><div className="stat-label">In production</div><div className="stat-num">{a}</div></div>
            <div className="stat-card" style={{ "--accent-line": delayed.length > 0 ? STAT_LINES["On Hold"] : "#2A7A6A" }}><div className="stat-label">Delayed 2d+</div><div className={`stat-num${delayed.length > 0 ? " danger" : ""}`}>{delayed.length}</div></div>
          </> : <>
            <div className="stat-card"><div className="stat-label">Total orders</div><div className="stat-num">{visible.length}</div></div>
            <div className="stat-card" style={{ "--accent-line": STAT_LINES["Awaiting Inventory Check"] }}><div className="stat-label">Inventory check</div><div className="stat-num">{inv}</div></div>
            <div className="stat-card" style={{ "--accent-line": STAT_LINES["In Production"] }}><div className="stat-label">In production</div><div className="stat-num">{prod}</div></div>
            <div className="stat-card" style={{ "--accent-line": STAT_LINES["Ready for Dispatch"] }}><div className="stat-label">Ready to dispatch</div><div className="stat-num">{disp}</div></div>
            <div className="stat-card" style={{ "--accent-line": delayed.length > 0 ? STAT_LINES["On Hold"] : "#2A7A6A" }}><div className="stat-label">Delayed 2d+</div><div className={`stat-num${delayed.length > 0 ? " danger" : ""}`}>{delayed.length}</div></div>
          </>}
        </div>
        <div className="alerts-panel">
          <div className="alerts-panel-title">Alerts</div>
          {delayed.length === 0 ? (
            <div className="alerts-ok">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="#2A7A6A" strokeWidth="1.2" />
                <path d="M3.5 6l1.8 1.8L8.5 4" stroke="#2A7A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              No delayed orders
            </div>
          ) : delayed.map(o => (
            <div key={o.shopifyId} className="alert-item" onClick={() => { setSelected(o); setModalNote(o.note); }}>
              <Thumb o={o} size={32} />
              <div className="alert-info">
                <div className="alert-id">{o.id}</div>
                <div className="alert-status">{o.status}</div>
                <div className="alert-age">{o.aging}d pending</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function SKUBoard() {
    if (role !== "production") return null;
    const maxQ = Math.max(...prodSKUs.map(s => s.totalQty), 1);
    return (
      <div id="skuSection">
        <div className="sku-section">
          <div className="section-bar">
            <div className="section-title"><span className="title-pip" />SKU production queue</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div className="view-toggle">
                {["all", "queued", "active"].map(sf => (
                  <button key={sf} className={`vbtn${skuF === sf ? " active" : ""}`} onClick={() => { setSkuF(sf); setCurrentPage(1); }}>
                    {sf[0].toUpperCase() + sf.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="sku-grid">
            {prodSKUs.length === 0 ? (
              <div style={{ color: "var(--text-3)", fontSize: 12, gridColumn: "1/-1", padding: "12px 0" }}>No SKUs in production queue.</div>
            ) : prodSKUs.map(s => {
              const pct = Math.round((s.totalQty / maxQ) * 100);
              return (
                <div key={s.sku} className={`sku-card${activeSKU === s.sku ? " sku-active" : ""}`}
                  onClick={() => { setActiveSKU(activeSKU === s.sku ? null : s.sku); setCurrentPage(1); }}>
                  <div className="sku-img-wrap">
                    {s.imageUrl
                      ? <img className="sku-img" src={s.imageUrl} alt={s.item} loading="lazy" onError={e => { e.target.parentElement.innerHTML = '<div class="sku-img-ph">◈</div>'; }} />
                      : <div className="sku-img-ph">◈</div>}
                  </div>
                  <div className="sku-body">
                    <div className="sku-code">{s.sku}</div>
                    <div className="sku-name">{s.item}</div>
                    <div className="sku-big">{s.totalQty}</div>
                    <div className="sku-meta">units · {s.n} order{s.n !== 1 ? "s" : ""}</div>
                    <div className="sku-bar-bg"><div className={`sku-bar-fill${s.totalQty >= 3 ? " hot" : ""}`} style={{ width: pct + "%" }} /></div>
                    <div className="sku-chips">
                      {Object.entries(s.ss).map(([st, q]) => {
                        const c = STATUS_CHIP[st] || { cls: "b-slate", lbl: st };
                        return <span key={st} className={`schip ${c.cls}`}>{c.lbl}: {q}</span>;
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div className="section-title" style={{ fontSize: 12 }}>
            <span className="title-pip" />{activeSKU ? `Orders for ${activeSKU}` : "Production orders"}
          </div>
        </div>
      </div>
    );
  }

  function Pagination() {
    if (totalPages <= 1) return null;
    const start = (currentPage - 1) * PAGE_SIZE;
    const end   = Math.min(start + page.length, visible.length);
    const pages = [];
    for (let i = 1; i <= Math.min(7, totalPages); i++) {
      let p;
      if (totalPages <= 7) p = i;
      else if (currentPage <= 4) p = i;
      else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
      else p = currentPage - 3 + i;
      if (p >= 1 && p <= totalPages) pages.push(p);
    }
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-2)", flexWrap: "wrap", gap: 8 }}>
        <span>Showing {start + 1}–{end} of {visible.length} orders</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="pg-btn">«</button>
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="pg-btn">‹</button>
          {pages.map(p => (
            <button key={p} onClick={() => setCurrentPage(p)} className={`pg-btn${p === currentPage ? " pg-active" : ""}`}>{p}</button>
          ))}
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="pg-btn">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="pg-btn">»</button>
        </div>
      </div>
    );
  }

  function OrderModal() {
    const o = selected;
    if (!o) return null;
    const actions = getSingleActions(o);
    return (
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
        <div className="modal">
          <div className="modal-header">
            <div>
              <div className="modal-title">{o.id} — {o.item}</div>
              <div className="modal-meta">{o.customer} · {o.shopifyId} · {o.orderDate}</div>
            </div>
            <button className="modal-x" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="modal-body">
            {o.imageUrl
              ? <img src={o.imageUrl} className="modal-product-img" alt={o.item} onError={e => { e.target.style.display = "none"; }} />
              : <div className="modal-product-ph">◈</div>}
            <div className="modal-grid">
              <div><div className="mfield-lbl">SKU</div><div className="mfield-val" style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{o.sku}</div></div>
              <div><div className="mfield-lbl">Quantity</div><div className="mfield-val">{o.qty}</div></div>
              <div><div className="mfield-lbl">Payment</div><div className="mfield-val"><span className={`badge ${STATUS_BADGE[o.paymentStatus] || "b-slate"}`}>{o.paymentStatus}</span></div></div>
              <div><div className="mfield-lbl">Status</div><div className="mfield-val"><span className={`badge ${STATUS_BADGE[o.status] || "b-slate"}`}>{o.status}</span></div></div>
              {o.shopifyNote && (
                <div style={{ gridColumn: "1/-1", background: "var(--surface-2)", padding: 10, borderRadius: 8, border: "1px dashed var(--border-strong)" }}>
                  <div className="mfield-lbl" style={{ color: "var(--text-2)", fontWeight: 600 }}>Shopify Note</div>
                  <div className="mfield-val" style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.5, fontStyle: "italic" }}>"{o.shopifyNote}"</div>
                </div>
              )}
              <div><div className="mfield-lbl">Aging</div><div className={`mfield-val${o.aging >= 2 ? " age-warn" : ""}`}>{o.aging} day{o.aging !== 1 ? "s" : ""}</div></div>
            </div>
            <div className="handoff-wrap">
              <div className="section-lbl">Handoff timeline</div>
              {o.handoffs.length === 0
                ? <div style={{ fontSize: 12, color: "var(--text-3)" }}>No handoffs yet.</div>
                : o.handoffs.map((h, i) => (
                  <div key={i} className="handoff-row">
                    <span className="h-from">{h.from}</span>
                    <span className="h-arrow">→</span>
                    <span className="h-to">{h.to}</span>
                    <span className="h-time">{new Date(h.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
            </div>
            <div>
              <div className="section-lbl">Internal note</div>
              <textarea className="note-area" value={modalNote}
                onChange={e => setModalNote(e.target.value)}
                onBlur={() => handleNoteSave(o.shopifyId, modalNote)}
                placeholder="Add a note for this order…" />
            </div>
          </div>
          <div className="modal-actions">
            {actions.map((a, i) => (
              <button key={i} className={`btn${a.p ? " btn-primary" : ""}`}
                onClick={() => { submitUpdate(o.shopifyId, a.ns, a.no, a.hf); setSelected(null); }}>
                {a.l}
              </button>
            ))}
            <button className="btn btn-ghost" onClick={() => submitReset(o.shopifyId)}>Reset Workflow</button>
            <button className="btn btn-ghost ml-auto" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  function BulkModal() {
    if (!pendingBulk) return null;
    const { def, ids } = pendingBulk;
    const sel = orders.filter(o => ids.includes(o.shopifyId));
    return (
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPendingBulk(null); }}>
        <div className="modal" style={{ maxWidth: 460 }}>
          <div className="modal-header">
            <div>
              <div className="modal-title">{def.label}</div>
              <div className="modal-meta">{sel.length} order{sel.length !== 1 ? "s" : ""} will be updated</div>
            </div>
            <button className="modal-x" onClick={() => setPendingBulk(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="section-lbl" style={{ marginBottom: 8 }}>Orders affected</div>
            <div className="bm-list">
              {sel.map(o => (
                <div key={o.shopifyId} className="bm-row">
                  <span className="bm-id">{o.id}</span>
                  <span className="bm-item">{o.item}</span>
                  <span className={`badge ${STATUS_BADGE[o.status] || "b-slate"}`} style={{ fontSize: 9, padding: "2px 6px" }}>{o.status}</span>
                </div>
              ))}
            </div>
            <div className="bm-desc">
              Status will change to <strong>{def.ns}</strong>.{def.no ? ` Owner: ${def.no}.` : ""}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => submitBulk(def, ids)}>Confirm update</button>
            <button className="btn btn-ghost ml-auto" onClick={() => setPendingBulk(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  const allPageSelected = page.length > 0 && page.every(o => selectedIds.has(o.shopifyId));
  const someSelected    = page.some(o => selectedIds.has(o.shopifyId));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="ord-header">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="5.5" r="2.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" />
              <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-name">Unniyarcha</div>
          <div className="brand-tag">order workflow</div>
        </div>

        <div className="header-mid">
          <div className="role-tabs">
            {ROLES.map(r => (
              <button key={r} className={`role-tab${r === role ? " active" : ""}`}
                onClick={() => { setRole(r); setActiveSKU(null); setSkuF("all"); setSelectedIds(new Set()); setCurrentPage(1); }}>
                {r[0].toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="header-right">
          <Link to="/app" className="back-btn">← Inventory</Link>
        </div>
      </header>

      <main className="ord-main">
        {ordersError && (
          <div style={{ background: "var(--gold-bg)", border: "1px solid var(--gold-border)", borderRadius: "var(--r-md)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--gold-text)" }}>
            <strong>⚠ Orders API error:</strong> {ordersError}
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--gold-text)", opacity: 0.8 }}>
              Fix: Partner Dashboard → Your App → Configuration → Protected customer data access → Request access. Then reinstall the app on your store.
            </div>
          </div>
        )}

        <StatsPanel />
        <SKUBoard />

        {activeSKU && (
          <div className="filter-bar">
            <span>Filtering by SKU: <strong>{activeSKU}</strong></span>
            <button className="filter-clear" onClick={() => { setActiveSKU(null); setCurrentPage(1); }}>Clear filter</button>
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="bulk-bar">
            <div className="bulk-count">{selectedIds.size} selected <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, fontSize: 12, marginLeft: 3 }}>order{selectedIds.size !== 1 ? "s" : ""}</span></div>
            <div className="bulk-btns">
              {availBulk.length === 0
                ? <span className="bulk-hint">No shared actions for mixed statuses</span>
                : availBulk.map((d, i) => (
                  <button key={i} className={`bbtn${i === 0 ? " primary" : ""}`}
                    onClick={() => setPendingBulk({ def: d, ids: selIdArr })}>
                    {d.label}
                  </button>
                ))}
            </div>
            <button className="bulk-x" onClick={() => setSelectedIds(new Set())}>✕</button>
          </div>
        )}

        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l2.5 2.5" />
            </svg>
            <input type="text" placeholder="Search orders, SKU, customer…" value={query}
              onChange={e => { setQuery(e.target.value); setCurrentPage(1); }} />
          </div>
          <select value={statusF} onChange={e => { setStatusF(e.target.value); setCurrentPage(1); }}>
            <option value="all">All statuses</option>
            {(role === "production" ? PROD_STATUSES : Object.keys(STATUS_BADGE)).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={priorityF} onChange={e => { setPriorityF(e.target.value); setCurrentPage(1); }}>
            <option value="all">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select value={payF} onChange={e => { setPayF(e.target.value); setCurrentPage(1); }}>
            <option value="all">All payments</option>
            <option value="Paid">Paid</option>
            <option value="Payment pending">Payment pending</option>
            <option value="Authorized">Authorized</option>
          </select>
          <button className="dl-btn" onClick={downloadCSV}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="13" height="13">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" />
            </svg>
            Export CSV
          </button>
        </div>

        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th className="th-chk">
                  <input type="checkbox" checked={allPageSelected}
                    ref={el => { if (el) el.indeterminate = !allPageSelected && someSelected; }}
                    onChange={e => {
                      const next = new Set(selectedIds);
                      if (e.target.checked) page.forEach(o => next.add(o.shopifyId));
                      else page.forEach(o => next.delete(o.shopifyId));
                      setSelectedIds(next);
                    }} />
                </th>
                <th></th>
                <th>Order</th><th>Payment</th><th>Customer</th><th>Item</th><th>SKU</th>
                <th>Qty</th><th>Priority</th><th>Status</th><th>Note</th><th>Aging</th>
              </tr>
            </thead>
            <tbody>
              {page.length === 0 ? (
                <tr><td colSpan={12}>
                  <div className="empty-state"><div className="empty-glyph">◎</div><div>No orders match the current filters</div></div>
                </td></tr>
              ) : page.map(o => (
                <tr key={o.shopifyId} className={selectedIds.has(o.shopifyId) ? "row-sel" : ""}
                  onClick={e => {
                    if (e.target.type === "checkbox") return;
                    if (selectedIds.size > 0) {
                      const next = new Set(selectedIds);
                      selectedIds.has(o.shopifyId) ? next.delete(o.shopifyId) : next.add(o.shopifyId);
                      setSelectedIds(next);
                      return;
                    }
                    setSelected(o); setModalNote(o.note);
                  }}>
                  <td className="td-chk">
                    <input type="checkbox" checked={selectedIds.has(o.shopifyId)}
                      onChange={e => {
                        e.stopPropagation();
                        const next = new Set(selectedIds);
                        e.target.checked ? next.add(o.shopifyId) : next.delete(o.shopifyId);
                        setSelectedIds(next);
                      }} />
                  </td>
                  <td style={{ padding: "8px 6px 8px 14px" }}>
                    <Thumb o={o} size={38} />
                  </td>
                  <td>
                    <div className="order-id">{o.id}</div>
                    <div className="order-sid">{o.shopifyId.replace("gid://shopify/Order/", "#")}</div>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[o.paymentStatus] || "b-slate"}`}>{o.paymentStatus}</span></td>
                  <td>{o.customer}</td>
                  <td><div className="item-n" title={o.item}>{o.item}</div></td>
                  <td><span className="sku-m">{o.sku}</span></td>
                  <td style={{ fontWeight: 500 }}>{o.qty}</td>
                  <td><span className={`badge ${PRI_BADGE[o.priority] || "b-slate"}`}>{o.priority}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[o.status] || "b-slate"}`}>{o.status}</span></td>
                  <td style={{ fontSize: 11, color: "var(--text-3)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o.shopifyNote || ""}>
                    {o.shopifyNote || "—"}
                  </td>
                  <td><span className={o.aging >= 2 ? "age-warn" : "age-ok"}>{o.aging}d</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination />
        </div>

        <div className="bottom-row">
          <div className="process-panel">
            <div className="panel-title">Process Rules</div>
            <div className="flow-diagram">
              {["Shopify", "Inventory", "Production", "Inventory", "Dispatch"].map((n, i, arr) => (
                <span key={i}>
                  <span className="flow-node">{n}</span>
                  {i < arr.length - 1 && <span className="flow-arrow">→</span>}
                </span>
              ))}
            </div>
            {[
              "Every Shopify order enters automatically and is assigned to Inventory for stock check.",
              "Inventory can mark stock available (→ Dispatch) or send the SKU to Production.",
              "Production cannot close the order directly — it must return to Inventory for QC and receipt.",
              "Only Inventory can approve an order as ready for dispatch after receiving the finished item.",
            ].map((txt, i) => (
              <div key={i} className="process-step">
                <div className="step-num">{i + 1}</div>
                <div className="step-text">{txt}</div>
              </div>
            ))}
          </div>
          <div className="info-panel">
            <div className="panel-title">Priority Tags</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 14 }}>
              Add these tags to Shopify orders to control priority:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge b-pri-h">High</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-3)" }}>priority:high &nbsp;or&nbsp; urgent</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge b-pri-m">Medium</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-3)" }}>default (no tag)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge b-pri-l">Low</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-3)" }}>priority:low</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selected && <OrderModal />}
      {pendingBulk && <BulkModal />}
    </>
  );
}

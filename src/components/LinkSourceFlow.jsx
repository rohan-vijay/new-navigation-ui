// prop-source-flows.jsx — Enterprise Property & Source wizards
// Design: one field per line · dropdowns for >3 options · no scattered grids

import React, { useState, useRef, useEffect, useMemo } from 'react';

// ─── STYLES ───────────────────────────────────────────────────────────────────
function FlowStyles() {
  useEffect(() => {
    const id = 'link-source-flow-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
/* Scope all flow variables to the overlay — warm earthy palette matching the rest of the app */
.flow-overlay {
  --bg: #FEFDFB;
  --bg-canvas: #F7F5F2;
  --panel: #ffffff;
  --panel-2: #faf8f4;
  --ink: #1a1a1a;
  --ink-2: #3a3a36;
  --ink-3: #9a917f;
  --ink-4: #c0b5a2;
  --line: #e8e2d8;
  --line-2: #f0ece6;
  --chip: #f0ece4;
  --green: #16341f;
  --green-soft: #b8d4bb;
  --green-fill: #eaf3eb;
  --blue: #2563eb;
  --blue-soft: #93c5fd;
  --blue-fill: #eff6ff;
  --purple: #7c3aed;
  --purple-soft: #c4b5fd;
  --purple-fill: #f5f3ff;
  --gold: #b07a16;
  --gold-soft: #e8c87a;
  --gold-fill: #faf5ea;
  --coral: #c0492f;
  --coral-soft: #e0a89c;
  --coral-fill: #fbf1ee;
}

.btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; border: 1px solid #e3ddd1; background: #fff; cursor: pointer; font-family: inherit; font-size: 12.5px; color: var(--ink-2); font-weight: 500; }
.btn-ghost:hover { background: var(--bg-canvas); color: var(--ink); border-color: var(--line); }
.btn-ghost .kbd { display: inline-flex; align-items: center; height: 18px; padding: 0 5px; border-radius: 4px; background: var(--chip); font-family: "JetBrains Mono", monospace; font-size: 10.5px; color: var(--ink-2); }
.btn-dark { padding: 9px 18px; border-radius: 8px; border: 0; background: #16341f; color: #fff; cursor: pointer; font-family: inherit; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; font-weight: 500; }
.btn-dark:hover { background: #1d4228; }
.btn-dark .plus { font-size: 14px; line-height: 1; }

.nv-change { font-family: "JetBrains Mono", monospace; font-size: 10px; letter-spacing: 0.7px; padding: 3px 8px; border-radius: 4px; border: 1px solid var(--line); background: var(--panel); color: var(--ink-2); }
.nv-change-high { color: var(--coral); border-color: color-mix(in oklab, var(--coral) 30%, var(--line)); background: var(--coral-fill); }
.nv-change-medium { color: var(--gold); border-color: color-mix(in oklab, var(--gold) 30%, var(--line)); background: var(--gold-fill); }
.nv-change-low { color: var(--ink-3); }

.card { background: var(--panel); border: 1px solid #e8e2d8; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(40,32,18,0.06); }
.card-head { padding: 14px 18px; border-bottom: 1px solid var(--line-2); font-size: 13.5px; font-weight: 600; display: flex; align-items: baseline; gap: 8px; }
.card-head-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.card-head-sub { font-size: 11.5px; color: var(--ink-3); font-weight: 400; font-family: "JetBrains Mono", monospace; letter-spacing: 0.2px; }
.card-head-actions { display: flex; gap: 6px; }
.card-body { padding: 16px 18px; }

.snap-tag { font-family: "JetBrains Mono", monospace; font-size: 9px; padding: 1px 4px; border-radius: 3px; background: var(--chip); color: var(--ink-2); letter-spacing: 0.4px; text-transform: uppercase; }
.snap-pk   { background: var(--ink); color: var(--bg-canvas); }
.snap-pii  { background: var(--coral-fill); color: var(--coral); }
.snap-idx  { background: var(--blue-fill); color: var(--blue); }
.snap-comp { background: var(--purple-fill); color: var(--purple); }

.flow-overlay { position: fixed; inset: 0; background: rgba(28,24,18,0.42); backdrop-filter: blur(2px); z-index: 300; display: grid; place-items: center; padding: 28px; animation: flow-fade-in 160ms ease-out; }
@keyframes flow-fade-in { from { opacity: 0; } to { opacity: 1; } }
.flow-shell { position: relative; background: var(--bg); border: 1px solid #ece5d7; border-radius: 14px; width: 100%; max-width: 1480px; height: 100%; max-height: 920px; display: flex; flex-direction: column; box-shadow: 0 28px 80px rgba(40,32,18,0.32); overflow: hidden; animation: flow-zoom-in 180ms cubic-bezier(.2,.8,.2,1); }
.flow-overlay.flow-overlay-full { padding: 0; }
.flow-overlay-full .flow-shell { max-width: none; max-height: none; width: 100vw; height: 100vh; border: none; border-radius: 0; box-shadow: none; }
@keyframes flow-zoom-in { from { transform: translateY(8px) scale(0.99); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

.flow-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: var(--panel-2); border-bottom: 1px solid var(--line); flex-shrink: 0; }
.flow-title { font-family: Lora, serif; font-size: 22px; line-height: 1.15; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.flow-title-from, .flow-title-to { display: inline-flex; align-items: center; gap: 6px; font-family: system-ui, sans-serif; font-size: 14px; padding: 4px 10px; background: var(--bg-canvas); border: 1px solid var(--line); border-radius: 999px; }
.flow-title-empty { color: var(--ink-4); font-style: italic; }
.flow-title-arrow { color: var(--ink-3); font-family: "JetBrains Mono", monospace; font-size: 16px; }
.flow-title-label { font-family: "JetBrains Mono", monospace; font-size: 13px; padding: 3px 8px; background: var(--ink); color: var(--bg-canvas); border-radius: 5px; }
.flow-head-right { display: flex; align-items: center; gap: 10px; }

.flow-body { flex: 1; display: grid; grid-template-columns: 240px minmax(0, 1fr) 320px; min-height: 0; }
.flow-steps { background: var(--panel-2); border-right: 1px solid var(--line-2); padding: 22px 20px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
.flow-step { display: flex; gap: 12px; padding: 10px 12px; border-radius: 8px; border: 1px solid transparent; background: transparent; cursor: pointer; font-family: inherit; text-align: left; }
.flow-step:hover { background: #f3f0eb; border-color: #d8cfbb; }
.flow-step.on { background: #edeae4; border: 1px solid #c8baa8; box-shadow: 0 1px 4px rgba(40,32,18,0.07); }
.flow-step.done .flow-step-n { background: #1a7a40; color: #fff; border-color: #1a7a40; }
.flow-step.on .flow-step-n { background: #6b6b5e; color: #fff; border-color: #6b6b5e; }
.flow-step-n { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--line); display: grid; place-items: center; font-family: "JetBrains Mono", monospace; font-size: 12px; font-weight: 700; color: var(--ink-3); background: var(--panel); flex-shrink: 0; transition: background 120ms, border-color 120ms; }
.flow-step-text { min-width: 0; }
.flow-step-label { font-size: 13.5px; color: var(--ink); font-weight: 500; line-height: 1.1; }
.flow-step-hint { font-family: "JetBrains Mono", monospace; font-size: 10.5px; color: var(--ink-3); margin-top: 3px; line-height: 1.3; }
.flow-steps-foot { margin-top: auto; padding-top: 16px; border-top: 1px dashed var(--line-2); }

.flow-main { padding: 28px 36px; overflow-y: auto; }
.flow-main::-webkit-scrollbar { width: 10px; }
.flow-main::-webkit-scrollbar-thumb { background: var(--line); border-radius: 5px; }

.flow-preview { background: var(--panel-2); border-left: 1px solid var(--line); padding: 20px 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; }

.flow-foot { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: var(--panel-2); border-top: 1px solid var(--line); flex-shrink: 0; }
.flow-foot-left, .flow-foot-right { display: flex; align-items: center; gap: 10px; }
.flow-foot-help { font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--ink-3); }
.flow-foot-help b { color: var(--ink-2); font-weight: 500; }

.seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--chip); border-radius: 8px; align-self: flex-start; }
.seg-opt { padding: 5px 12px; border-radius: 5px; border: 0; background: transparent; cursor: pointer; font-family: inherit; font-size: 12.5px; color: var(--ink-2); white-space: nowrap; }
.seg-opt:hover { color: var(--ink); }
.seg-opt.on { background: var(--panel); color: var(--ink); box-shadow: 0 1px 0 var(--line), 0 1px 3px rgba(0,0,0,0.05); font-weight: 500; }
.seg-risk .seg-opt.on.risk-low  { background: var(--green-fill); color: var(--green); }
.seg-risk .seg-opt.on.risk-med  { background: var(--gold-fill);  color: var(--gold); }
.seg-risk .seg-opt.on.risk-high { background: var(--coral-fill); color: var(--coral); }

.switch { position: relative; display: inline-block; width: 32px; height: 18px; cursor: pointer; }
.switch input { opacity: 0; width: 0; height: 0; }
.switch-track { position: absolute; inset: 0; background: var(--line); border-radius: 999px; transition: background 120ms; }
.switch-track::before { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: var(--panel); border-radius: 50%; transition: transform 120ms; box-shadow: 0 1px 2px rgba(0,0,0,0.15); }
.switch input:checked ~ .switch-track { background: #16341f; }
.switch input:checked ~ .switch-track::before { transform: translateX(14px); }

.review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.rev-list { list-style: none; padding: 8px 18px 14px; margin: 0; display: flex; flex-direction: column; gap: 2px; }
.rev-list li { display: flex; justify-content: space-between; align-items: baseline; padding: 7px 0; border-bottom: 1px dashed var(--line-2); font-size: 12.5px; gap: 12px; }
.rev-list li:last-child { border-bottom: 0; }
.rev-k { color: var(--ink-3); font-family: "JetBrains Mono", monospace; font-size: 10.5px; letter-spacing: 0.4px; text-transform: uppercase; flex-shrink: 0; }
.rev-v { color: var(--ink); text-align: right; }
.rev-v code { background: var(--chip); padding: 2px 6px; border-radius: 4px; font-family: "JetBrains Mono", monospace; font-size: 11.5px; }

.approver-list { list-style: none; padding: 6px 18px 14px; margin: 0; }
.approver-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px dashed var(--line-2); }
.approver-row:last-child { border-bottom: 0; }
.appr-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--ink); color: var(--bg-canvas); display: grid; place-items: center; font-family: "JetBrains Mono", monospace; font-size: 12px; font-weight: 500; }
.appr-who { font-size: 12.5px; color: var(--ink); }
.appr-team { font-family: "JetBrains Mono", monospace; font-size: 10.5px; color: var(--ink-3); margin-top: 2px; }
.appr-status { margin-left: auto; font-family: "JetBrains Mono", monospace; font-size: 10px; padding: 3px 8px; background: var(--gold-fill); color: var(--gold); border-radius: 4px; letter-spacing: 0.4px; text-transform: uppercase; }

.cypher-block { margin: 0; padding: 16px 18px; font-family: "JetBrains Mono", monospace; font-size: 11.5px; line-height: 1.55; background: #1f211b; color: #e7e2cf; overflow-x: auto; max-height: 320px; white-space: pre; }

.preview-stack { display: flex; flex-direction: column; gap: 16px; }
.preview-block { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.preview-head { padding: 10px 14px; font-family: "JetBrains Mono", monospace; font-size: 10.5px; letter-spacing: 0.6px; color: var(--ink-3); text-transform: uppercase; border-bottom: 1px solid var(--line-2); background: var(--panel-2); }
.preview-code { margin: 0; padding: 12px 14px; font-family: "JetBrains Mono", monospace; font-size: 11px; line-height: 1.55; color: var(--ink-2); background: var(--bg-canvas); white-space: pre; overflow-x: auto; }
.preview-checks { list-style: none; padding: 8px 14px 12px; margin: 0; display: flex; flex-direction: column; gap: 6px; }

.ppc-type { font-family: "JetBrains Mono", monospace; font-size: 11px; padding: 2px 6px; background: var(--blue-fill); color: var(--blue); border-radius: 4px; }

.wstep { display: flex; flex-direction: column; max-width: 760px; }
.wstep.wstep-wide { max-width: none; }
.wstep.wstep-wide .wstep-body { border-top: none; padding-top: 0; }
.wstep-head { padding-bottom: 20px; }
.wstep-title { font-family: Lora, serif; font-size: 32px; line-height: 1.1; margin: 8px 0 10px; letter-spacing: -0.3px; }
.wstep-desc { font-size: 13.5px; color: var(--ink-2); line-height: 1.55; max-width: 600px; }
.wstep-body { border-top: 1px solid var(--line-2); }

.wfr { padding: 18px 0; border-bottom: 1px solid var(--line-2); }
.wfr.wfr-last { border-bottom: 0; }
.wfr-label { font-family: "JetBrains Mono", monospace; font-size: 10.5px; letter-spacing: 0.8px; text-transform: uppercase; color: var(--ink-3); display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.wfr-req { color: var(--coral); font-size: 9.5px; letter-spacing: 0.5px; }
.wfr-opt { color: var(--ink-4); font-size: 9.5px; letter-spacing: 0.5px; }
.wfr-hint { font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--ink-4); margin-top: 8px; line-height: 1.4; }
.wfr-prefix-input { display: flex; align-items: stretch; }
.wfr-prefix { background: var(--chip); border: 1px solid var(--line); padding: 0 12px; display: flex; align-items: center; font-family: "JetBrains Mono", monospace; color: var(--ink-3); font-size: 16px; border-radius: 8px 0 0 8px; border-right: 0; flex-shrink: 0; }
.wfr-suffix { border-radius: 0 8px 8px 0 !important; border-left: 0 !important; }
.wfr-prefix-input .winput { border-radius: 0 8px 8px 0; flex: 1; }

.winput { border: 1px solid #d8cfbb; background: var(--panel); border-radius: 8px; padding: 10px 12px; font-family: inherit; font-size: 14px; color: var(--ink); outline: none; width: 100%; transition: border-color 80ms; box-sizing: border-box; box-shadow: inset 0 1px 0 rgba(255,255,255,0.7); }
.winput:focus { border-color: #b8a48a; background: var(--panel); }
.winput::placeholder { color: var(--ink-4); }
.winput-mono { font-family: "JetBrains Mono", monospace; font-size: 13px; }
.winput-xl { font-size: 18px; padding: 12px 14px; }
.winput-code { font-family: "JetBrains Mono", monospace; font-size: 12px; line-height: 1.6; resize: vertical; background: var(--bg-canvas); }
.winput-textarea { font-family: inherit; font-size: 14px; line-height: 1.5; resize: vertical; }
.winput-err { border-color: var(--coral) !important; }

.csel { position: relative; width: 100%; }
.csel-trigger { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #d8cfbb; border-radius: 8px; background: var(--panel); cursor: pointer; font-family: inherit; font-size: 14px; text-align: left; transition: border-color 80ms; box-shadow: inset 0 1px 0 rgba(255,255,255,0.7); }
.csel-trigger:hover, .csel-trigger.open { border-color: #b8a48a; background: var(--panel); }
.csel-chevron { color: var(--ink-3); flex-shrink: 0; transition: transform 150ms; }
.csel-chevron.up { transform: rotate(180deg); }
.csel-val { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; overflow: hidden; }
.csel-ph { color: var(--ink-4); font-size: 14px; }
.csel-val-sub { font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.csel-code { font-family: "JetBrains Mono", monospace; font-size: 13px; color: var(--ink); background: var(--chip); padding: 1px 6px; border-radius: 3px; flex-shrink: 0; }
.csel-menu { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--panel); border: 1px solid #e8e2d8; border-radius: 10px; box-shadow: 0 10px 36px rgba(40,32,18,0.18); z-index: 500; max-height: 320px; overflow-y: auto; padding: 4px; }
.csel.csel-auto { width: auto; display: inline-block; }
.csel-auto .csel-trigger { width: auto; }
.csel-auto .csel-val { flex: 0 1 auto; }
.csel-auto .csel-menu { right: auto; min-width: 100%; white-space: nowrap; }
.csel-menu-right .csel-menu { left: auto; right: 0; }
.csel-compact .csel-trigger { height: 32px; padding: 0 12px; font-size: 12.5px; }
.csel-dense .csel-trigger { padding: 7px 10px; }
.csel-btnlabel .csel-menu { min-width: 256px; }
.csel-btnlabel .csel-ph { color: var(--ink-2); font-size: 12.5px; }
.csel-btnlabel .csel-chevron { display: none; }
.csel-textlink .csel-trigger { border: none; background: none; padding: 0; height: auto; gap: 4px; }
.csel-textlink .csel-trigger:hover, .csel-textlink .csel-trigger.open { border: none; background: none; }
.csel-textlink .csel-ph { color: var(--ink-2); font-size: 12px; }
.csel-textlink .csel-trigger:hover .csel-ph { color: var(--ink); }
.csel-search { display: flex; align-items: center; gap: 8px; padding: 7px 10px; margin-bottom: 4px; border-bottom: 1px solid var(--line-2); color: var(--ink-3); }
.csel-search input { flex: 1; min-width: 0; border: none; outline: none; background: none; font-family: inherit; font-size: 13px; color: var(--ink); }
.csel-search input::placeholder { color: var(--ink-4); }
.csel-group { font-family: "JetBrains Mono", monospace; font-size: 9.5px; letter-spacing: 0.8px; text-transform: uppercase; color: var(--ink-4); padding: 8px 10px 4px; }
.csel-opt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border: 0; background: transparent; cursor: pointer; font-family: inherit; font-size: 13.5px; text-align: left; border-radius: 6px; }
.csel-opt:hover { background: var(--chip); }
.csel-opt.on { background: var(--chip); }
.csel-opt-label { font-size: 13.5px; color: var(--ink); flex-shrink: 0; }
.csel-opt-sub { font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--ink-3); flex: 1; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
.csel-tick { color: var(--green); flex-shrink: 0; margin-left: auto; }
.csel-sys-val { display: flex; align-items: center; gap: 8px; flex: 1; }
.csel-sys-icon { width: 22px; height: 22px; border-radius: 5px; display: inline-grid; place-items: center; font-weight: 700; font-size: 11px; flex-shrink: 0; }
.csel-sys-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-left: auto; }
.csel-sys-dot.healthy { background: var(--green); }
.csel-sys-dot.degraded { background: var(--gold); }
.csel-sys-dot.custom { background: var(--ink-4); }
.csel-sys-tag { margin-left: 0; }

.wrl { display: flex; flex-direction: column; gap: 2px; }
.wrl-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border: 1px solid #e3ddd1; border-radius: 8px; background: var(--panel); cursor: pointer; font-family: inherit; text-align: left; transition: border-color 80ms, background 80ms; width: 100%; box-shadow: inset 0 1px 0 rgba(255,255,255,0.8); }
.wrl-item:hover { background: var(--bg-canvas); border-color: var(--line); }
.wrl-item.on { border-color: #b8a48a; background: var(--bg-canvas); box-shadow: none; }
.wrl-radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--line); flex-shrink: 0; margin-top: 2px; transition: border-color 80ms, border-width 80ms; }
.wrl-radio.on { border: 5px solid #16341f; }  /* brand dark green dot — intentional */
.wrl-body { flex: 1; min-width: 0; }
.wrl-label { font-size: 13.5px; font-weight: 500; color: var(--ink); display: flex; align-items: center; gap: 8px; }
.wrl-tag { font-family: "JetBrains Mono", monospace; font-size: 9.5px; padding: 1px 6px; border-radius: 3px; letter-spacing: 0.4px; }
.wrl-tag-direct    { background: var(--blue-fill);   color: var(--blue); }
.wrl-tag-computed  { background: var(--gold-fill);   color: var(--gold); }
.wrl-tag-agent     { background: var(--purple-fill); color: var(--purple); }
.wrl-tag-constant  { background: var(--green-fill);  color: var(--green); }
.wrl-tag-incremental { background: var(--blue-fill);  color: var(--blue); }
.wrl-tag-cdc       { background: var(--purple-fill); color: var(--purple); }
.wrl-tag-full      { background: var(--chip);        color: var(--ink-2); }
.wrl-desc { font-size: 12px; color: var(--ink-3); margin-top: 3px; line-height: 1.4; font-family: "JetBrains Mono", monospace; }

.wmt { position: relative; width: 100%; }
.wmt-field { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); cursor: pointer; min-height: 44px; transition: border-color 80ms; }
.wmt-field:hover, .wmt-field.open { border-color: #b8a48a; background: var(--bg-canvas); }
.wmt-token { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; background: var(--chip); border: 1px solid var(--line); border-radius: 4px; font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--ink); }
.wmt-x { background: transparent; border: 0; cursor: pointer; color: var(--ink-3); font-size: 14px; padding: 0; line-height: 1; }
.wmt-x:hover { color: var(--coral); }
.wmt-ph { font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--ink-4); }
.wmt-menu { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.10); z-index: 500; padding: 8px; display: flex; flex-wrap: wrap; gap: 4px; }
.wmt-opt { padding: 5px 10px; border: 1px solid var(--line); border-radius: 5px; background: var(--bg-canvas); cursor: pointer; font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--ink-2); }
.wmt-opt:hover { background: var(--chip); color: var(--ink); }

.wflag-row { display: flex; gap: 6px; flex-wrap: wrap; }
.wflag { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 7px; background: var(--panel); cursor: pointer; font-size: 13px; color: var(--ink-2); user-select: none; }
.wflag:hover { background: var(--bg-canvas); }
.wflag.on { background: var(--bg-canvas); border-color: #b8a48a; color: var(--ink); font-weight: 500; }
.wflag input { accent-color: #16341f; }

.wslider { display: flex; align-items: center; gap: 14px; }
.wslider-input { flex: 1; accent-color: #16341f; height: 4px; }
.wslider-val { font-family: "JetBrains Mono", monospace; font-size: 13px; color: var(--ink); min-width: 64px; text-align: right; }

.wenum-tokens { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); min-height: 44px; }
.wenum-input { border: 0; background: transparent; outline: none; font-family: "JetBrains Mono", monospace; font-size: 12.5px; color: var(--ink); flex: 1; min-width: 160px; padding: 4px 0; }
.wenum-input::placeholder { color: var(--ink-4); }

.wbf { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border: 1px solid var(--line-2); border-radius: 10px; background: var(--panel-2); margin-top: 24px; font-size: 12.5px; color: var(--ink-2); }
.wbf.on { background: color-mix(in oklab, var(--gold) 5%, var(--panel-2)); border-color: color-mix(in oklab, var(--gold) 18%, var(--line)); }
.wbf-left { display: flex; align-items: center; gap: 12px; flex: 1; }
.wbf-tag { font-family: "JetBrains Mono", monospace; font-size: 9.5px; padding: 3px 7px; border-radius: 4px; background: var(--ink); color: var(--bg-canvas); letter-spacing: 0.5px; flex-shrink: 0; }
.wbf-title { font-weight: 500; font-size: 13px; color: var(--ink); }
.wbf-sub { font-family: "JetBrains Mono", monospace; font-size: 10.5px; color: var(--ink-3); margin-top: 2px; }
    `;
    document.head.appendChild(el);
    return () => { const s = document.getElementById(id); if (s) s.remove(); };
  }, []);
  return null;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

// Connector catalog. `slug` is a Simple Icons slug used to render the real brand
// logo (https://cdn.simpleicons.org/<slug>/<hex>); `icon` is the text fallback.
// `kind` splits the catalog into structured systems vs unstructured sources.
const SOURCE_SYSTEMS = [
  // ── Structured systems (databases, warehouses, apps with records) ──
  { id: "salesforce", cat: "CRM & Marketing", domain: "salesforce.com",  name: "Salesforce",            tag: "CRM",          kind: "structured",   status: "healthy",  icon: "S",   slug: "salesforce",          color: "#00A1E0", desc: "Accounts, contacts, opportunities and custom objects." },
  { id: "hubspot", cat: "CRM & Marketing", domain: "hubspot.com",     name: "HubSpot",               tag: "Marketing",    kind: "structured",   status: "healthy",  icon: "H",   slug: "hubspot",             color: "#FF7A59", desc: "Contacts, deals, companies and marketing events." },
  { id: "snowflake", cat: "Data Warehouse", domain: "snowflake.com",   name: "Snowflake",             tag: "Warehouse",    kind: "structured",   status: "healthy",  icon: "❄",  slug: "snowflake",           color: "#29B5E8", desc: "Cloud data-warehouse tables and views." },
  { id: "bigquery", cat: "Data Warehouse", domain: "cloud.google.com",    name: "Google BigQuery",       tag: "Warehouse",    kind: "structured",   status: "healthy",  icon: "BQ",  slug: "googlebigquery",      color: "#669DF6", desc: "Serverless warehouse datasets and tables." },
  { id: "databricks", cat: "Data Warehouse", domain: "databricks.com",  name: "Databricks",            tag: "Lakehouse",    kind: "structured",   status: "healthy",  icon: "DB",  slug: "databricks",          color: "#FF3621", desc: "Delta tables and Unity Catalog assets." },
  { id: "redshift", cat: "Data Warehouse", domain: "aws.amazon.com",    name: "Amazon Redshift",       tag: "Warehouse",    kind: "structured",   status: "healthy",  icon: "RS",  slug: "amazonredshift",      color: "#8C4FFF", desc: "Columnar warehouse schemas and tables." },
  { id: "postgres", cat: "Databases", domain: "postgresql.org",    name: "PostgreSQL",            tag: "Database",     kind: "structured",   status: "healthy",  icon: "PG",  slug: "postgresql",          color: "#4169E1", desc: "Relational tables, views and materialised views." },
  { id: "mysql", cat: "Databases", domain: "mysql.com",       name: "MySQL",                 tag: "Database",     kind: "structured",   status: "healthy",  icon: "My",  slug: "mysql",               color: "#4479A1", desc: "Relational tables from a MySQL instance." },
  { id: "sqlserver", cat: "Databases", domain: "microsoft.com",   name: "Microsoft SQL Server",  tag: "Database",     kind: "structured",   status: "healthy",  icon: "MS",  slug: "microsoftsqlserver",  color: "#CC2927", desc: "Tables, views and stored procedures." },
  { id: "oracle", cat: "Databases", domain: "oracle.com",      name: "Oracle Database",       tag: "Database",     kind: "structured",   status: "healthy",  icon: "Or",  slug: "oracle",              color: "#F80000", desc: "Enterprise relational schemas." },
  { id: "mongodb", cat: "Databases", domain: "mongodb.com",     name: "MongoDB",               tag: "NoSQL",        kind: "structured",   status: "healthy",  icon: "Mo",  slug: "mongodb",             color: "#47A248", desc: "Document collections and embedded records." },
  { id: "netsuite", cat: "ERP & Finance", domain: "netsuite.com",    name: "NetSuite ERP",          tag: "ERP",          kind: "structured",   status: "healthy",  icon: "N",   slug: "",                    color: "#1F7A3D", desc: "Invoices, agreements and financial records." },
  { id: "sap", cat: "ERP & Finance", domain: "sap.com",         name: "SAP",                   tag: "ERP",          kind: "structured",   status: "healthy",  icon: "SAP", slug: "sap",                 color: "#0FAAFF", desc: "ERP modules, materials and finance documents." },
  { id: "stripe", cat: "ERP & Finance", domain: "stripe.com",      name: "Stripe",                tag: "Billing",      kind: "structured",   status: "healthy",  icon: "$",   slug: "stripe",              color: "#635BFF", desc: "Customers, subscriptions, invoices and payouts." },
  { id: "shopify", cat: "ERP & Finance", domain: "shopify.com",     name: "Shopify",               tag: "Commerce",     kind: "structured",   status: "healthy",  icon: "Sh",  slug: "shopify",             color: "#7AB55C", desc: "Orders, products, customers and inventory." },
  { id: "airtable", cat: "Databases", domain: "airtable.com",    name: "Airtable",              tag: "Database",     kind: "structured",   status: "healthy",  icon: "At",  slug: "airtable",            color: "#18BFFF", desc: "Bases, tables and linked records." },
  { id: "googlesheets", cat: "Files & Storage", domain: "google.com",name: "Google Sheets",         tag: "Spreadsheet",  kind: "structured",   status: "healthy",  icon: "GS",  slug: "googlesheets",        color: "#34A853", desc: "Spreadsheet rows as structured records." },
  { id: "segment", cat: "Identity & Events", domain: "segment.com",     name: "Segment",               tag: "CDP",          kind: "structured",   status: "healthy",  icon: "Sg",  slug: "segment",             color: "#52BD94", desc: "Event streams and identity profiles." },
  { id: "okta", cat: "Identity & Events", domain: "okta.com",        name: "Okta",                  tag: "Identity",     kind: "structured",   status: "healthy",  icon: "O",   slug: "okta",                color: "#007DC1", desc: "Users, groups and identity mappings." },
  { id: "kafka", cat: "Identity & Events", domain: "apache.org",       name: "Apache Kafka",          tag: "Streaming",    kind: "structured",   status: "healthy",  icon: "K",   slug: "apachekafka",         color: "#231F20", desc: "Event topics consumed as a stream." },
  { id: "jira", cat: "Project & Support", domain: "atlassian.com",        name: "Jira",                  tag: "Issues",       kind: "structured",   status: "healthy",  icon: "Jr",  slug: "jira",                color: "#0052CC", desc: "Issues, sprints and project tracking." },
  { id: "zendesk", cat: "Project & Support", domain: "zendesk.com",     name: "Zendesk",               tag: "Support",      kind: "structured",   status: "healthy",  icon: "Z",   slug: "zendesk",             color: "#03363D", desc: "Tickets, macros and help-center articles." },
  { id: "asana", cat: "Project & Support", domain: "asana.com",       name: "Asana",                 tag: "Tasks",        kind: "structured",   status: "healthy",  icon: "As",  slug: "asana",               color: "#F06A6A", desc: "Projects, tasks and portfolios." },
  { id: "linear", cat: "Project & Support", domain: "linear.app",      name: "Linear",                tag: "Issues",       kind: "structured",   status: "healthy",  icon: "Ln",  slug: "linear",              color: "#5E6AD2", desc: "Issues, cycles and project updates." },
  // ── Unstructured sources (docs, files, messages, wikis) ──
  { id: "googledrive", cat: "Files & Storage", domain: "drive.google.com", name: "Google Drive",     tag: "Files",        kind: "unstructured", status: "healthy",  icon: "GD",  slug: "googledrive",         color: "#1FA463", desc: "Docs, Sheets, Slides and stored files." },
  { id: "slack", cat: "Messaging & Email", domain: "slack.com",       name: "Slack",                 tag: "Messaging",    kind: "unstructured", status: "healthy",  icon: "Sl",  slug: "slack",               color: "#4A154B", desc: "Channels, threads and message history." },
  { id: "teams", cat: "Messaging & Email", domain: "microsoft.com",   name: "Microsoft Teams",       tag: "Messaging",    kind: "unstructured", status: "healthy",  icon: "Tm",  slug: "microsoftteams",      color: "#5059C9", desc: "Channels, chats, meetings and shared files." },
  { id: "confluence", cat: "Docs & Wikis", domain: "atlassian.com",  name: "Confluence",            tag: "Wiki",         kind: "unstructured", status: "healthy",  icon: "Cf",  slug: "confluence",          color: "#172B4D", desc: "Spaces, pages and knowledge bases." },
  { id: "notion", cat: "Docs & Wikis", domain: "notion.so",      name: "Notion",                tag: "Wiki",         kind: "unstructured", status: "healthy",  icon: "No",  slug: "notion",              color: "#000000", desc: "Pages, wikis and databases." },
  { id: "sharepoint", cat: "Files & Storage", domain: "microsoft.com",  name: "SharePoint",            tag: "Files",        kind: "unstructured", status: "healthy",  icon: "SP",  slug: "microsoftsharepoint", color: "#0078D4", desc: "Document libraries and team sites." },
  { id: "onedrive", cat: "Files & Storage", domain: "microsoft.com",    name: "OneDrive",              tag: "Files",        kind: "unstructured", status: "healthy",  icon: "OD",  slug: "microsoftonedrive",   color: "#0078D4", desc: "Personal and shared cloud files." },
  { id: "dropbox", cat: "Files & Storage", domain: "dropbox.com",     name: "Dropbox",               tag: "Files",        kind: "unstructured", status: "healthy",  icon: "Dx",  slug: "dropbox",             color: "#0061FF", desc: "Synced files, folders and content." },
  { id: "box", cat: "Files & Storage", domain: "box.com",         name: "Box",                   tag: "Files",        kind: "unstructured", status: "healthy",  icon: "Bx",  slug: "box",                 color: "#0061D5", desc: "Enterprise content and shared files." },
  { id: "s3", cat: "Files & Storage", domain: "aws.amazon.com",          name: "Amazon S3",             tag: "Object store", kind: "unstructured", status: "healthy",  icon: "S3",  slug: "amazons3",            color: "#569A31", desc: "Objects and files in S3 buckets." },
  { id: "gcs", cat: "Files & Storage", domain: "cloud.google.com",         name: "Google Cloud Storage",  tag: "Object store", kind: "unstructured", status: "healthy",  icon: "GCS", slug: "googlecloud",         color: "#4285F4", desc: "Objects and files in GCS buckets." },
  { id: "gmail", cat: "Messaging & Email", domain: "mail.google.com",   name: "Gmail",                 tag: "Email",        kind: "unstructured", status: "healthy",  icon: "GM",  slug: "gmail",               color: "#EA4335", desc: "Email threads, messages and attachments." },
  { id: "outlook", cat: "Messaging & Email", domain: "outlook.com",     name: "Outlook",               tag: "Email",        kind: "unstructured", status: "healthy",  icon: "Ol",  slug: "microsoftoutlook",    color: "#0078D4", desc: "Mailboxes, threads and calendar items." },
  { id: "github", cat: "Dev & Code", domain: "github.com",      name: "GitHub",                tag: "Code",         kind: "unstructured", status: "healthy",  icon: "GH",  slug: "github",              color: "#181717", desc: "Repos, pull requests, issues and READMEs." },
  { id: "gitlab", cat: "Dev & Code", domain: "gitlab.com",      name: "GitLab",                tag: "Code",         kind: "unstructured", status: "healthy",  icon: "GL",  slug: "gitlab",              color: "#FC6D26", desc: "Repositories, merge requests and CI." },
  { id: "intercom", cat: "Project & Support", domain: "intercom.com",    name: "Intercom",              tag: "Support",      kind: "unstructured", status: "healthy",  icon: "Ic",  slug: "intercom",            color: "#1F8DED", desc: "Conversations and help articles." },
  { id: "figma", cat: "Design", domain: "figma.com",       name: "Figma",                 tag: "Design",       kind: "unstructured", status: "healthy",  icon: "Fg",  slug: "figma",               color: "#F24E1E", desc: "Design files, frames and comments." },
  { id: "zoom", cat: "Messaging & Email", domain: "zoom.us",        name: "Zoom",                  tag: "Meetings",     kind: "unstructured", status: "healthy",  icon: "Zm",  slug: "zoom",                color: "#0B5CFF", desc: "Recordings and meeting transcripts." },
  { id: "custom", cat: "Custom",      name: "Custom connector",      tag: "Custom",       kind: "structured",   status: null,       icon: "+",   slug: "",                    color: "#A09E88", desc: "Bring your own REST, JDBC, gRPC or file source." },
];

// Connector category dropdown options for the picker (step 1).
const SRC_CATEGORIES = ["CRM & Marketing", "ERP & Finance", "Data Warehouse", "Databases", "Files & Storage", "Docs & Wikis", "Messaging & Email", "Dev & Code", "Project & Support", "Identity & Events", "Design"];

// Existing connections per source system (step 2). Falls back to a single default.
const CONNECTIONS_BY_SYS = {
  snowflake:  [
    { id: "sf-prod", name: "Production warehouse",  detail: "acme.us-east-1 · ANALYTICS_WH", auth: "Key-pair",        status: "healthy", lastUsed: "2h ago" },
    { id: "sf-stg",  name: "Staging warehouse",     detail: "acme.us-east-1 · STAGING_WH",   auth: "Key-pair",        status: "healthy", lastUsed: "3d ago" },
  ],
  salesforce: [
    { id: "sfdc-prod", name: "Production org",       detail: "acme.my.salesforce.com",                  auth: "OAuth2", status: "healthy", lastUsed: "1h ago" },
    { id: "sfdc-sbx",  name: "Sandbox",              detail: "acme--dev.sandbox.my.salesforce.com",     auth: "OAuth2", status: "degraded", lastUsed: "5d ago" },
  ],
  postgres:   [
    { id: "pg-rep",   name: "Primary read-replica",  detail: "db.acme.internal:5432 · prod",  auth: "Password",  status: "healthy", lastUsed: "12m ago" },
  ],
  hubspot:    [
    { id: "hs-mkt",   name: "Marketing hub",         detail: "portal 4821990",                auth: "OAuth2",    status: "healthy", lastUsed: "6h ago" },
  ],
};
function getConnections(sysId, sel) {
  if (CONNECTIONS_BY_SYS[sysId]) return CONNECTIONS_BY_SYS[sysId];
  if (!sel) return [];
  return [{ id: sysId + "-default", name: "Default connection", detail: sel.name + " · workspace", auth: "OAuth2", status: "healthy", lastUsed: "recently" }];
}

// Discoverable objects per source system (step 3). Falls back to generic tables.
const OBJECTS_BY_SYS = {
  salesforce: [
    { name: "Account",     type: "Object", rows: "2.8K", cols: 42 },
    { name: "Contact",     type: "Object", rows: "18K",  cols: 38 },
    { name: "Opportunity", type: "Object", rows: "6.2K", cols: 51 },
    { name: "Lead",        type: "Object", rows: "24K",  cols: 33 },
    { name: "Case",        type: "Object", rows: "142K", cols: 29 },
    { name: "Campaign",    type: "Object", rows: "320",  cols: 22 },
    { name: "Task",        type: "Object", rows: "410K", cols: 18 },
    { name: "User",        type: "Object", rows: "1.2K", cols: 44 },
    { name: "Product2",    type: "Object", rows: "180",  cols: 26 },
    { name: "Quote",       type: "Object", rows: "3.1K", cols: 35 },
  ],
  snowflake: [
    { name: "ANALYTICS.ACCOUNTS",         type: "Table", rows: "2.8K", cols: 18 },
    { name: "ANALYTICS.SUBSCRIPTIONS",    type: "Table", rows: "2.8K", cols: 11 },
    { name: "ANALYTICS.INVOICES",         type: "Table", rows: "12K",  cols: 13 },
    { name: "ANALYTICS.USAGE_EVENTS",     type: "Table", rows: "25M",  cols: 9  },
    { name: "ANALYTICS.ACCOUNT_HEALTH_V", type: "View",  rows: "2.8K", cols: 7  },
    { name: "RAW.SFDC_ACCOUNT",           type: "Table", rows: "2.8K", cols: 42 },
  ],
  postgres: [
    { name: "public.accounts",      type: "Table", rows: "2.8K", cols: 18 },
    { name: "public.users",         type: "Table", rows: "1.2K", cols: 14 },
    { name: "public.orders",        type: "Table", rows: "12K",  cols: 16 },
    { name: "public.order_items",   type: "Table", rows: "48K",  cols: 9  },
    { name: "billing.invoices",     type: "Table", rows: "12K",  cols: 13 },
  ],
  databricks: [
    { name: "main.sales.accounts",         type: "Delta",            rows: "2.8K", cols: 18 },
    { name: "main.sales.opportunities",    type: "Delta",            rows: "6.2K", cols: 24 },
    { name: "main.finance.invoices",       type: "Delta",            rows: "12K",  cols: 13 },
    { name: "main.product.usage_events",   type: "Delta",            rows: "48M",  cols: 11 },
    { name: "main.gold.account_health",    type: "Materialized View", rows: "2.8K", cols: 9  },
    { name: "bronze.raw.sfdc_accounts",    type: "Delta",            rows: "2.8K", cols: 42 },
    { name: "main.hr.employees",           type: "Delta",            rows: "3.4K", cols: 21 },
  ],
  bigquery: [
    { name: "analytics.accounts",          type: "Table",            rows: "2.8K", cols: 18 },
    { name: "analytics.sessions",          type: "Table",            rows: "14M",  cols: 16 },
    { name: "analytics.orders",            type: "Table",            rows: "12K",  cols: 16 },
    { name: "analytics.events_*",          type: "Partitioned Table", rows: "210M", cols: 9  },
    { name: "marketing.campaigns",         type: "Table",            rows: "640",  cols: 12 },
    { name: "finance.invoices",            type: "Table",            rows: "12K",  cols: 13 },
    { name: "core.users",                  type: "Table",            rows: "1.2K", cols: 14 },
  ],
  redshift: [
    { name: "public.accounts",             type: "Table", rows: "2.8K", cols: 18 },
    { name: "public.users",                type: "Table", rows: "1.2K", cols: 14 },
    { name: "analytics.fact_orders",       type: "Table", rows: "12K",  cols: 16 },
    { name: "analytics.fact_usage_events", type: "Table", rows: "96M",  cols: 9  },
    { name: "analytics.dim_account",       type: "Table", rows: "2.8K", cols: 18 },
    { name: "billing.invoices",            type: "Table", rows: "12K",  cols: 13 },
  ],
  stripe: [
    { name: "customers",      type: "Object", rows: "2.8K", cols: 24 },
    { name: "subscriptions",  type: "Object", rows: "2.8K", cols: 31 },
    { name: "invoices",       type: "Object", rows: "12K",  cols: 28 },
    { name: "charges",        type: "Object", rows: "96K",  cols: 22 },
  ],
};
function getSourceObjects(sysId, sel) {
  if (OBJECTS_BY_SYS[sysId]) return OBJECTS_BY_SYS[sysId];
  return [
    { name: "accounts", type: "Table", rows: "2.8K", cols: 18 },
    { name: "contacts", type: "Table", rows: "18K",  cols: 14 },
    { name: "orders",   type: "Table", rows: "12K",  cols: 13 },
    { name: "events",   type: "Table", rows: "124K", cols: 9  },
    { name: "users",    type: "Table", rows: "1.2K", cols: 12 },
  ];
}

const DATA_TYPES = [
  { id: "string",    label: "string",    group: "Primitive", desc: "UTF-8 text, variable length" },
  { id: "int",       label: "int",       group: "Primitive", desc: "64-bit signed integer" },
  { id: "float",     label: "float",     group: "Primitive", desc: "64-bit IEEE 754 double" },
  { id: "decimal",   label: "decimal",   group: "Primitive", desc: "Arbitrary precision — safe for money" },
  { id: "bool",      label: "bool",      group: "Primitive", desc: "true / false" },
  { id: "timestamp", label: "timestamp", group: "Temporal",  desc: "UTC nanosecond epoch" },
  { id: "date",      label: "date",      group: "Temporal",  desc: "Calendar date, no time component" },
  { id: "uuid",      label: "uuid",      group: "Identity",  desc: "RFC 4122 UUID v4" },
  { id: "json",      label: "json",      group: "Complex",   desc: "Schemaless JSON document" },
  { id: "enum",      label: "enum(…)",   group: "Complex",   desc: "Closed value set — define members next" },
  { id: "array",     label: "array<T>",  group: "Complex",   desc: "Ordered list of a single type" },
  { id: "struct",    label: "struct",    group: "Complex",   desc: "Typed key-value nested object" },
  { id: "fk",        label: "fk(Node)", group: "Relation",  desc: "Foreign key reference to another node type" },
];

const PII_TIERS = [
  { id: "none",         label: "None",         color: "var(--ink-3)",  desc: "No personal data" },
  { id: "pseudonymous", label: "Pseudonymous", color: "#b8923a",       desc: "Indirect identifier; reversible with key" },
  { id: "personal",     label: "Personal",     color: "#b8923a",       desc: "Directly identifies a natural person" },
  { id: "sensitive",    label: "Sensitive",    color: "var(--coral)",  desc: "Health, finance, religion — GDPR Art. 9" },
  { id: "restricted",   label: "Restricted",   color: "#b14a3c",       desc: "Highest risk — encrypted at rest, access logged" },
];

const MASKING_RULES = [
  { id: "none",      label: "No masking",         desc: "Value returned in full" },
  { id: "partial",   label: "Partial (last 4)",   desc: "e.g. ****4242" },
  { id: "hash",      label: "Deterministic hash", desc: "SHA-256 — consistent across joins" },
  { id: "redact",    label: "Full redaction",      desc: "[REDACTED] for non-privileged roles" },
  { id: "tokenise",  label: "Tokenise (vault)",   desc: "Vault token; only privileged roles get raw value" },
];

const RETENTION_OPTS = [
  { id: "inherit",  label: "Inherit from node type" },
  { id: "30d",      label: "30 days" },
  { id: "90d",      label: "90 days" },
  { id: "1y",       label: "1 year" },
  { id: "7y",       label: "7 years (regulatory)" },
  { id: "forever",  label: "No expiry" },
];

const ROLES = ["acct_admin","fin_ops","cs_platform","governance","data_platform","applied_ml","read_all"];
const GOV_TAGS = ["pii","billing","sensitive","analytics","slo:24h","experimental","deprecated-candidate","audit-required"];

const VALIDATION_PRESETS = [
  { id: "none",    label: "None" },
  { id: "email",   label: "Email address",   pattern: "^[^@]+@[^@]+\\.[^@]+$" },
  { id: "url",     label: "URL (http/https)", pattern: "^https?://.+" },
  { id: "uuid",    label: "UUID v4",          pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}…" },
  { id: "isodate", label: "ISO 8601 date" },
  { id: "phone",   label: "E.164 phone",      pattern: "^\\+[1-9]\\d{6,14}$" },
  { id: "slug",    label: "URL slug",          pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
];

const SOURCE_COLS_MOCK = {
  salesforce: [
    { col: "Id",                  type: "string",    sample: "0015g00000AbCdE" },
    { col: "Name",                type: "string",    sample: "Acme Corp" },
    { col: "Industry",            type: "string",    sample: "Technology" },
    { col: "AnnualRevenue",       type: "decimal",   sample: "24500000.00" },
    { col: "BillingCountry",      type: "string",    sample: "US" },
    { col: "OwnerId",             type: "string",    sample: "0055g00000XyZaB" },
    { col: "CreatedDate",         type: "timestamp", sample: "2024-01-12T09:14:00Z" },
    { col: "LastModifiedDate",    type: "timestamp", sample: "2026-04-02T14:22:11Z" },
    { col: "IsDeleted",           type: "bool",      sample: "false" },
    { col: "CustomerPriority__c", type: "string",    sample: "High" },
    { col: "ContractEndDate__c",  type: "date",      sample: "2027-06-30" },
  ],
  netsuite: [
    { col: "internal_id",   type: "int",       sample: "10284" },
    { col: "company_name",  type: "string",    sample: "Acme Corp" },
    { col: "subsidiary",    type: "string",    sample: "US Entity" },
    { col: "currency",      type: "string",    sample: "USD" },
    { col: "balance",       type: "decimal",   sample: "12400.00" },
    { col: "date_created",  type: "timestamp", sample: "2024-01-15T00:00:00Z" },
  ],
  snowflake: [
    { col: "account_key",  type: "uuid",      sample: "7f3b4a…" },
    { col: "domain",       type: "string",    sample: "acme.com" },
    { col: "dau_30d",      type: "int",       sample: "1240" },
    { col: "arr_usd",      type: "decimal",   sample: "48200.00" },
    { col: "churn_score",  type: "float",     sample: "0.14" },
    { col: "last_login_at",type: "timestamp", sample: "2026-05-21T11:04:22Z" },
  ],
};

function getSourceCols(id) {
  return SOURCE_COLS_MOCK[id] || [
    { col: "id",         type: "string",    sample: "abc123" },
    { col: "name",       type: "string",    sample: "Example" },
    { col: "created_at", type: "timestamp", sample: "2026-01-01T00:00:00Z" },
    { col: "updated_at", type: "timestamp", sample: "2026-05-01T00:00:00Z" },
  ];
}

// Per-object columns — used by the multi-object column-mapping step so each
// selected object can be mapped independently.
const OBJECT_COLS_BY_NAME = {
  accounts: [
    { col: "id",             type: "string",    sample: "acc_8f3" },
    { col: "name",           type: "string",    sample: "Acme Corp" },
    { col: "domain",         type: "string",    sample: "acme.com" },
    { col: "industry",       type: "string",    sample: "Technology" },
    { col: "annual_revenue", type: "decimal",   sample: "24500000.00" },
    { col: "country",        type: "string",    sample: "US" },
    { col: "owner_id",       type: "string",    sample: "usr_55x" },
    { col: "created_at",     type: "timestamp", sample: "2024-01-12T09:14:00Z" },
    { col: "updated_at",     type: "timestamp", sample: "2026-04-02T14:22:11Z" },
  ],
  contacts: [
    { col: "id",         type: "string",    sample: "ctc_1a2" },
    { col: "first_name", type: "string",    sample: "Jane" },
    { col: "last_name",  type: "string",    sample: "Doe" },
    { col: "email",      type: "string",    sample: "jane@acme.com" },
    { col: "phone",      type: "string",    sample: "+14155550100" },
    { col: "account_id", type: "string",    sample: "acc_8f3" },
    { col: "title",      type: "string",    sample: "VP Eng" },
    { col: "created_at", type: "timestamp", sample: "2024-02-01T00:00:00Z" },
  ],
  orders: [
    { col: "id",         type: "string",    sample: "ord_77c" },
    { col: "account_id", type: "string",    sample: "acc_8f3" },
    { col: "amount_usd", type: "decimal",   sample: "1299.00" },
    { col: "currency",   type: "string",    sample: "USD" },
    { col: "status",     type: "string",    sample: "paid" },
    { col: "placed_at",  type: "timestamp", sample: "2026-03-10T12:00:00Z" },
  ],
  events: [
    { col: "id",          type: "string",    sample: "evt_9z" },
    { col: "event_type",  type: "string",    sample: "login" },
    { col: "account_id",  type: "string",    sample: "acc_8f3" },
    { col: "user_id",     type: "string",    sample: "usr_3k" },
    { col: "occurred_at", type: "timestamp", sample: "2026-05-21T11:04:22Z" },
  ],
  users: [
    { col: "id",            type: "string",    sample: "usr_3k" },
    { col: "name",          type: "string",    sample: "Sam Lee" },
    { col: "email",         type: "string",    sample: "sam@acme.com" },
    { col: "role",          type: "string",    sample: "admin" },
    { col: "last_login_at", type: "timestamp", sample: "2026-05-20T08:00:00Z" },
  ],
};
function getObjectCols(obj) {
  if (!obj) return [];
  const key = String(obj.name || "").toLowerCase().replace(/^.*[.]/, "");
  const hit = OBJECT_COLS_BY_NAME[key] || OBJECT_COLS_BY_NAME[key + "s"] || OBJECT_COLS_BY_NAME[key.replace(/s$/, "")];
  if (hit) return hit;
  // Generic fallback sized to the object's declared column count.
  const n = Math.max(4, Math.min(obj.cols || 6, 12));
  const base = [
    { col: "id",         type: "string",    sample: "id_001" },
    { col: "name",       type: "string",    sample: "—" },
    { col: "status",     type: "string",    sample: "active" },
    { col: "amount",     type: "decimal",   sample: "0.00" },
    { col: "owner_id",   type: "string",    sample: "usr_1" },
    { col: "created_at", type: "timestamp", sample: "2026-01-01T00:00:00Z" },
    { col: "updated_at", type: "timestamp", sample: "2026-06-01T00:00:00Z" },
  ];
  const out = base.slice(0, n);
  for (let i = out.length; i < n; i++) out.push({ col: "field_" + (i + 1), type: "string", sample: "—" });
  return out;
}

// ─── PRIMITIVE COMPONENTS ─────────────────────────────────────────────────────

function useOutsideClick(ref, open, onClose) {
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
}

// Single full-width form row
function FormRow({ label, required, optional, children, hint, last }) {
  return (
    <div className={"wfr" + (last ? " wfr-last" : "")}>
      <div className="wfr-label">
        {label}
        {required && <span className="wfr-req">REQUIRED</span>}
        {optional && <span className="wfr-opt">OPTIONAL</span>}
      </div>
      <div className="wfr-body">{children}</div>
      {hint && <div className="wfr-hint">{hint}</div>}
    </div>
  );
}

// Grouped dropdown (types, PII, masking, etc.)
function CustomSelect({ value, onChange, options, placeholder = "—", renderTrigger, renderOption, grouped, tabs, className, searchable, searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const ref = useRef(null);
  useOutsideClick(ref, open, () => { setOpen(false); setQ(""); });

  const tabItems = t => t.groups ? t.groups.flatMap(g => g.items) : (t.items || []);
  const allOptions = tabs ? tabs.flatMap(tabItems) : grouped ? options.flatMap(g => g.items) : options;
  const sel = allOptions.find(o => (o.id || o) === value);
  const matches = o => !q || String(o.label || o.name || o).toLowerCase().indexOf(q.toLowerCase()) >= 0;
  const choose = id => { onChange(id); setOpen(false); setQ(""); };

  const optBtn = o => {
    const id = o.id || o;
    return (
      <button key={id} className={"csel-opt" + (value === id ? " on" : "")} onClick={() => choose(id)}>
        {renderOption ? renderOption(o) : <><span className="csel-opt-label">{o.label || o.name || o}</span>{o.desc && <span className="csel-opt-sub">{o.desc}</span>}</>}
        {value === id && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="csel-tick"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
    );
  };
  const groupBlock = g => {
    const items = g.items.filter(matches);
    if (!items.length) return null;
    return <div key={g.key || g.label} className="csel-grp">{g.label ? <div className="csel-group">{g.label}</div> : null}{items.map(optBtn)}</div>;
  };

  return (
    <div className={"csel" + (className ? " " + className : "")} ref={ref}>
      <button className={"csel-trigger" + (open ? " open" : "")} onClick={() => setOpen(o => !o)}>
        <span className="csel-val">
          {sel ? (renderTrigger ? renderTrigger(sel) : sel.label || sel.name || sel) : <span className="csel-ph">{placeholder}</span>}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={"csel-chevron" + (open ? " up" : "")}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="csel-menu">
          {tabs && (
            <div className="csel-tabs">
              {tabs.map((t, ti) => (
                <button key={t.label} className={"csel-tab" + (ti === activeTab ? " on" : "")} onClick={() => setActiveTab(ti)}>
                  {t.label}{typeof t.count === "number" && <span className="csel-tab-n">{t.count}</span>}
                </button>
              ))}
            </div>
          )}
          {searchable && (
            <div className="csel-search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input autoFocus placeholder={searchPlaceholder || "Search…"} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setQ(""); } }} />
            </div>
          )}
          {tabs
            ? (tabs[activeTab].groups ? tabs[activeTab].groups.map(groupBlock) : tabs[activeTab].items.filter(matches).map(optBtn))
            : grouped ? options.map(groupBlock) : options.filter(matches).map(optBtn)}
          {((tabs ? tabItems(tabs[activeTab]).filter(matches) : allOptions.filter(matches)).length === 0) && (
            <div style={{ padding: "16px 12px", textAlign: "center", color: "var(--ink-4)", fontSize: 12.5 }}>{q ? "No matches for “" + q + "”." : "Nothing here yet."}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Grouped type select
function TypeSelect({ value, onChange }) {
  const GROUPS = [
    { label: "Primitive", items: DATA_TYPES.filter(t => t.group === "Primitive") },
    { label: "Temporal",  items: DATA_TYPES.filter(t => t.group === "Temporal") },
    { label: "Identity",  items: DATA_TYPES.filter(t => t.group === "Identity") },
    { label: "Complex",   items: DATA_TYPES.filter(t => t.group === "Complex") },
    { label: "Relation",  items: DATA_TYPES.filter(t => t.group === "Relation") },
  ];
  const sel = DATA_TYPES.find(t => t.id === value);
  return (
    <CustomSelect
      value={value} onChange={onChange}
      options={GROUPS} grouped
      placeholder="pick a type"
      renderTrigger={t => <><code className="csel-code">{t.label}</code><span className="csel-val-sub">{t.desc}</span></>}
      renderOption={t => <><code className="csel-code">{t.label}</code><span className="csel-opt-sub">{t.desc}</span></>}
    />
  );
}

// Source system select with icon + health
function SysSelect({ value, onChange }) {
  const sel = SOURCE_SYSTEMS.find(s => s.id === value);
  return (
    <CustomSelect
      value={value} onChange={onChange}
      options={SOURCE_SYSTEMS} placeholder="— choose connector —"
      renderTrigger={s => (
        <span className="csel-sys-val">
          <span className="csel-sys-icon" style={{ background: s.color + "1a", color: s.color }}>{s.icon}</span>
          <span>{s.name}</span>
          <span className={"csel-sys-dot " + (s.status || "custom")} />
        </span>
      )}
      renderOption={s => (
        <span className="csel-sys-val" style={{ width: "100%" }}>
          <span className="csel-sys-icon" style={{ background: s.color + "1a", color: s.color }}>{s.icon}</span>
          <span className="csel-opt-label">{s.name}</span>
          <span className="csel-opt-sub csel-sys-tag">{s.tag}</span>
          <span className={"csel-sys-dot " + (s.status || "custom")} />
        </span>
      )}
    />
  );
}

// Column select (discovered columns)
function ColSelect({ cols, value, onChange, placeholder = "— pick column —" }) {
  const sel = cols.find(c => c.col === value);
  return (
    <CustomSelect
      value={value} onChange={onChange}
      options={cols.map(c => ({ id: c.col, label: c.col, type: c.type, sample: c.sample }))}
      placeholder={placeholder}
      renderTrigger={c => <><code className="csel-code">{c.label}</code><span className="csel-val-sub">{c.id !== value ? "" : (cols.find(x=>x.col===value)?.type || "")}</span></>}
      renderOption={c => (
        <span style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <code className="csel-code" style={{ minWidth: 130 }}>{c.label}</code>
          <span className="csel-opt-sub" style={{ minWidth: 70 }}>{c.type}</span>
          <span className="csel-opt-sub" style={{ marginLeft: "auto", opacity: 0.6 }}>{c.sample}</span>
        </span>
      )}
    />
  );
}

// PII select with color swatch
function PIISelect({ value, onChange }) {
  const sel = PII_TIERS.find(t => t.id === value);
  return (
    <CustomSelect
      value={value} onChange={onChange}
      options={PII_TIERS}
      placeholder="— classify —"
      renderTrigger={t => (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
          <span style={{ color: t.color, fontWeight: 500 }}>{t.label}</span>
          <span className="csel-val-sub">{t.desc}</span>
        </span>
      )}
      renderOption={t => (
        <span style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
          <span className="csel-opt-label" style={{ color: t.color }}>{t.label}</span>
          <span className="csel-opt-sub">{t.desc}</span>
        </span>
      )}
    />
  );
}

// Compact radio list — for source kind, load strategy, error policy (4 options)
function RadioList({ options, value, onChange }) {
  return (
    <div className="wrl">
      {options.map(o => (
        <button key={o.id} className={"wrl-item" + (value === o.id ? " on" : "")} onClick={() => onChange(o.id)}>
          <span className={"wrl-radio" + (value === o.id ? " on" : "")} />
          <div className="wrl-body">
            <span className="wrl-label">{o.label}</span>
            {o.tag && <span className={"wrl-tag wrl-tag-" + o.id}>{o.tag}</span>}
            {o.desc && <span className="wrl-desc">{o.desc}</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

// Segmented control — 2-3 options only
function Seg({ options, value, onChange, risk }) {
  return (
    <div className="seg">
      {options.map(o => {
        const id = typeof o === "string" ? o : o.id;
        const label = typeof o === "string" ? o : o.label;
        const riskClass = risk && value === id ? " risk-" + id.toLowerCase() : "";
        return (
          <button key={id} className={"seg-opt" + (value === id ? " on" + riskClass : "")} onClick={() => onChange(id)}>{label}</button>
        );
      })}
    </div>
  );
}

// Multi-token select (roles, tags)
function MultiToken({ options, value, onChange, placeholder = "add…" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, open, () => setOpen(false));
  const available = options.filter(o => !value.includes(o));

  return (
    <div className="wmt" ref={ref}>
      <div className={"wmt-field" + (open ? " open" : "")} onClick={() => setOpen(o => !o)}>
        {value.map(v => (
          <span key={v} className="wmt-token">
            {v}
            <button className="wmt-x" onClick={e => { e.stopPropagation(); onChange(value.filter(x => x !== v)); }}>×</button>
          </span>
        ))}
        <span className="wmt-ph">{value.length === 0 ? placeholder : "add…"}</span>
      </div>
      {open && available.length > 0 && (
        <div className="wmt-menu">
          {available.map(o => (
            <button key={o} className="wmt-opt" onClick={() => onChange([...value, o])}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline flag checkboxes
function FlagsRow({ flags, values, onChange }) {
  return (
    <div className="wflag-row">
      {flags.map(f => (
        <label key={f.key} className={"wflag" + (values[f.key] ? " on" : "")}>
          <input type="checkbox" checked={values[f.key]} onChange={e => onChange({ ...values, [f.key]: e.target.checked })} />
          <span>{f.label}</span>
        </label>
      ))}
    </div>
  );
}

// Enum token editor
function EnumEditor({ values, onChange }) {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (v && !values.includes(v)) { onChange([...values, v]); setInput(""); } };
  return (
    <div className="wenum">
      <div className="wenum-tokens">
        {values.map((v, i) => (
          <span key={i} className="wmt-token">{v}<button className="wmt-x" onClick={() => onChange(values.filter((_, j) => j !== i))}>×</button></span>
        ))}
        <input className="wenum-input" placeholder="type value, press Enter" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
      </div>
    </div>
  );
}

// Slider row
function SliderRow({ value, onChange, min = 0, max = 100, step = 1, fmt }) {
  return (
    <div className="wslider">
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="wslider-input" />
      <span className="wslider-val">{fmt ? fmt(value) : value}</span>
    </div>
  );
}

// Backfill banner
function BackfillBanner({ backfill, onChange, estimate }) {
  return (
    <div className={"wbf" + (backfill ? " on" : "")}>
      <div className="wbf-left">
        <span className="wbf-tag">BACKFILL</span>
        <div>
          <div className="wbf-title">{backfill ? "Historical data will be replayed" : "Backfill disabled"}</div>
          {estimate && <div className="wbf-sub">{estimate}</div>}
        </div>
      </div>
      <label className="switch"><input type="checkbox" checked={backfill} onChange={e => onChange(e.target.checked)} /><span className="switch-track" /></label>
    </div>
  );
}

// ─── FLOW SHELL (shared wrapper) ──────────────────────────────────────────────

function WizardShell({ eyebrow, plainTitle, titleFrom, titleTo, titleLabel, titleType, stage, steps, step, setStep, onClose, rightPane, children, canNext, onNext, onPublish, hideKeymap, hideFootHelp, hideStage, overlay, fullScreen }) {
  return (
    <div className={"flow-overlay" + (fullScreen ? " flow-overlay-full" : "")} onClick={onClose}>
      <div className="flow-shell" onClick={e => e.stopPropagation()}>
        <div className="flow-head">
          <div className="flow-head-left">
            {plainTitle ? (
              <div className="flow-title">{plainTitle}</div>
            ) : (
              <>
                <div className="flow-eyebrow">{eyebrow}</div>
                <div className="flow-title">
                  {titleFrom}
                  {titleLabel && <><span className="flow-title-arrow">·</span><span className="flow-title-label">{titleLabel}</span></>}
                  {titleType && <span className="flow-title-type">{titleType}</span>}
                  {titleTo && <><span className="flow-title-arrow">→</span>{titleTo}</>}
                </div>
              </>
            )}
          </div>
          <div className="flow-head-right">
            {!hideStage && <span className="flow-stage-pill">target · <b>{stage}</b></span>}
            <button className="flow-close" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
        <div className="flow-body" style={!rightPane ? { gridTemplateColumns: "320px minmax(0, 1fr)" } : undefined}>
          <aside className="flow-steps">
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <button className={"flow-step" + (i === step ? " on" : "") + (i < step ? " done" : "")} onClick={() => setStep(i)}>
                  <span className="flow-step-n">{i < step ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,8.5 6.5,12 13,4.5" /></svg> : i + 1}</span>
                  <div className="flow-step-text">
                    <div className="flow-step-label">{s.label}</div>
                    <div className="flow-step-hint">{s.hint}</div>
                  </div>
                </button>
                {i === step && s.subItems && s.subItems.length > 0 && (
                  <div style={{ margin: "4px 0 6px 26px", display: "flex", flexDirection: "column", gap: 3, borderLeft: "1px solid var(--line)", paddingLeft: 10 }}>
                    {s.subItems.map(si => {
                      const on = si.id === s.activeSub;
                      const total = si.total != null ? si.total : 0;
                      const mapped = si.mapped != null ? si.mapped : 0;
                      const rich = si.total != null;
                      const complete = total > 0 && mapped >= total;
                      const frac = total > 0 ? Math.min(1, mapped / total) : 0;
                      const R = 9, C = 2 * Math.PI * R;
                      const ringColor = frac === 0 ? "var(--line)" : frac >= 0.75 ? "#1a7a40" : frac >= 0.5 ? "#d99214" : "#c0492f";
                      const initials = (si.label || "").replace(/^.*[.]/, "").slice(0, 2).toUpperCase();
                      if (!rich) {
                        return (
                          <button key={si.id} onClick={() => s.onSub && s.onSub(si.id)}
                            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 7, border: "none", background: on ? "var(--bg-canvas)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                            onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--panel)"; }}
                            onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: on ? "var(--ink)" : (si.done ? "var(--green)" : "var(--line)") }} />
                            <span style={{ flex: 1, minWidth: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: on ? 600 : 500, color: on ? "var(--ink)" : "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{si.label}</span>
                          </button>
                        );
                      }
                      return (
                        <button key={si.id} onClick={() => s.onSub && s.onSub(si.id)}
                          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: on ? "var(--chip)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background 100ms" }}
                          onMouseEnter={e => { if (!on) e.currentTarget.style.background = "#f1ecdd"; }}
                          onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                          {/* progress ring + monogram */}
                          <span style={{ position: "relative", width: 26, height: 26, flexShrink: 0 }}>
                            <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: "rotate(-90deg)", display: "block" }}>
                              <circle cx="13" cy="13" r={R} fill="none" stroke="var(--line)" strokeWidth="2.4" />
                              {mapped > 0 && <circle cx="13" cy="13" r={R} fill="none" stroke={ringColor} strokeWidth="2.4" strokeLinecap="round" strokeDasharray={`${frac * C} ${C}`} />}
                            </svg>
                            {complete && (
                              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#1a7a40" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5" /></svg>
                              </span>
                            )}
                          </span>
                          {/* name + sub */}
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? "var(--ink)" : "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>{si.label}</span>
                            <span style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: frac === 0 ? "var(--ink-4)" : ringColor, marginTop: 2 }}>{mapped + " / " + total}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            ))}
            {!hideKeymap && (
              <div className="flow-steps-foot">
                <div className="flow-keymap">
                  <span className="kbd">⌘↵</span><span>Publish</span>
                  <span className="kbd">⌘S</span><span>Draft</span>
                </div>
              </div>
            )}
          </aside>
          <main className="flow-main">{children}</main>
          {rightPane && <aside className="flow-preview">{rightPane}</aside>}
        </div>
        <div className="flow-foot">
          <div className="flow-foot-left">
            <button className="btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Back</button>
            {!hideFootHelp && <span className="flow-foot-help">Step {step + 1} of {steps.length} · <b>{steps[step].label}</b></span>}
          </div>
          <div className="flow-foot-right">
            <button className="btn-ghost">Save draft</button>
            {step < steps.length - 1
              ? <button className="btn-dark" onClick={onNext} disabled={!canNext}>Continue →</button>
              : <button className="btn-dark" onClick={onPublish}>{hideStage ? "Publish ↵" : "Publish to " + stage + " ↵"}</button>
            }
          </div>
        </div>
        {overlay}
      </div>
    </div>
  );
}

// Step wrapper
function StepWrap({ eyebrow, title, desc, children, wide }) {
  return (
    <div className={"wstep" + (wide ? " wstep-wide" : "")}>
      <div className="wstep-head">
        {eyebrow && <div className="step-eyebrow">{eyebrow}</div>}
        <div className="wstep-title">{title}</div>
        {desc && <div className="wstep-desc">{desc}</div>}
      </div>
      <div className="wstep-body">{children}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ADD PROPERTY WIZARD
// ════════════════════════════════════════════════════════════════════════════

const PROP_STEPS = [
  { label: "Basics",     hint: "Name, type, flags" },
  { label: "Source",     hint: "Where the value comes from" },
  { label: "Validation", hint: "Rules and format" },
  { label: "Governance", hint: "PII, access, retention" },
  { label: "Review",     hint: "Migration diff & publish" },
];

const SOURCE_KIND_OPTS = [
  { id: "direct",   label: "Direct source column",  tag: "DIRECT",   desc: "Value loaded from a source-system column or stream." },
  { id: "computed", label: "Computed expression",   tag: "COMPUTED", desc: "Derived from a formula over other properties at write time." },
  { id: "agent",    label: "Agent-written",          tag: "AGENT",    desc: "An agent emits this value as an output of its reasoning." },
  { id: "constant", label: "Constant / seed",        tag: "CONSTANT", desc: "Set once at creation and never overwritten by a sync." },
];

function AddPropertyFlow({ node, onClose }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    name: "", description: "", type: "string", enumValues: [],
    arrayItemType: "string", fkNode: "",
    defaultValue: "", exampleValue: "",
    required: false, indexed: false, unique: false, nullable: true,
    sourceKind: "direct", sourceSystem: "salesforce", sourceTable: "",
    sourceCol: "", coercion: "auto", expression: "", agentId: "",
    agentField: "", agentConfidence: 80, constantValue: "", constantBehaviour: "on_create",
    validationPreset: "none", customRegex: "", minVal: "", maxVal: "",
    nullPolicy: "allow", validationMode: "log",
    piiTier: "none", maskingRule: "none", retention: "inherit",
    accessRoles: ["read_all"], tags: [], changeRisk: "LOW",
    stage: "draft", backfill: true,
  });

  const set = patch => setP(v => ({ ...v, ...patch }));
  const nameCleaned = p.name.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
  const nameValid = nameCleaned.length >= 2;
  const canNext = step === 0 ? (nameValid && !!p.type) : true;
  const agents = (window.NODES || []).filter(n => n.type === "agent");
  const srcCols = getSourceCols(p.sourceSystem);

  const flags = { required: p.required, indexed: p.indexed, unique: p.unique, nullable: p.nullable };

  const titleFrom = (
    <span className="flow-title-from">
      {node && window.ListGlyph && <window.ListGlyph node={node} size={18} />}
      {node?.label}
    </span>
  );

  return (
    <WizardShell
      eyebrow={`SCHEMA · ${node?.label?.toUpperCase()} · ADD PROPERTY`}
      titleFrom={titleFrom}
      titleLabel={nameCleaned ? "." + nameCleaned : null}
      titleType={p.type && nameCleaned ? p.type : null}
      stage={p.stage}
      steps={PROP_STEPS} step={step} setStep={setStep}
      canNext={canNext}
      onNext={() => setStep(s => s + 1)}
      onPublish={onClose}
      onClose={onClose}
      rightPane={<PropPreview p={p} node={node} nameCleaned={nameCleaned} />}
    >
      {step === 0 && <PropBasics p={p} set={set} nameCleaned={nameCleaned} nameValid={nameValid} flags={flags} agents={agents} />}
      {step === 1 && <PropSource p={p} set={set} node={node} agents={agents} srcCols={srcCols} />}
      {step === 2 && <PropValidation p={p} set={set} />}
      {step === 3 && <PropGovernance p={p} set={set} />}
      {step === 4 && <PropReview p={p} set={set} node={node} nameCleaned={nameCleaned} onClose={onClose} />}
    </WizardShell>
  );
}

// ── Step 1: Basics ────────────────────────────────────────────────────────────

function PropBasics({ p, set, nameCleaned, nameValid, flags }) {
  const [nameTouched, setNameTouched] = useState(false);
  const nodeOpts = (window.NODES || []).filter(n => n.type === "entity");

  return (
    <StepWrap eyebrow="STEP 1 · BASICS" title="Name and type this property" desc="Property names become part of the schema's public API — once published, agents and queries will reference this name.">
      <FormRow label="Property name" required hint={nameCleaned && nameValid ? `✓  .${nameCleaned} is available` : "lowercase_snake_case · letters, digits, underscores"}>
        <div className="wfr-prefix-input">
          <span className="wfr-prefix">.</span>
          <input
            className={"winput winput-mono winput-xl" + (nameTouched && !nameValid ? " winput-err" : "")}
            placeholder="annual_revenue_usd"
            value={p.name}
            onChange={e => { set({ name: e.target.value }); setNameTouched(true); }}
            autoFocus
          />
        </div>
      </FormRow>

      <FormRow label="Data type" required hint={DATA_TYPES.find(t => t.id === p.type)?.desc}>
        <TypeSelect value={p.type} onChange={v => set({ type: v })} />
      </FormRow>

      {p.type === "enum" && (
        <FormRow label="Enum values" hint="Press Enter to add. Unknown values policy is set in Validation.">
          <EnumEditor values={p.enumValues} onChange={v => set({ enumValues: v })} />
        </FormRow>
      )}

      {p.type === "array" && (
        <FormRow label="Array item type">
          <CustomSelect value={p.arrayItemType} onChange={v => set({ arrayItemType: v })}
            options={DATA_TYPES.filter(t => !["array","struct","fk"].includes(t.id)).map(t => ({ id: t.id, label: t.label, desc: t.desc }))} />
        </FormRow>
      )}

      {p.type === "fk" && (
        <FormRow label="References node type">
          <CustomSelect value={p.fkNode} onChange={v => set({ fkNode: v })}
            placeholder="— pick node type —"
            options={(window.NODES || []).filter(n => n.type === "entity").map(n => ({ id: n.id, label: n.label }))} />
        </FormRow>
      )}

      <FormRow label="Description" optional>
        <textarea className="winput winput-textarea" rows="2" placeholder="What does this property represent? What business concept does it encode?" value={p.description} onChange={e => set({ description: e.target.value })} />
      </FormRow>

      <FormRow label="Default value" optional>
        <input className="winput winput-mono" placeholder={p.type === "bool" ? "false" : p.type === "int" ? "0" : "null"} value={p.defaultValue} onChange={e => set({ defaultValue: e.target.value })} />
      </FormRow>

      <FormRow label="Example value" optional hint="Shown in documentation and tooltips.">
        <input className="winput winput-mono" placeholder="acme.com" value={p.exampleValue} onChange={e => set({ exampleValue: e.target.value })} />
      </FormRow>

      <FormRow label="Flags" last hint="Required: write fails if absent · Indexed: B-tree lookup · Unique: enforces uniqueness · Nullable: allows null">
        <FlagsRow
          flags={[
            { key: "required", label: "Required" },
            { key: "indexed",  label: "Indexed" },
            { key: "unique",   label: "Unique" },
            { key: "nullable", label: "Nullable" },
          ]}
          values={flags}
          onChange={v => set(v)}
        />
      </FormRow>
    </StepWrap>
  );
}

// ── Step 2: Source ────────────────────────────────────────────────────────────

function PropSource({ p, set, node, agents, srcCols }) {
  return (
    <StepWrap eyebrow="STEP 2 · SOURCE" title="Where does the value come from?" desc="Every property needs a system of record. Lineage and freshness SLOs are derived from this choice.">
      <FormRow label="Source kind" required>
        <RadioList value={p.sourceKind} onChange={v => set({ sourceKind: v })} options={SOURCE_KIND_OPTS} />
      </FormRow>

      {p.sourceKind === "direct" && <>
        <FormRow label="Source system" required>
          <SysSelect value={p.sourceSystem} onChange={v => set({ sourceSystem: v, sourceCol: "" })} />
        </FormRow>
        <FormRow label="Source table / topic">
          <input className="winput winput-mono" placeholder="accounts" value={p.sourceTable} onChange={e => set({ sourceTable: e.target.value })} />
        </FormRow>
        <FormRow label="Source column" required hint={srcCols.length + " columns discovered from " + p.sourceSystem}>
          <ColSelect cols={srcCols} value={p.sourceCol} onChange={v => set({ sourceCol: v })} />
        </FormRow>
        <FormRow label="Type coercion">
          <Seg options={["auto","strict","custom"]} value={p.coercion} onChange={v => set({ coercion: v })} />
        </FormRow>
        <FormRow label="Update cadence" last>
          <Seg options={["streaming","5min","hourly","daily"]} value={p.schedule || "5min"} onChange={v => set({ schedule: v })} />
        </FormRow>
      </>}

      {p.sourceKind === "computed" && <>
        <FormRow label="Expression" hint="Reference other properties by name. Supports CASE, COALESCE, arithmetic, string functions.">
          <textarea className="winput winput-mono winput-code" rows="7" placeholder={"CASE\n  WHEN arr_usd >= 100000 THEN 'ENT'\n  WHEN arr_usd >= 10000  THEN 'MM'\n  ELSE 'SMB'\nEND"} value={p.expression} onChange={e => set({ expression: e.target.value })} />
        </FormRow>
        <FormRow label="Re-evaluate on">
          <Seg options={["any_change","schedule","manual"]} value={p.reeval || "any_change"} onChange={v => set({ reeval: v })} />
        </FormRow>
        <FormRow label="Fallback if expression fails" last>
          <CustomSelect value={p.fallback || "null"} onChange={v => set({ fallback: v })} options={[
            { id: "null",    label: "null",          desc: "Store null silently" },
            { id: "default", label: "Use default",   desc: "Fall back to the defined default value" },
            { id: "error",   label: "Surface error", desc: "Write fails; shows in quality dashboard" },
          ]} />
        </FormRow>
      </>}

      {p.sourceKind === "agent" && <>
        <FormRow label="Authoring agent">
          <CustomSelect value={p.agentId} onChange={v => set({ agentId: v })} placeholder="— pick agent —"
            options={agents.map(a => ({ id: a.id, label: a.label, desc: a.desc }))} />
        </FormRow>
        <FormRow label="Output field name" hint="The key in the agent's output JSON that maps to this property.">
          <input className="winput winput-mono" placeholder="score_value" value={p.agentField} onChange={e => set({ agentField: e.target.value })} />
        </FormRow>
        <FormRow label={`Confidence threshold · ${p.agentConfidence}%`} hint="Values below threshold are stored as null with a :proposed annotation." last>
          <SliderRow value={p.agentConfidence} onChange={v => set({ agentConfidence: v })} fmt={v => "≥ " + (v/100).toFixed(2)} />
        </FormRow>
      </>}

      {p.sourceKind === "constant" && <>
        <FormRow label="Constant value">
          <input className="winput winput-mono" placeholder="e.g. true, 0, SMB" value={p.constantValue} onChange={e => set({ constantValue: e.target.value })} />
        </FormRow>
        <FormRow label="Set behaviour" last>
          <CustomSelect value={p.constantBehaviour} onChange={v => set({ constantBehaviour: v })} options={[
            { id: "on_create", label: "On create only", desc: "Set once at first write, never overwritten" },
            { id: "always",    label: "Always",          desc: "Overwrite on every sync" },
            { id: "if_null",   label: "If null only",    desc: "Only sets when the current value is null" },
          ]} />
        </FormRow>
      </>}

      <BackfillBanner backfill={p.backfill} onChange={v => set({ backfill: v })} estimate="~12,400 rows · ~3.2 min in staging" />
    </StepWrap>
  );
}

// ── Step 3: Validation ────────────────────────────────────────────────────────

function PropValidation({ p, set }) {
  const isNumeric = ["int","float","decimal"].includes(p.type);
  const isString  = ["string","uuid"].includes(p.type);

  return (
    <StepWrap eyebrow="STEP 3 · VALIDATION" title="Define validation rules" desc="Rules run at write time. Violations appear in the Quality dashboard and daily drift reports.">
      {isString && (
        <FormRow label="Format preset">
          <CustomSelect value={p.validationPreset} onChange={v => set({ validationPreset: v })}
            options={VALIDATION_PRESETS.map(vp => ({ id: vp.id, label: vp.label, desc: vp.pattern ? vp.pattern.slice(0,40) + "…" : "" }))} />
        </FormRow>
      )}

      {isString && (
        <FormRow label="Custom regex" optional hint="Applied after format preset. Failed rows are flagged, not rejected, unless mode is strict.">
          <div className="wfr-prefix-input">
            <span className="wfr-prefix">/</span>
            <input className="winput winput-mono" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }} placeholder="^[A-Z]{2,3}-\d{4}$" value={p.customRegex} onChange={e => set({ customRegex: e.target.value })} />
            <span className="wfr-prefix wfr-suffix">/i</span>
          </div>
        </FormRow>
      )}

      {isNumeric && (
        <FormRow label="Value range" hint="Both bounds are inclusive. Leave blank for no constraint.">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input className="winput winput-mono" placeholder="min" style={{ width: 120 }} value={p.minVal} onChange={e => set({ minVal: e.target.value })} />
            <span style={{ color: "var(--ink-3)", fontFamily: "JetBrains Mono", fontSize: 13 }}>to</span>
            <input className="winput winput-mono" placeholder="max" style={{ width: 120 }} value={p.maxVal} onChange={e => set({ maxVal: e.target.value })} />
          </div>
        </FormRow>
      )}

      {p.type === "enum" && (
        <FormRow label="On unknown enum value">
          <CustomSelect value={p.enumUnknown || "reject"} onChange={v => set({ enumUnknown: v })} options={[
            { id: "reject",     label: "Reject",     desc: "Write fails for any unlisted value" },
            { id: "null",       label: "Null",        desc: "Store null; behavior is preserved" },
            { id: "quarantine", label: "Quarantine",  desc: "Proposed state pending enum expansion review" },
            { id: "allow_new",  label: "Allow new",  desc: "Enum auto-expands; triggers drift notification" },
          ]} />
        </FormRow>
      )}

      <FormRow label="Null policy">
        <Seg options={["allow","warn","reject"]} value={p.nullPolicy} onChange={v => set({ nullPolicy: v })} />
      </FormRow>

      <FormRow label="Validation mode" hint={
        p.validationMode === "log" ? "Violations surface in reporting but don't block writes." :
        p.validationMode === "warn" ? "Violations create warning events consumers can filter on." :
        "Any violation causes the entire write to fail."
      } last>
        <Seg options={["log","warn","strict"]} value={p.validationMode} onChange={v => set({ validationMode: v })} />
      </FormRow>
    </StepWrap>
  );
}

// ── Step 4: Governance ────────────────────────────────────────────────────────

function PropGovernance({ p, set }) {
  return (
    <StepWrap eyebrow="STEP 4 · GOVERNANCE" title="PII classification, access, and retention" desc="These settings follow this property across every system that reads it. Retrofitting PII classification is expensive — get it right now.">
      <FormRow label="PII classification" required hint={PII_TIERS.find(t => t.id === p.piiTier)?.desc}>
        <PIISelect value={p.piiTier} onChange={v => set({ piiTier: v })} />
      </FormRow>

      <FormRow label="Masking rule" hint={MASKING_RULES.find(m => m.id === p.maskingRule)?.desc}>
        <CustomSelect value={p.maskingRule} onChange={v => set({ maskingRule: v })}
          options={MASKING_RULES} />
      </FormRow>

      <FormRow label="Retention policy">
        <CustomSelect value={p.retention} onChange={v => set({ retention: v })}
          options={RETENTION_OPTS} />
      </FormRow>

      <FormRow label="Access roles" hint="Who can read this property value.">
        <MultiToken options={ROLES} value={p.accessRoles} onChange={v => set({ accessRoles: v })} placeholder="add roles…" />
      </FormRow>

      <FormRow label="Tags">
        <MultiToken options={GOV_TAGS} value={p.tags} onChange={v => set({ tags: v })} placeholder="add tags…" />
      </FormRow>

      <FormRow label="Change risk" hint={
        p.changeRisk === "LOW" ? "Self-approval. Lands on next deploy." :
        p.changeRisk === "MEDIUM" ? "1 reviewer from owner team required." :
        "2 reviewers (owner + governance) + staging soak ≥ 24 h."
      } last>
        <Seg risk options={[{id:"LOW",label:"LOW"},{id:"MEDIUM",label:"MEDIUM"},{id:"HIGH",label:"HIGH"}]} value={p.changeRisk} onChange={v => set({ changeRisk: v })} />
      </FormRow>
    </StepWrap>
  );
}

// ── Step 5: Review ────────────────────────────────────────────────────────────

function PropReview({ p, set, node, nameCleaned, onClose }) {
  const piiTier = ({ none:"None", pseudonymous:"Pseudonymous", personal:"Personal", sensitive:"Sensitive", restricted:"Restricted" })[p.piiTier];
  const approvers = p.changeRisk === "HIGH"
    ? [{ who: "morgan.lee", team: "data-platform" }, { who: "ramin.k", team: "governance" }]
    : p.changeRisk === "MEDIUM" ? [{ who: "morgan.lee", team: "data-platform" }] : [];

  const cypher = `ALTER NODE TYPE :${node?.label?.replace(/\s/g,"") || "Node"}
  ADD PROPERTY ${nameCleaned || "new_property"} ${p.type.toUpperCase()}${p.required ? " NOT NULL" : ""}${p.defaultValue ? ` DEFAULT ${p.defaultValue}` : ""};
${p.indexed ? `CREATE INDEX ON :${node?.label?.replace(/\s/g,"")}(${nameCleaned});` : ""}
${p.piiTier !== "none" ? `TAG PROPERTY :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) AS PII TIER ${p.piiTier.toUpperCase()};` : ""}
${p.maskingRule !== "none" ? `SET MASKING ON :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) = "${p.maskingRule}";` : ""}
GRANT READ ON :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) TO ROLES (${p.accessRoles.join(", ")});
${p.retention !== "inherit" ? `SET RETENTION ON :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) = "${p.retention}";` : ""}
${p.backfill ? `BACKFILL :${node?.label?.replace(/\s/g,"")}(${nameCleaned}) FROM SOURCE "${p.sourceSystem}" COLUMN "${p.sourceCol || "?"}";` : ""}`;

  return (
    <StepWrap eyebrow="STEP 5 · REVIEW & PUBLISH" title="Last look before this lands in the schema" desc="Once published the property appears in the next schema version with a full audit trail.">
      <div className="review-col">
        <section className="card">
          <div className="card-head">Summary</div>
          <ul className="rev-list">
            {[
              ["Name",      <code>.{nameCleaned || "?"}</code>],
              ["Type",      p.type],
              ["Flags",     [p.required && "required", p.indexed && "indexed", p.unique && "unique"].filter(Boolean).join(" · ") || "—"],
              ["Source",    p.sourceKind + (p.sourceCol ? " · " + p.sourceCol : "")],
              ["PII tier",  piiTier],
              ["Masking",   MASKING_RULES.find(m => m.id === p.maskingRule)?.label],
              ["Retention", p.retention],
              ["Access",    p.accessRoles.join(", ") || "—"],
              ["Risk",      <span className={"nv-change nv-change-" + p.changeRisk.toLowerCase()}>{p.changeRisk}</span>],
              ["Backfill",  p.backfill ? "on" : "off"],
            ].map(([k, v], i) => <li key={i}><span className="rev-k">{k}</span><span className="rev-v">{v}</span></li>)}
          </ul>
        </section>

        <section className="card">
          <div className="card-head">Approvers</div>
          {approvers.length === 0
            ? <div className="card-body" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Low risk · self-approve.</div>
            : <ul className="approver-list">{approvers.map((a, i) => (
              <li key={i} className="approver-row">
                <span className="appr-avatar">{a.who[0].toUpperCase()}</span>
                <div><div className="appr-who">{a.who}</div><div className="appr-team">{a.team}</div></div>
                <span className="appr-status">awaiting</span>
              </li>
            ))}</ul>
          }
        </section>

        <section className="card">
          <div className="card-head">Target stage</div>
          <div className="card-body" style={{ padding: "14px 18px" }}>
            <Seg options={["draft","staging","live"]} value={p.stage} onChange={v => set({ stage: v })} />
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-3)", fontFamily: "JetBrains Mono" }}>
              {p.stage === "draft" ? "Working branch — no consumers see it yet." :
               p.stage === "staging" ? "Runs in staging graph — safe for agent test runs." :
               "Production — all consumers gain this property now."}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head card-head-row">
            <div>Migration <span className="card-head-sub">cypher diff</span></div>
            <div className="card-head-actions"><button className="btn-ghost">Copy</button></div>
          </div>
          <pre className="cypher-block">{cypher}</pre>
        </section>
      </div>
    </StepWrap>
  );
}

// ── Prop Preview ──────────────────────────────────────────────────────────────

function PropPreview({ p, node, nameCleaned }) {
  const piiTier = PII_TIERS.find(t => t.id === p.piiTier);
  return (
    <div className="preview-stack">
      <div className="preview-block">
        <div className="preview-head">Property preview</div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <code style={{ fontFamily: "JetBrains Mono", fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>.{nameCleaned || "property_name"}</code>
            <span className="ppc-type">{p.type}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {p.required && <span className="snap-tag">req</span>}
            {p.indexed   && <span className="snap-tag snap-idx">idx</span>}
            {p.unique    && <span className="snap-tag snap-idx">unique</span>}
            {p.piiTier !== "none" && <span className="snap-tag snap-pii">PII · {p.piiTier}</span>}
            {p.sourceKind === "computed" && <span className="snap-tag snap-comp">fx</span>}
            {p.sourceKind === "agent"    && <span className="snap-tag snap-comp">agent</span>}
          </div>
          {p.description && <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.4 }}>{p.description}</div>}
          {p.exampleValue && <div style={{ marginTop: 6, fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--ink-3)" }}>e.g. <code style={{ background: "var(--chip)", padding: "1px 5px", borderRadius: 3, color: "var(--ink)" }}>{p.exampleValue}</code></div>}
        </div>
      </div>
      <div className="preview-block">
        <div className="preview-head">Validation</div>
        <ul className="preview-checks">
          {[
            [nameCleaned.length >= 2, "Name is valid"],
            [!!p.type, "Type selected"],
            [!!p.piiTier, "PII tier set"],
            [p.accessRoles.length > 0, "Access roles assigned"],
          ].map(([ok, label], i) => (
            <li key={i} className={"check " + (ok ? "check-ok" : "check-pend")}><span className="check-dot" /> {label}</li>
          ))}
          {p.piiTier !== "none" && <li className="check check-info"><span className="check-dot" /> PII — change risk auto-elevated</li>}
        </ul>
      </div>
      <div className="preview-block">
        <div className="preview-head">Schema snippet</div>
        <pre className="preview-code">{`(:${node?.label?.replace(/\s/g,"") || "Node"} {
  ${nameCleaned || "property_name"}: ${p.type}${p.required ? " // required" : ""}${p.piiTier !== "none" ? "\n  // PII: " + p.piiTier : ""}
})`}</pre>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  LINK SOURCE WIZARD
// ════════════════════════════════════════════════════════════════════════════

const SRC_STEPS = [
  { label: "Source system", hint: "Pick connector from catalog" },
  { label: "Connection",    hint: "Pick or add a connection"   },
  { label: "Object",        hint: "Choose what to read"        },
  { label: "Map columns",   hint: "Map source → node props"    },
  { label: "Settings",      hint: "Pipeline, ingestion, tier"  },
  { label: "Review",        hint: "Config & publish"          },
];

const LOAD_STRATEGIES = [
  { id: "incremental", label: "Incremental", tag: "INCR",     desc: "Read rows where updated_at > last watermark. Fast; requires a reliable timestamp." },
  { id: "cdc",         label: "CDC",          tag: "CDC",      desc: "Capture database change events. Near-zero lag; requires Debezium/connector support." },
  { id: "full",        label: "Full load",    tag: "FULL",     desc: "Replace the entire object on every run. Safe but expensive; for small reference tables." },
];

const ERROR_POLICIES = [
  { id: "alert",       label: "Alert + continue",   desc: "Notify and continue processing remaining rows." },
  { id: "quarantine",  label: "Quarantine row",     desc: "Move failing rows to quarantine table for manual review." },
  { id: "rollback",    label: "Rollback batch",     desc: "Roll back entire batch on any error. Safest, slowest." },
  { id: "dead_letter", label: "Dead-letter queue",  desc: "Route errors to DLQ; on-call paged after threshold." },
];

// ── Unstructured "what to read" config ────────────────────────────────────────
// Container/item nouns + the source-provided metadata filters + example document
// sets, tuned per connector. Everything falls back to a sensible file/folder model.
const READ_CONFIGS = {
  _default: {
    container: "folders", item: "files",
    linkPh: "Paste a link or path…",
    filters: [
      { key: "fileTypes",     label: "File types",     type: "chips", options: ["PDF", "DOCX", "DOC", "TXT", "RTF", "PPTX", "XLSX", "CSV", "MD", "HTML"] },
      { key: "owner",         label: "Owner / author", type: "text",  ph: "name or email" },
      { key: "modifiedAfter", label: "Modified after", type: "date" },
      { key: "addedAfter",    label: "Added after",    type: "date" },
      { key: "nameContains",  label: "Name contains",  type: "text",  ph: "e.g. MSA, contract" },
    ],
    starts: ["Contracts", "MSAs", "NDAs", "SOWs", "Invoices", "Policies", "Reports"],
  },
  googledrive: { entity: "document", linkPh: "https://drive.google.com/drive/folders/…" },
  sharepoint:  { entity: "document", container: "libraries", linkPh: "https://acme.sharepoint.com/sites/Legal/…" },
  onedrive:    { entity: "document", linkPh: "https://acme-my.sharepoint.com/personal/…" },
  dropbox:     { entity: "document", linkPh: "https://www.dropbox.com/home/…" },
  box:         { entity: "document", linkPh: "https://app.box.com/folder/…" },
  s3: {
    container: "buckets / prefixes", item: "objects", linkPh: "s3://acme-legal/contracts/",
    filters: [
      { key: "fileTypes",     label: "File types",     type: "chips", options: ["PDF", "DOCX", "TXT", "CSV", "JSON", "PARQUET", "HTML", "EML"] },
      { key: "prefix",        label: "Key prefix",     type: "text",  ph: "contracts/2024/" },
      { key: "modifiedAfter", label: "Modified after", type: "date" },
      { key: "minSize",       label: "Min object size", type: "select", options: ["Any", "> 10 KB", "> 100 KB", "> 1 MB"] },
    ],
    starts: ["Contracts", "Invoices", "Statements", "Reports", "Logs"],
  },
  gcs: {
    container: "buckets / prefixes", item: "objects", linkPh: "gs://acme-legal/contracts/",
    filters: [
      { key: "fileTypes",     label: "File types",     type: "chips", options: ["PDF", "DOCX", "TXT", "CSV", "JSON", "PARQUET", "HTML"] },
      { key: "prefix",        label: "Key prefix",     type: "text",  ph: "contracts/2024/" },
      { key: "modifiedAfter", label: "Modified after", type: "date" },
    ],
    starts: ["Contracts", "Invoices", "Statements", "Reports"],
  },
  slack: {
    container: "channels", item: "messages", linkPh: "#channel-name or channel link",
    filters: [
      { key: "fromUser", label: "From user",     type: "text",  ph: "@user" },
      { key: "after",    label: "After",         type: "date" },
      { key: "kind",     label: "Message kind",  type: "chips", options: ["Any", "With files", "Threads only", "Pinned"] },
      { key: "contains", label: "Text contains", type: "text" },
    ],
    starts: ["Incidents", "Decisions", "Announcements", "Support threads"],
  },
  teams: {
    container: "channels", item: "messages", entity: "message", linkPh: "Channel name or link",
    filters: [
      { key: "fromUser", label: "From user",    type: "text",  ph: "name or email" },
      { key: "after",    label: "After",        type: "date" },
      { key: "kind",     label: "Message kind", type: "chips", options: ["Any", "With files", "Meetings", "Posts"] },
      { key: "contains", label: "Text contains", type: "text" },
    ],
    starts: ["Decisions", "Incidents", "Meeting recaps", "Announcements"],
  },
  gmail: {
    container: "labels", item: "emails", linkPh: "Label name…",
    filters: [
      { key: "from",      label: "From",             type: "text",  ph: "sender@…" },
      { key: "subject",   label: "Subject contains", type: "text" },
      { key: "after",     label: "After",            type: "date" },
      { key: "hasAttach", label: "Has attachment",   type: "chips", options: ["Any", "With attachments"] },
      { key: "fileTypes", label: "Attachment types", type: "chips", options: ["PDF", "DOCX", "XLSX", "CSV"] },
    ],
    starts: ["Order confirmations", "Vendor invoices", "Support replies", "Renewal notices"],
  },
  outlook: {
    container: "folders", item: "emails", linkPh: "Folder name…",
    filters: [
      { key: "from",      label: "From",             type: "text",  ph: "sender@…" },
      { key: "subject",   label: "Subject contains", type: "text" },
      { key: "after",     label: "After",            type: "date" },
      { key: "hasAttach", label: "Has attachment",   type: "chips", options: ["Any", "With attachments"] },
    ],
    starts: ["Order confirmations", "Vendor invoices", "Support replies", "Renewal notices"],
  },
  confluence: {
    container: "spaces", item: "pages", linkPh: "Space key or page link",
    filters: [
      { key: "space",        label: "Space",         type: "text" },
      { key: "labelTag",     label: "Label",         type: "text" },
      { key: "author",       label: "Author",        type: "text" },
      { key: "updatedAfter", label: "Updated after", type: "date" },
    ],
    starts: ["Runbooks", "Policies", "Design docs", "Specs"],
  },
  notion: {
    container: "databases", item: "pages", linkPh: "Notion page or database link",
    filters: [
      { key: "author",       label: "Created by",    type: "text" },
      { key: "updatedAfter", label: "Updated after", type: "date" },
      { key: "nameContains", label: "Title contains", type: "text" },
    ],
    starts: ["Wikis", "Specs", "Notes", "Trackers"],
  },
  github: {
    container: "repositories", item: "files", linkPh: "org/repo or repo URL",
    filters: [
      { key: "branch",       label: "Branch",        type: "text",  ph: "main" },
      { key: "pathGlob",     label: "Path glob",     type: "text",  ph: "docs/**/*.md" },
      { key: "fileTypes",    label: "File types",    type: "chips", options: ["MD", "TXT", "PY", "TS", "JSON", "YAML"] },
      { key: "updatedAfter", label: "Updated after", type: "date" },
    ],
    starts: ["READMEs", "Docs", "ADRs", "Changelogs"],
  },
  gitlab: {
    container: "repositories", item: "files", linkPh: "group/project or repo URL",
    filters: [
      { key: "branch",    label: "Branch",     type: "text",  ph: "main" },
      { key: "pathGlob",  label: "Path glob",  type: "text",  ph: "docs/**/*.md" },
      { key: "fileTypes", label: "File types", type: "chips", options: ["MD", "TXT", "PY", "TS", "JSON", "YAML"] },
    ],
    starts: ["READMEs", "Docs", "ADRs"],
  },
  intercom: { container: "inboxes", item: "conversations", linkPh: "Inbox name…", starts: ["Resolved", "Escalations", "Billing", "Onboarding"] },
  zoom:     { container: "folders", item: "recordings",    linkPh: "Recording folder…", starts: ["All-hands", "Customer calls", "Interviews"] },
  figma:    { container: "projects", item: "files",        linkPh: "Project or file link", starts: ["Specs", "Flows", "Components"] },
};
function getReadConfig(sel) {
  return Object.assign({}, READ_CONFIGS._default, (sel && READ_CONFIGS[sel.id]) || {});
}
const EXTRACT_AGENTS = ["Contract Analyst", "Document Extractor", "Risk Reviewer", "Invoice Parser", "Resume Screener"];
const EXTRACT_AUTOMATIONS = ["PDF Form Parser", "Regex Extractor", "Apache Tika Pipeline", "AWS Textract Pipeline", "Layout Parser"];
const EXTRACT_TYPES = ["string", "date", "number", "boolean", "enum", "list", "json"];
// Auto-captured file/object metadata available to map for any unstructured source.
const UNSTRUCTURED_META_COLS = [
  { col: "file_id",     type: "uuid",      sample: "1aF3kq…",          meta: true },
  { col: "file_name",   type: "string",    sample: "MSA_Acme.pdf",     meta: true },
  { col: "file_type",   type: "string",    sample: "pdf",              meta: true },
  { col: "source_url",  type: "string",    sample: "drive://…/MSA…",   meta: true },
  { col: "owner",       type: "string",    sample: "legal@acme.com",   meta: true },
  { col: "created_at",  type: "timestamp", sample: "2024-01-12",       meta: true },
  { col: "modified_at", type: "timestamp", sample: "2024-06-01",       meta: true },
  { col: "size_bytes",  type: "int",       sample: "284913",           meta: true },
];

function LinkSourceFlow({ node, existingSources, onClose, editSource }) {
  const [step, setStep] = useState(0);
  const [mapOpenCol, setMapOpenCol] = useState("");
  const [mapActiveObj, setMapActiveObj] = useState("");
  const [s, setS] = useState(() => {
    const base = {
      system: "", customName: "", connection: "", newConnName: "", newConnHost: "", newConnAuth: "OAuth2",
      table: "", tables: [], query: "", inputMode: "table",
      pkCol: "", joinCol: "", incrementalCol: "updated_at",
      loadStrategy: "incremental", mapping: {}, transforms: {}, recordFilters: {}, transformedFields: {}, objectAgents: {}, unmappedPolicy: "ignore",
      cadence: "5min", freshnessSLO: "30m", batchWindow: "15m",
      retryCount: 3, retryDelay: "5m", onError: "alert",
      alertChannel: "#schema-alerts", owner: "data-platform",
      stage: "staging", backfill: true, backfillWindow: "30d", tags: [],
      // Unstructured-source flow state
      readScope: "", readLocations: [], readFilters: {}, readStarts: [],
      extractMethod: "", extractAgent: "", extractAutomation: "", extractFields: [],
      // Unstructured: runtime entity discovery + per-entity destination node
      entityAgent: "", extractRan: false, entityInclude: {}, entityNode: {},
    };
    return editSource ? buildEditState(editSource, node, base) : base;
  });

  const set = patch => setS(v => ({ ...v, ...patch }));
  const sel = SOURCE_SYSTEMS.find(x => x.id === s.system);
  const srcCols = s.system ? getSourceCols(s.system) : [];
  const rawNodeProps = node ? (window.generateProps ? window.generateProps(node) : (window.PROPS_BY_NODE?.[node.id] || [])) : [];
  const nodeProps = rawNodeProps.map(p => ({ id: p.name, label: p.name, type: p.type }));
  const unstructured = !!(sel && sel.kind === "unstructured");
  const readCfg = getReadConfig(sel);
  const readLocs = s.readLocations || [];
  // When scope targets specific folders/files AND the user declares a single
  // known document type, we skip discovery entirely — the type is already known.
  const scopeSpecific = s.readScope === "folders" || s.readScope === "files";
  const wantsSingle = unstructured && scopeSpecific && s.contentMode === "single";
  const knownTypeText = (s.knownType || "").trim();
  const knownTypeMode = wantsSingle && !!knownTypeText;
  const allDocTypes = unstructured ? getDiscoveredEntities(sel) : [];
  // The declared type may match the catalog (reuse its fields) or be free text
  // we've never seen (synthesize an entity — fields get filled by extraction).
  const knownEntity = wantsSingle
    ? (allDocTypes.find(e => e.name.toLowerCase() === knownTypeText.toLowerCase())
       || { id: "custom_" + (knownTypeText.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "type"), name: knownTypeText || "Selected type", records: "—", conf: 100, fields: [] })
    : null;
  // Unstructured: entities are discovered at runtime (mixed), or the one declared type.
  const discoveredEntities = unstructured && s.extractRan ? allDocTypes : [];
  const includedEntities = wantsSingle
    ? [knownEntity]
    : discoveredEntities.filter(e => (s.entityInclude || {})[e.id] !== false);
  // Mapping groups — one per selected object (structured) or per discovered entity
  // (unstructured). Each group's columns are mapped independently; mapping keys are
  // namespaced as "<group>::<col>" so identically-named columns don't collide.
  const allObjects = sel && !unstructured ? getSourceObjects(sel.id, sel) : [];
  const selectedTables = s.tables || [];
  const mapGroups = unstructured
    ? includedEntities.map(e => ({ name: e.id, label: e.name, type: "Entity", rows: e.records, cols: UNSTRUCTURED_META_COLS }))
    : selectedTables.map(nm => { const o = allObjects.find(x => x.name === nm) || { name: nm }; return { name: nm, type: o.type, rows: o.rows, cols: getObjectCols(o) }; });
  // A group's mappable fields = its source columns + any agent-extracted fields.
  const mapColsOf = g => g.cols.concat(agentFieldsFor(s, g.name));
  const mapKeys = mapGroups.reduce((acc, g) => acc.concat(mapColsOf(g).map(c => g.name + "::" + c.col)), []);
  const mappedCount = mapKeys.filter(k => (s.mapping || {})[k]).length;
  const totalMapCols = mapKeys.length;
  // Active object for the per-object mapping sub-navigation.
  const activeMapObj = (mapActiveObj && mapGroups.some(g => g.name === mapActiveObj)) ? mapActiveObj : (mapGroups[0] ? mapGroups[0].name : "");
  const mapSubItems = mapGroups.length > 1 ? mapGroups.map(g => {
    const cols = mapColsOf(g);
    const newNode = unstructured && (s.entityNode || {})[g.name] === "__new__";
    const gm = newNode ? cols.length : cols.filter(c => (s.mapping || {})[g.name + "::" + c.col]).length;
    return { id: g.name, label: g.label || g.name, mapped: gm, total: cols.length, type: g.type, done: gm > 0 };
  }) : null;
  const settingsHint = (s.pipelineType === "scheduled" ? "Scheduled" : "Real Time") + " · " + (s.resourceTier || "Small");
  const uCfg = s.uSettings || {};
  const uToggles = U_SETTINGS.filter(o => o.control !== "add");
  const uOnCount = uToggles.filter(o => (o.id in uCfg ? uCfg[o.id] : o.default)).length;
  const uSettingsHint = uOnCount ? uOnCount + " of " + uToggles.length + " on" : "Configure source";
  // Discover Files only exists in the unstructured "mixed" path. Its absence
  // shifts the later steps up by one.
  const idxDiscover = (unstructured && !wantsSingle) ? 3 : -1;
  const idxExtract = unstructured ? (wantsSingle ? 3 : 4) : 3;
  const idxMap = unstructured ? (wantsSingle ? 4 : 5) : 4;
  const idxSettings = unstructured ? (wantsSingle ? 5 : 6) : 5;
  const scopeOk = s.readScope === "all" || (scopeSpecific && readLocs.length > 0);
  const contentOk = !wantsSingle || !!knownTypeText; // single mode must declare a type
  const canNext = step === 0 ? !!s.system
    : step === 1 ? !!s.connection
    : step === 2 ? (unstructured ? (scopeOk && contentOk) : (selectedTables.length > 0 || !!s.query))
    : step === idxDiscover ? (s.extractRan && includedEntities.length > 0)
    : true;

  // Sidebar hints reflect the live selections, not static copy.
  const conns = sel ? getConnections(sel.id, sel) : [];
  const connLabel = s.connection === "__new__" ? "New connection" : (conns.find(c => c.id === s.connection)?.name || "Pick or add a connection");
  const readHint = !s.readScope
    ? "Choose what to read"
    : s.readScope === "all"
    ? "All " + readCfg.item
    : readLocs.length ? readLocs.length + " " + (readLocs.length === 1 ? readCfg.container.replace(/s$/, "") : readCfg.container)
    : "Pick " + readCfg.container;
  const objectsHint = s.extractRan ? includedEntities.length + " file type" + (includedEntities.length === 1 ? "" : "s") : "Find file types";
  const uAgentsAssigned = includedEntities.filter(e => { var a = (s.objectAgents || {})[e.id]; return Array.isArray(a) ? a.length > 0 : !!a; }).length;
  const uExtractHint = uAgentsAssigned ? uAgentsAssigned + " of " + includedEntities.length + " assigned" : "Optional";
  const mapHint = mappedCount ? `${mappedCount} mapped` : "Map file types to nodes";
  const objectHint = selectedTables.length ? selectedTables.length + " object" + (selectedTables.length === 1 ? "" : "s") : (s.query ? "Custom SQL" : "Choose what to read");
  const objAgents = s.objectAgents || {};
  const agentsAssigned = selectedTables.filter(t => objAgents[t]).length;
  const agentsHint = agentsAssigned ? agentsAssigned + " of " + selectedTables.length + " assigned" : "Optional";
  const colMapHint = totalMapCols ? `${mappedCount}/${totalMapCols} fields mapped` : "Map source → node props";
  const knownTypeLabel = knownTypeMode ? knownEntity.name : "";
  const srcSteps = unstructured ? [
    { label: "Source system", hint: sel ? sel.name : "Pick connector from catalog" },
    { label: "Connection",    hint: connLabel },
    { label: "Scope",         hint: knownTypeMode ? readHint + " · " + knownTypeLabel : readHint },
  ].concat(wantsSingle ? [] : [
    { label: "Discover Files", hint: objectsHint },
  ]).concat([
    { label: "Extract fields", hint: uExtractHint },
    { label: "Map",           hint: mapHint, subItems: mapSubItems, activeSub: activeMapObj, onSub: setMapActiveObj },
    { label: "Settings",      hint: uSettingsHint },
  ]) : [
    { label: "Source system",  hint: sel ? sel.name : "Pick connector from catalog" },
    { label: "Connection",     hint: connLabel },
    { label: "Objects",        hint: objectHint },
    { label: "Extract data",   hint: agentsHint },
    { label: "Map columns", hint: colMapHint, subItems: mapSubItems, activeSub: activeMapObj, onSub: setMapActiveObj },
    { label: "Settings", hint: settingsHint },
  ];

  const titleFrom = sel ? (
    <span className="flow-title-from">
      <span className="csel-sys-icon" style={{ background: sel.color + "1a", color: sel.color, borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>{sel.icon}</span>
      {sel.name}
    </span>
  ) : <span className="flow-title-empty">choose source</span>;

  const titleTo = (
    <span className="flow-title-to">
      {node && window.ListGlyph && <window.ListGlyph node={node} size={18} />}
      {node?.label}
    </span>
  );

  return (
    <>
    <FlowStyles />
    <WizardShell
      plainTitle={editSource ? "Edit pipeline" : "Add Data Sources"} fullScreen
      stage={s.stage} hideStage hideKeymap hideFootHelp
      steps={srcSteps} step={step} setStep={setStep}
      canNext={canNext}
      onNext={() => setStep(x => x + 1)}
      onPublish={onClose}
      onClose={onClose}
      rightPane={null}
      overlay={mapOpenCol ? (function(){
        const ix = mapOpenCol.indexOf("::");
        const objName = ix >= 0 ? mapOpenCol.slice(0, ix) : "";
        const colName = ix >= 0 ? mapOpenCol.slice(ix + 2) : mapOpenCol;
        // "+ Transformed field" opens the same drawer in new-field mode.
        if (colName === "__newtf__") {
          const grp = mapGroups.find(g => g.name === objName);
          return <SrcTransformDrawer newField cols={grp ? grp.cols : []} objName={objName} sel={sel}
            onSave={tf => { const cur = s.transformedFields || {}; const arr = (cur[objName] || []).concat([Object.assign({ id: "tf-" + Date.now() }, tf)]); set({ transformedFields: Object.assign({}, cur, (function(){ var o = {}; o[objName] = arr; return o; })()) }); setMapOpenCol(""); }}
            onClose={() => setMapOpenCol("")} />;
        }
        let colType = "string";
        for (let gi = 0; gi < mapGroups.length; gi++) { const c = mapGroups[gi].cols.find(x => x.col === colName); if (c) { colType = c.type; break; } }
        return <SrcTransformDrawer col={colName} type={colType} sel={sel} list={(s.transforms || {})[mapOpenCol] || []} onChange={arr => set({ transforms: Object.assign({}, s.transforms, (function(){ var o = {}; o[mapOpenCol] = arr; return o; })()) })} onClose={() => setMapOpenCol("")} />;
      })() : null}
    >
      {step === 0 && <SrcSystem s={s} set={set} />}
      {step === 1 && <SrcConnection s={s} set={set} sel={sel} />}
      {unstructured ? (
        <>
          {step === 2 && <SrcRead s={s} set={set} sel={sel} />}
          {step === idxDiscover && <SrcDiscover s={s} set={set} sel={sel} />}
          {step === idxExtract && <SrcObjectAgents s={s} set={set} groups={mapGroups} sel={sel} fileMode
            agentPoolFor={g => ({ agents: [extractionAgentFor(g.name)].filter(Boolean).concat(DOC_ENRICH_AGENTS), automations: RUN_AUTOMATIONS })} />}
          {step === idxMap && <SrcEntityMap s={s} set={set} groups={mapGroups} activeObj={activeMapObj} sel={sel} openCol={mapOpenCol} setOpenCol={setMapOpenCol} />}
          {step === idxSettings && <SrcUnstructuredSettings s={s} set={set} />}
        </>
      ) : (
        <>
          {step === 2 && <SrcObject s={s} set={set} sel={sel} />}
          {step === 3 && <SrcObjectAgents s={s} set={set} groups={mapGroups} sel={sel} />}
          {step === 4 && <SrcMapping s={s} set={set} groups={mapGroups} activeObj={activeMapObj} nodeProps={nodeProps} node={node} sel={sel} openCol={mapOpenCol} setOpenCol={setMapOpenCol} />}
          {step === 5 && <SrcSchedule s={s} set={set} srcCols={srcCols} />}
        </>
      )}
    </WizardShell>
    </>
  );
}

// ── Src Step 1: System ────────────────────────────────────────────────────────

// Logo with a graceful fallback chain: Simple Icons brand mark → the brand's
// favicon (covers logos removed from Simple Icons, e.g. Salesforce, Slack,
// Microsoft & AWS products) → a coloured text glyph.
// Clearbit gives full-color brand logos; Google favicon API for Google products
const CLEARBIT_DOMAINS = {
  hubspot: "hubspot.com", netsuite: "netsuite.com", slack: "slack.com",
  monday: "monday.com", docusign: "docusign.com", zendesk: "zendesk.com",
  apolloio: "apollo.io", amplitude: "amplitude.com", monday2: "monday.com",
};
// Google product domains mapped by slug so favicons resolve to the right colorful icon
const GOOGLE_FAVICON_DOMAINS = {
  gmail: "mail.google.com", googledrive: "drive.google.com",
  googlecalendar: "calendar.google.com", googlemeet: "meet.google.com",
};
const FAV = (d) => `https://www.google.com/s2/favicons?sz=128&domain=${d}`;
const CONNECTOR_LOGO_OVERRIDES = {
  hubspot:        "/logos/hubspot.png",
  netsuite:       "/logos/netsuite.svg",
  slack:          FAV("slack.com"),
  monday:         FAV("monday.com"),
  docusign:       FAV("docusign.com"),
  apollo:         "/logos/apollo.svg",
  postgresql:     FAV("postgresql.org"),
  salesforce:     FAV("salesforce.com"),
  zendesk:        FAV("zendesk.com"),
  gitbook:        FAV("gitbook.com"),
  gmail:          "/logos/gmail.png",
  googledrive:    "/logos/googledrive.png",
  gcal:           "/logos/gcal.png",
  googlecalendar: "/logos/gcal.png",
  googlemeet:     FAV("meet.google.com"),
  support:        FAV("unifyapps.com"),
  productdocs:    FAV("unifyapps.com"),
  productusage:   FAV("unifyapps.com"),
  unifyapps:      FAV("unifyapps.com"),
};

function SrcConnectorLogo({ c, size }) {
  size = size || 22;
  const box = size + 12;
  const slug = c.slug || "";
  // Use explicit override first, then Google favicon API, then text glyph.
  const override = CONNECTOR_LOGO_OVERRIDES[slug];
  const favicon = FAV(c.domain || slug + ".com");
  const primary = override || favicon;
  const [src, setSrc] = useState(primary || favicon);
  const [failed, setFailed] = useState(!primary && !favicon);
  const onErr = () => {
    if (src !== favicon) setSrc(favicon);
    else setFailed(true);
  };
  return (
    <span style={{ width: box, height: box, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#fff", border: "1px solid var(--line)", overflow: "hidden" }}>
      {!failed && src
        ? <img src={src} width={size} height={size} alt="" style={{ display: "block", objectFit: "contain" }} onError={onErr} />
        : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: c.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: size > 20 ? 12 : 10 }}>{c.icon}</span>}
    </span>
  );
}

// Sticky bar pinned to the top of a long list so the current selection stays visible.
// A quiet selected-state chip that lives inline within the sticky list meta row —
// integrated rather than a forced bordered banner on top of the list.
function SrcSelectedChip({ c, name, sub }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, maxWidth: "60%" }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-4)", flexShrink: 0 }}>Selected</span>
      {c ? <SrcConnectorLogo c={c} size={15} /> : null}
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      {sub ? <span style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 1 }}>{"· " + sub}</span> : null}
      <span style={{ flexShrink: 0, color: "var(--green)", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>
    </span>
  );
}

// Sticky meta row: list count on the left, the (optional) quiet selected chip on the right.
function SrcListMeta({ count, noun, chip }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 6, background: "var(--bg-canvas)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 2px", marginBottom: 4, borderBottom: chip ? "1px solid var(--line-2)" : "none" }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.5px", color: "var(--ink-3)", textTransform: "uppercase", flexShrink: 0 }}>{count} {noun}</span>
      {chip}
    </div>
  );
}

function SrcSystem({ s, set }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const sel = SOURCE_SYSTEMS.find(x => x.id === s.system);
  const catOptions = [{ id: "all", label: "All categories" }].concat(SRC_CATEGORIES.map(c => ({ id: c, label: c })));
  const list = SOURCE_SYSTEMS.filter(c => c.id !== "custom").filter(c => {
    if (cat !== "all" && c.cat !== cat) return false;
    if (q && (c.name + " " + (c.desc || "")).toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
    return true;
  });
  return (
    <StepWrap wide title="Pick a source connector">
      {/* search + category dropdown */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          </span>
          <input className="winput" style={{ paddingLeft: 36 }} placeholder="Search connectors…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
        </div>
        <div style={{ width: 230, flexShrink: 0 }}>
          <CustomSelect value={cat} onChange={setCat} options={catOptions} />
        </div>
      </div>

      <SrcListMeta count={list.length} noun="connectors" chip={sel ? <SrcSelectedChip c={sel} name={sel.name} sub={sel.tag} /> : null} />

      <div style={{ border: "1px solid var(--line)", borderRadius: 11, overflow: "hidden", background: "var(--panel)" }}>
        {list.map((c, i) => {
          const on = s.system === c.id;
          return (
            <button key={c.id} onClick={() => set({ system: c.id })}
              style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", padding: "12px 14px", border: "none", borderTop: i ? "1px solid var(--line-2)" : "none", background: on ? "var(--bg-canvas)" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--panel-2)"; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
              <SrcConnectorLogo c={c} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{c.name}</span>
                  {c.status === "degraded" && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--gold)" }}>● degraded</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.desc}</div>
              </div>
              {on
                ? <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--ink)", color: "var(--bg-canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</span>
                : <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--ink-3)", padding: "5px 12px", borderRadius: 7, border: "1px solid var(--line)" }}>Select</span>}
            </button>
          );
        })}
        {list.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No connectors match “{q}”.</div>}
      </div>
    </StepWrap>
  );
}

// ── Src Step 2: Connection ────────────────────────────────────────────────────

function SrcConnStatusDot({ status }) {
  const col = status === "healthy" ? "var(--green)" : status === "degraded" ? "var(--gold)" : "var(--ink-3)";
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />;
}

function SrcConnection({ s, set, sel }) {
  const conns = sel ? getConnections(sel.id, sel) : [];
  const [newOpen, setNewOpen] = useState(false);
  const createdNew = s.connection === "__new__";
  const canCreate = (s.newConnName || "").trim().length > 0 && (s.newConnHost || "").trim().length > 0;
  const hostLabel = sel?.id === "salesforce" ? "Instance URL"
    : sel?.cat === "Data Warehouse" || sel?.cat === "Databases" ? "Host / account"
    : sel?.cat === "Files & Storage" ? "Bucket / site"
    : "Endpoint";
  return (
    <StepWrap wide title={sel ? `Connect to ${sel.name}` : "Pick a connection"}>
      {conns.length > 0 && (
        <>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.5px", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8 }}>Your connections</div>
          <div style={{ border: "1px solid var(--line)", borderRadius: 11, overflow: "hidden", background: "var(--panel)" }}>
            {conns.map((cn, i) => {
              const on = s.connection === cn.id;
              return (
                <button key={cn.id} onClick={() => set({ connection: cn.id })}
                  style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", padding: "13px 14px", border: "none", borderTop: i ? "1px solid var(--line-2)" : "none", background: on ? "var(--panel)" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--panel-2)"; }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                  {sel && <SrcConnectorLogo c={sel} size={20} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <SrcConnStatusDot status={cn.status} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{cn.name}</span>
                      {cn.status === "degraded" && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--gold)" }}>degraded</span>}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cn.detail}</div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-4)", flexShrink: 0, textAlign: "right" }}>{cn.auth}<br />used {cn.lastUsed}</span>
                  {on
                    ? <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--ink)", color: "var(--bg-canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</span>
                    : <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--ink-3)", padding: "5px 12px", borderRadius: 7, border: "1px solid var(--line)" }}>Use</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      <button onClick={() => setNewOpen(true)}
        style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "13px 14px", borderRadius: 10, borderWidth: 1, borderStyle: createdNew ? "solid" : "dashed", borderColor: createdNew ? "var(--ink)" : "var(--line)", background: createdNew ? "var(--panel)" : "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink)", textAlign: "left" }}>
        {createdNew && sel
          ? <SrcConnectorLogo c={sel} size={20} />
          : <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--chip)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--ink-2)", flexShrink: 0 }}>+</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600 }}>{createdNew ? (s.newConnName || "New connection") : "Add a new connection"}</span>
          {createdNew && s.newConnHost && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.newConnHost + " · " + s.newConnAuth}</div>}
        </div>
        {createdNew
          ? <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "var(--ink)", color: "var(--bg-canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</span>
          : <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-3)", flexShrink: 0 }}>{sel ? "to " + sel.name : ""}</span>}
      </button>

      {newOpen && (
        <div onClick={() => setNewOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,22,16,0.42)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 24, animation: "flow-fade-in 140ms ease-out" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 520, maxWidth: "92vw", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", overflow: "hidden", display: "flex", flexDirection: "column", animation: "flow-zoom-in 180ms cubic-bezier(.2,.8,.2,1)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--line-2)" }}>
              {sel && <SrcConnectorLogo c={sel} size={26} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 21, color: "var(--ink)", lineHeight: 1.1 }}>New connection</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}>{sel ? "to " + sel.name : ""}</div>
              </div>
              <button onClick={() => setNewOpen(false)} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line)", background: "none", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, fontSize: 13 }}>✕</button>
            </div>
            <div style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
              <FormRow label="Connection name" required>
                <input className="winput" placeholder={sel ? sel.name + " — production" : "My connection"} value={s.newConnName} onChange={e => set({ newConnName: e.target.value })} autoFocus />
              </FormRow>
              <FormRow label={hostLabel} required>
                <input className="winput winput-mono" placeholder={sel?.id === "salesforce" ? "acme.my.salesforce.com" : sel?.cat === "Files & Storage" ? "s3://acme-bucket" : "host.acme.internal"} value={s.newConnHost} onChange={e => set({ newConnHost: e.target.value })} />
              </FormRow>
              <FormRow label="Authentication" last>
                <CustomSelect value={s.newConnAuth} onChange={v => set({ newConnAuth: v })} options={["OAuth2", "API key", "Key-pair", "Username / password", "Service account"].map(t => ({ id: t, label: t }))} />
              </FormRow>
              <div style={{ fontSize: 11.5, color: "var(--ink-4)", lineHeight: 1.5 }}>You'll be redirected to authorize. Credentials are stored encrypted and reused across pipelines.</div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--line-2)", background: "var(--panel-2)" }}>
              <button className="btn-ghost" onClick={() => setNewOpen(false)}>Cancel</button>
              <button className="btn-dark" disabled={!canCreate} style={{ opacity: canCreate ? 1 : 0.45 }} onClick={() => { if (canCreate) { set({ connection: "__new__" }); setNewOpen(false); } }}>Create connection</button>
            </div>
          </div>
        </div>
      )}
    </StepWrap>
  );
}

// ── Src Step 3: Object ────────────────────────────────────────────────────────

function SrcObject({ s, set, sel }) {
  const [q, setQ] = useState("");
  const objects = sel ? getSourceObjects(sel.id, sel) : [];
  const list = objects.filter(o => !q || o.name.toLowerCase().indexOf(q.toLowerCase()) >= 0);
  const selected = s.tables || [];
  const toggle = name => set({ tables: selected.indexOf(name) >= 0 ? selected.filter(x => x !== name) : selected.concat([name]), query: "" });
  const allListed = list.length > 0 && list.every(o => selected.indexOf(o.name) >= 0);
  const toggleAll = () => set({ tables: allListed ? selected.filter(n => list.every(o => o.name !== n)) : Array.from(new Set(selected.concat(list.map(o => o.name)))), query: "" });
  return (
    <StepWrap wide title="Select the objects to read">
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        </span>
        <input className="winput" style={{ paddingLeft: 40, height: 44 }} placeholder="Search objects…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
      </div>
      <SrcListMeta count={list.length} noun="objects" chip={
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {selected.length > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-2)", fontWeight: 600 }}>{selected.length} selected</span>}
          <button onClick={toggleAll} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>{allListed ? "Clear all" : "Select all"}</button>
        </span>
      } />
      <div style={{ border: "1px solid var(--line)", borderRadius: 11, overflow: "hidden", background: "var(--panel)" }}>
        {list.map((o, i) => {
          const on = selected.indexOf(o.name) >= 0;
          return (
            <button key={o.name} onClick={() => toggle(o.name)}
              style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 16px", border: "none", borderTop: i ? "1px solid #f0ece6" : "none", background: on ? "#f7f5f1" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = "#faf8f4"; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderStyle: "solid", borderColor: on ? "#16341f" : "var(--line)", background: on ? "#16341f" : "transparent", color: "#fff" }}>
                {on && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8.5 6.5,11.5 12.5,5" /></svg>}
              </span>
              {sel ? <SrcConnectorLogo c={sel} size={20} /> : <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--chip)", border: "1px solid var(--line)", flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{o.name}</code>
                <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>{o.type} · {o.cols} columns</div>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "var(--ink-3)", flexShrink: 0 }}>{o.rows} rows</span>
            </button>
          );
        })}
        {list.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No objects match “{q}”.</div>}
      </div>
    </StepWrap>
  );
}

// ── Shared bits for the unstructured Read / Extract steps ─────────────────────
const SRC_SUBLBL = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 7 };
const SRC_REMOVE_BTN = { width: 26, height: 26, flexShrink: 0, borderRadius: 6, borderWidth: 1, borderStyle: "solid", borderColor: "var(--line)", background: "var(--panel-2)", color: "var(--ink-3)", cursor: "pointer", fontSize: 14, lineHeight: 1, justifySelf: "center" };
function SrcChipRow({ options, selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map(opt => {
        const on = selected.indexOf(opt) >= 0;
        return (
          <button key={opt} onClick={() => onToggle(opt)}
            style={{ padding: "6px 12px", borderRadius: 20, borderWidth: 1, borderStyle: "solid", borderColor: on ? "var(--ink)" : "var(--line)", background: on ? "var(--ink)" : "var(--panel)", color: on ? "var(--bg-canvas)" : "var(--ink-2)", fontSize: 12.5, fontWeight: on ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
function srcToggle(arr, val) { return arr.indexOf(val) >= 0 ? arr.filter(x => x !== val) : arr.concat([val]); }
function srcCap(w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; }

// Rich single-select that mirrors the "Pick a type" control: icon box + title +
// sub line + chevron. options = [{ id, title, desc, icon }]. Empty shows a dashed +.
function SrcRichSelect({ value, onChange, options, emptyLabel, dense, searchable, searchPlaceholder, plainOptions, noDesc }) {
  const box = dense ? 27 : 34;
  const iconBox = (content, dashed) => (
    <span style={{ width: box, height: box, borderRadius: dense ? 6 : 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--chip)", borderWidth: 1, borderStyle: dashed ? "dashed" : "solid", borderColor: "var(--line)", color: "var(--ink-3)" }}>{content}</span>
  );
  const body = (icon, title, sub, ghost) => (
    <span style={{ display: "flex", alignItems: "center", gap: icon ? (dense ? 9 : 11) : 0, width: "100%", minWidth: 0 }}>
      {icon}
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 1 }}>
        <span style={{ fontSize: dense ? 13 : 14, fontWeight: ghost ? 400 : 600, color: ghost ? "var(--ink-3)" : "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        {!noDesc && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: dense ? 10 : 11, color: "var(--ink-4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>}
      </span>
    </span>
  );
  return (
    <CustomSelect
      value={value} onChange={onChange} options={options} className={dense ? "csel-dense" : undefined}
      searchable={searchable} searchPlaceholder={searchPlaceholder}
      placeholder={body(iconBox("+", true), emptyLabel || "Choose…", noDesc ? null : "Click to choose", true)}
      renderTrigger={o => body(null, o.title, noDesc ? null : o.desc)}
      renderOption={plainOptions ? (o => <span style={{ fontSize: dense ? 13 : 14, fontWeight: 600, color: "var(--ink)" }}>{o.title}</span>) : (o => body(iconBox(o.icon), o.title, o.desc))}
    />
  );
}
const SRC_SCOPE_ICONS = {
  all: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 12 15 2 8.5 12 2" /><polyline points="2 15.5 12 22 22 15.5" /></svg>,
  folders: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
  files: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="14 3 14 8 19 8" /></svg>,
};
const SRC_METHOD_ICONS = {
  agent: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" /><circle cx="18" cy="17" r="1.4" /><circle cx="6" cy="16" r="1.1" /></svg>,
  automation: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
};
const METHOD_KIND_OPTS = [
  { id: "agent",      icon: SRC_METHOD_ICONS.agent,      title: "Agent",      desc: "An AI agent that reads files" },
  { id: "automation", icon: SRC_METHOD_ICONS.automation, title: "Automation", desc: "A saved processing pipeline" },
];

// ── Src Step 3 (unstructured): Read ───────────────────────────────────────────
function SrcRead({ s, set, sel }) {
  const cfg = getReadConfig(sel);
  const scope = s.readScope || "";
  const locs = s.readLocations || [];
  const filters = s.readFilters || {};
  const [link, setLink] = useState("");
  const specific = scope === "folders" || scope === "files";
  const contentMode = s.contentMode || "mixed";
  // Scope-specific noun — what's actually inside this source (document, message,
  // email, page, object…), so the copy reads right for every connector.
  const entity = cfg.entity || (cfg.item || "item").replace(/s$/, "");
  const Entity = entity.charAt(0).toUpperCase() + entity.slice(1);
  const typeExamples = (cfg.starts && cfg.starts.length) ? "e.g. " + cfg.starts.slice(0, 2).join(", ") + "…" : "e.g. Contract, Invoice…";
  const [filtersOn, setFiltersOn] = useState(() => Object.keys(filters).some(k => { const v = filters[k]; return v && v.length && v !== "all"; }));
  const setFilter = (k, val) => set({ readFilters: Object.assign({}, filters, (function () { const o = {}; o[k] = val; return o; })()) });
  const addLink = () => { const t = link.trim(); if (!t) return; set({ readLocations: locs.concat([{ id: "loc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), label: t }]) }); setLink(""); };
  const removeLoc = id => set({ readLocations: locs.filter(x => x.id !== id) });
  const folderIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
  const fileIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="14 3 14 8 19 8" /></svg>;

  return (
    <StepWrap wide title={`What to read from ${sel.name}`}>
      <FormRow label="Scope" hint="How much of the connection should we index?" last={!scope}>
        <div style={{ maxWidth: 760 }}>
          <SrcRichSelect value={scope} onChange={v => set({ readScope: v })} emptyLabel="Pick a scope"
            options={[
              { id: "all", title: "All " + cfg.item, desc: "Index every " + cfg.item.replace(/s$/, "") + " reachable from this connection.", icon: SRC_SCOPE_ICONS.all },
              { id: "folders", title: "Specific " + cfg.container, desc: "Pick " + cfg.container + "; everything inside is indexed and kept in sync.", icon: SRC_SCOPE_ICONS.folders },
              { id: "files", title: "Specific " + cfg.item, desc: "Pick individual " + cfg.item + " to index.", icon: SRC_SCOPE_ICONS.files },
            ]} />
        </div>
      </FormRow>

      {specific && (
        <FormRow label={(scope === "folders" ? srcCap(cfg.container) : srcCap(cfg.item)) + " to index"} required hint={locs.length ? locs.length + " added" : undefined}>
          <div style={{ maxWidth: 760 }}>
          {locs.length > 0 && (
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", marginBottom: 10, background: "var(--panel)" }}>
              {locs.map((l, i) => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderTop: i ? "1px solid var(--line-2)" : "none" }}>
                  <span style={{ flexShrink: 0, color: "var(--ink-3)", display: "flex" }}>{scope === "folders" ? folderIcon : fileIcon}</span>
                  <code style={{ flex: 1, minWidth: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</code>
                  <button onClick={() => removeLoc(l.id)} style={SRC_REMOVE_BTN}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input className="winput winput-mono" style={{ flex: 1 }} placeholder={cfg.linkPh} value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} />
            <button onClick={addLink} style={{ flexShrink: 0, padding: "0 18px", borderRadius: 9, border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--bg-canvas)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-4)" }}>Or <button style={{ background: "none", border: "none", padding: 0, color: "var(--ink-2)", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5 }}>browse {sel.name}</button> to pick visually.</div>
          </div>
        </FormRow>
      )}

      {specific && (
        <div className="wfr">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 760, alignItems: "start" }}>
            <div>
              <div className="wfr-label">What's in here?</div>
              <SrcRichSelect dense value={contentMode} onChange={v => set(Object.assign({ contentMode: v }, v === "mixed" ? { knownType: "" } : {}))} emptyLabel="How should we read these?"
                options={[
                  { id: "mixed", title: "Mixed " + entity + " types", desc: "A discovery agent figures out the types.", icon: SRC_SCOPE_ICONS.all },
                  { id: "single", title: "One known type", desc: "They're all the same kind of " + entity + ".", icon: SRC_SCOPE_ICONS.files },
                ]} />
              <div className="wfr-hint">{"If every " + entity + " is the same kind, skip discovery."}</div>
            </div>
            {contentMode === "single" ? (
              <div>
                <div className="wfr-label">{Entity + " type"}</div>
                <input className="winput" style={{ height: 48 }} placeholder={typeExamples} value={s.knownType || ""} onChange={e => set({ knownType: e.target.value })} />
                <div className="wfr-hint">{"Whatever these " + entity + "s are — discovery is skipped, you extract & map straight away."}</div>
              </div>
            ) : (
              <div>
                <div className="wfr-label">Discovery agent</div>
                <div style={{ height: 48, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--bg-canvas)", fontSize: 13, color: "var(--ink-2)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--ink-3)" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <span>Auto-detect type per {entity}</span>
                </div>
                <div className="wfr-hint">{"Runs once on ingestion — classifies each " + entity + " before extraction."}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {scope && (
        <FormRow label="Filters" optional last>
          <label style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 11, cursor: "pointer", border: "1px solid " + (filtersOn ? "var(--line)" : "var(--line-2)"), background: filtersOn ? "var(--panel)" : "transparent", maxWidth: 760 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Filter what gets indexed</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.5 }}>{"Index all " + cfg.item + " in scope, or narrow down by type, owner, date or name."}</div>
            </div>
            <SrcToggle on={filtersOn} onClick={() => setFiltersOn(!filtersOn)} />
          </label>
          {filtersOn && (
            <div style={{ display: "grid", gap: 14, marginTop: 16, maxWidth: 760 }}>
              {cfg.filters.map(f => (
                <div key={f.key}>
                  <div style={SRC_SUBLBL}>{f.label}</div>
                  {f.key === "fileTypes" ? <CustomSelect value={filters[f.key] || "all"} onChange={v => setFilter(f.key, v)} options={[{ id: "all", label: "All file types" }].concat(f.options.map(x => ({ id: x, label: x })))} />
                    : f.type === "chips" ? <SrcChipRow options={f.options} selected={filters[f.key] || []} onToggle={opt => setFilter(f.key, srcToggle(filters[f.key] || [], opt))} />
                      : f.type === "select" ? <CustomSelect value={filters[f.key] || f.options[0]} onChange={v => setFilter(f.key, v)} options={f.options.map(x => ({ id: x, label: x }))} />
                        : f.type === "date" ? <input className="winput" type="date" value={filters[f.key] || ""} onChange={e => setFilter(f.key, e.target.value)} />
                          : <input className="winput" placeholder={f.ph || ""} value={filters[f.key] || ""} onChange={e => setFilter(f.key, e.target.value)} />}
                </div>
              ))}
            </div>
          )}
        </FormRow>
      )}
    </StepWrap>
  );
}

// ── Unstructured Extract: discover entities at runtime via an agent ───────────
// Unstructured sources (Drive, Slack) have no predefined objects — an agent
// reads the documents in scope and discovers the entity types inside.
const ENTITY_AGENTS = [
  { id: "entity_extractor", name: "Entity Extractor Agent",      desc: "Reads each document and discovers the entity types and their fields." },
  { id: "doc_classifier",   name: "Document Classifier Agent",   desc: "Classifies every document, then groups them into entity types." },
  { id: "kg_builder",       name: "Knowledge Graph Builder Agent", desc: "Extracts entities and the relationships between them." },
  { id: "pii_safe",         name: "PII-Safe Extractor Agent",    desc: "Extracts entities while masking sensitive fields at read time." },
];
const ENTITY_AUTOMATIONS = [
  { id: "auto_doc_intake",  name: "Document Intake Automation",  desc: "Saved pipeline that classifies incoming files and extracts their fields." },
  { id: "auto_drive_sync",  name: "Drive Sync Automation",       desc: "Watches the connected drive and processes new files on a schedule." },
  { id: "auto_contracts",   name: "Contracts Automation",        desc: "Pre-built flow tuned for legal documents and agreements." },
];
const ENTITY_SETS = {
  default: [
    { id: "contract", name: "Contract", records: "1,240", conf: 96, fields: [{ col: "contract_id", type: "string", sample: "CTR-8841" }, { col: "parties", type: "string[]", sample: "Acme, Globex" }, { col: "effective_date", type: "date", sample: "2025-03-01" }, { col: "term_months", type: "int", sample: "24" }, { col: "total_value", type: "decimal", sample: "480000.00" }, { col: "governing_law", type: "string", sample: "Delaware" }] },
    { id: "invoice", name: "Invoice", records: "3,580", conf: 94, fields: [{ col: "invoice_no", type: "string", sample: "INV-22910" }, { col: "vendor", type: "string", sample: "Globex Inc" }, { col: "amount_due", type: "decimal", sample: "12450.00" }, { col: "currency", type: "string", sample: "USD" }, { col: "due_date", type: "date", sample: "2026-02-15" }] },
    { id: "candidate", name: "Candidate", records: "820", conf: 90, fields: [{ col: "full_name", type: "string", sample: "Jane Doe" }, { col: "email", type: "string", sample: "jane@acme.com" }, { col: "skills", type: "string[]", sample: "React, Go" }, { col: "years_experience", type: "int", sample: "7" }] },
    { id: "meeting_note", name: "Meeting Note", records: "5,100", conf: 88, fields: [{ col: "title", type: "string", sample: "Q3 Planning" }, { col: "date", type: "date", sample: "2026-01-12" }, { col: "attendees", type: "string[]", sample: "Sam, Priya" }, { col: "action_items", type: "string[]", sample: "Ship v2" }] },
    { id: "purchase_order", name: "Purchase Order", records: "2,410", conf: 93, fields: [{ col: "po_number", type: "string", sample: "PO-7741" }, { col: "vendor", type: "string", sample: "Globex Inc" }, { col: "total_amount", type: "decimal", sample: "84000.00" }, { col: "order_date", type: "date", sample: "2025-11-04" }, { col: "status", type: "string", sample: "approved" }] },
    { id: "nda", name: "NDA", records: "640", conf: 91, fields: [{ col: "parties", type: "string[]", sample: "Acme, Initech" }, { col: "effective_date", type: "date", sample: "2025-06-01" }, { col: "term_months", type: "int", sample: "36" }, { col: "jurisdiction", type: "string", sample: "California" }] },
    { id: "report", name: "Report", records: "1,870", conf: 85, fields: [{ col: "title", type: "string", sample: "FY25 Market Review" }, { col: "author", type: "string", sample: "Strategy Team" }, { col: "published_date", type: "date", sample: "2026-01-30" }, { col: "summary", type: "string", sample: "Demand up 12% YoY." }] },
    { id: "email", name: "Email", records: "12,300", conf: 87, fields: [{ col: "subject", type: "string", sample: "Renewal terms" }, { col: "sender", type: "string", sample: "morgan@globex.com" }, { col: "recipients", type: "string[]", sample: "sales@acme.com" }, { col: "sent_at", type: "timestamp", sample: "2026-02-09T14:20Z" }, { col: "summary", type: "string", sample: "Proposes 2-yr renewal." }] },
    { id: "policy", name: "Policy", records: "410", conf: 92, fields: [{ col: "policy_name", type: "string", sample: "Data Retention" }, { col: "version", type: "string", sample: "v3.2" }, { col: "effective_date", type: "date", sample: "2025-09-01" }, { col: "owner", type: "string", sample: "Legal" }] },
  ],
  slack: [
    { id: "thread",   name: "Message Thread",  records: "42,100", conf: 95, fields: [
      { col: "topic",                  type: "string",   sample: "Production deploy — go/no-go decision" },
      { col: "sentiment",              type: "string",   sample: "tense — escalating" },
      { col: "action_items",           type: "string[]", sample: "Revert deploy, page on-call, update status page" },
      { col: "resolution_status",      type: "string",   sample: "resolved" },
      { col: "key_decision",           type: "string",   sample: "Roll back to v2.4.1 — approved by CTO" },
      { col: "account_mentioned",      type: "string",   sample: "Acme — customer impacted" },
      { col: "risk_signal",            type: "string",   sample: "SLA breach in 20 min if not resolved" },
      { col: "thread_summary",         type: "string",   sample: "DB connection pool exhausted post-deploy; rollback decided in 18 min" },
    ]},
    { id: "decision", name: "Decision",         records: "1,840",  conf: 89, fields: [
      { col: "decision_text",          type: "string",   sample: "Adopt Postgres for all new services — retire MySQL by Q4" },
      { col: "rationale",              type: "string",   sample: "Lower licensing cost, better tooling, team familiarity" },
      { col: "alternatives_rejected",  type: "string[]", sample: "MySQL (licensing cost), Aurora (vendor lock-in)" },
      { col: "stakeholders",           type: "string[]", sample: "morgan (VP Eng), priya (Staff Eng), lee (Arch)" },
      { col: "reversibility",          type: "string",   sample: "low — migration effort estimated 3 months" },
      { col: "deadline",               type: "date",     sample: "2026-06-01" },
      { col: "confidence",             type: "string",   sample: "high" },
    ]},
    { id: "incident", name: "Incident",          records: "310",    conf: 92, fields: [
      { col: "severity",               type: "string",   sample: "SEV2" },
      { col: "affected_service",       type: "string",   sample: "Payments API — checkout flow" },
      { col: "customer_impact",        type: "string",   sample: "~800 checkout failures over 22 min" },
      { col: "root_cause_signal",      type: "string",   sample: "DB connection pool exhausted after traffic spike" },
      { col: "mttr_minutes",           type: "int",      sample: "42" },
      { col: "resolved",               type: "bool",     sample: "true" },
      { col: "post_mortem_needed",     type: "bool",     sample: "true" },
      { col: "recurrence_risk",        type: "string",   sample: "high — pool limit not increased post-fix" },
    ]},
  ],
  teams: [
    { id: "tm_message", name: "Channel Message", records: "58,200", conf: 94, fields: [{ col: "message_id", type: "string", sample: "msg-7f21" }, { col: "channel", type: "string", sample: "Engineering" }, { col: "author", type: "string", sample: "priya@acme.com" }, { col: "posted_at", type: "timestamp", sample: "2026-05-12T09:31Z" }, { col: "summary", type: "string", sample: "Release blocked on QA." }] },
    { id: "tm_meeting", name: "Meeting", records: "3,920", conf: 91, fields: [{ col: "meeting_id", type: "string", sample: "mtg-204" }, { col: "title", type: "string", sample: "Sprint review" }, { col: "organizer", type: "string", sample: "sam@acme.com" }, { col: "start_time", type: "timestamp", sample: "2026-05-12T15:00Z" }, { col: "attendees", type: "string[]", sample: "Sam, Priya, Lee" }, { col: "recap", type: "string", sample: "Shipped 4 of 6 stories." }] },
    { id: "tm_chat", name: "Chat", records: "21,400", conf: 88, fields: [{ col: "chat_id", type: "string", sample: "chat-91x" }, { col: "participants", type: "string[]", sample: "morgan, lee" }, { col: "last_message_at", type: "timestamp", sample: "2026-05-11T18:02Z" }, { col: "summary", type: "string", sample: "Agreed on vendor." }] },
    { id: "tm_file", name: "Shared File", records: "8,760", conf: 90, fields: [{ col: "file_name", type: "string", sample: "Q2_Plan.pptx" }, { col: "shared_by", type: "string", sample: "sam@acme.com" }, { col: "channel", type: "string", sample: "Leadership" }, { col: "shared_at", type: "timestamp", sample: "2026-04-30T12:10Z" }] },
  ],
  outlook: [
    { id: "ol_email", name: "Email", records: "184,500", conf: 93, fields: [{ col: "message_id", type: "string", sample: "AAMk-9f3" }, { col: "subject", type: "string", sample: "Renewal terms" }, { col: "sender", type: "string", sample: "morgan@globex.com" }, { col: "recipients", type: "string[]", sample: "sales@acme.com" }, { col: "sent_at", type: "timestamp", sample: "2026-02-09T14:20Z" }, { col: "summary", type: "string", sample: "Proposes 2-yr renewal." }] },
    { id: "ol_invite", name: "Meeting Invite", records: "12,300", conf: 90, fields: [{ col: "event_id", type: "string", sample: "evt-5521" }, { col: "title", type: "string", sample: "QBR — Acme" }, { col: "organizer", type: "string", sample: "ae@acme.com" }, { col: "start_time", type: "timestamp", sample: "2026-03-04T16:00Z" }, { col: "attendees", type: "string[]", sample: "AE, SE, Buyer" }, { col: "location", type: "string", sample: "Teams" }] },
    { id: "ol_contact", name: "Contact", records: "6,410", conf: 92, fields: [{ col: "full_name", type: "string", sample: "Jordan Lee" }, { col: "email", type: "string", sample: "jordan@globex.com" }, { col: "company", type: "string", sample: "Globex" }, { col: "phone", type: "string", sample: "+1 415 555 0132" }] },
    { id: "ol_task", name: "Task", records: "2,180", conf: 86, fields: [{ col: "task_id", type: "string", sample: "task-88" }, { col: "subject", type: "string", sample: "Send MSA redline" }, { col: "due_date", type: "date", sample: "2026-03-10" }, { col: "status", type: "string", sample: "in_progress" }] },
  ],
  sharepoint: [
    { id: "sp_document", name: "Document", records: "26,400", conf: 92, fields: [{ col: "file_name", type: "string", sample: "MSA_Acme.docx" }, { col: "library", type: "string", sample: "Legal" }, { col: "author", type: "string", sample: "legal@acme.com" }, { col: "modified_at", type: "timestamp", sample: "2026-04-01T10:00Z" }, { col: "file_type", type: "string", sample: "docx" }] },
    { id: "sp_contract", name: "Contract", records: "1,240", conf: 95, fields: [{ col: "contract_id", type: "string", sample: "CTR-8841" }, { col: "parties", type: "string[]", sample: "Acme, Globex" }, { col: "effective_date", type: "date", sample: "2025-03-01" }, { col: "term_months", type: "int", sample: "24" }, { col: "total_value", type: "decimal", sample: "480000.00" }] },
    { id: "sp_policy", name: "Policy", records: "410", conf: 91, fields: [{ col: "policy_name", type: "string", sample: "Data Retention" }, { col: "version", type: "string", sample: "v3.2" }, { col: "effective_date", type: "date", sample: "2025-09-01" }, { col: "owner", type: "string", sample: "Legal" }] },
    { id: "sp_meeting", name: "Meeting Note", records: "3,300", conf: 87, fields: [{ col: "title", type: "string", sample: "Q3 Planning" }, { col: "date", type: "date", sample: "2026-01-12" }, { col: "attendees", type: "string[]", sample: "Sam, Priya" }, { col: "action_items", type: "string[]", sample: "Ship v2" }] },
    { id: "sp_listitem", name: "List Item", records: "14,900", conf: 84, fields: [{ col: "item_id", type: "string", sample: "li-2204" }, { col: "list_name", type: "string", sample: "Vendor Register" }, { col: "title", type: "string", sample: "Globex Inc" }, { col: "created_by", type: "string", sample: "ops@acme.com" }, { col: "created_at", type: "timestamp", sample: "2025-12-02T09:00Z" }] },
  ],
  onedrive: [
    { id: "od_document", name: "Document", records: "9,800", conf: 91, fields: [{ col: "file_name", type: "string", sample: "Proposal.docx" }, { col: "owner", type: "string", sample: "me@acme.com" }, { col: "modified_at", type: "timestamp", sample: "2026-05-05T08:00Z" }, { col: "file_type", type: "string", sample: "docx" }] },
    { id: "od_spreadsheet", name: "Spreadsheet", records: "4,210", conf: 89, fields: [{ col: "file_name", type: "string", sample: "Model_v4.xlsx" }, { col: "owner", type: "string", sample: "me@acme.com" }, { col: "modified_at", type: "timestamp", sample: "2026-05-04T17:22Z" }, { col: "sheet_count", type: "int", sample: "6" }] },
    { id: "od_presentation", name: "Presentation", records: "2,640", conf: 88, fields: [{ col: "file_name", type: "string", sample: "Board_Q2.pptx" }, { col: "owner", type: "string", sample: "me@acme.com" }, { col: "modified_at", type: "timestamp", sample: "2026-04-28T11:00Z" }, { col: "slide_count", type: "int", sample: "28" }] },
    { id: "od_pdf", name: "PDF", records: "7,120", conf: 90, fields: [{ col: "file_name", type: "string", sample: "Signed_NDA.pdf" }, { col: "owner", type: "string", sample: "me@acme.com" }, { col: "modified_at", type: "timestamp", sample: "2026-03-19T14:40Z" }, { col: "page_count", type: "int", sample: "4" }] },
  ],
};
function getDiscoveredEntities(sel) { return (sel && ENTITY_SETS[sel.id]) || ENTITY_SETS.default; }

// Per-entity extraction agents — these are what actually read the document body and
// pull out the entity's domain fields (the source itself only yields file metadata).
const EXTRACTION_AGENTS = [];
Object.keys(ENTITY_SETS).forEach(k => ENTITY_SETS[k].forEach(e => {
  if (!EXTRACTION_AGENTS.some(a => a.id === "extract_" + e.id))
    EXTRACTION_AGENTS.push({ id: "extract_" + e.id, name: e.name + " Extraction Agent", desc: "Reads each " + e.name.toLowerCase() + " document and extracts its fields.", outputs: e.fields, entityId: e.id, extractor: true });
}));
// Document-level enrichment agents — optional, on top of extraction.
const DOC_ENRICH_AGENTS = [
  { id: "doc_summary",   name: "Summarizer Agent",     desc: "Generates a one-line summary of each document.",            outputs: [{ col: "summary", type: "string", sample: "Enterprise MSA, 24-month term." }] },
  { id: "doc_sentiment", name: "Sentiment Agent",      desc: "Classifies the tone of the document.",                      outputs: [{ col: "sentiment", type: "string", sample: "neutral" }] },
  { id: "doc_pii",       name: "PII Redactor Agent",   desc: "Detects and flags sensitive fields for masking.",           outputs: [{ col: "pii_flags", type: "string[]", sample: "email, tax_id" }] },
  { id: "doc_language",  name: "Language Agent",        desc: "Detects language and adds a normalized translation.",       outputs: [{ col: "language", type: "string", sample: "en" }, { col: "translated_text", type: "string", sample: "…" }] },
  { id: "doc_linker",    name: "Entity Linker Agent",  desc: "Links entities mentioned in the document to graph nodes.",  outputs: [{ col: "linked_nodes", type: "string[]", sample: "Acme, Globex" }] },
];
function extractionAgentFor(eid) { return EXTRACTION_AGENTS.find(a => a.id === "extract_" + eid) || null; }

function SrcDiscover({ s, set, sel }) {
  const agent = s.entityAgent || "";
  const kind = s.discoveryKind || "";
  const isAuto = kind === "automation";
  const pool = isAuto ? ENTITY_AUTOMATIONS : ENTITY_AGENTS;
  const entities = getDiscoveredEntities(sel);
  const ran = !!agent;
  const include = s.entityInclude || {};
  const isIncluded = e => include[e.id] !== false;
  const includedN = entities.filter(isIncluded).length;
  // Switching kind resets the picked agent/automation and the revealed file types.
  const chooseKind = k => { if (k === kind) return; set({ discoveryKind: k, entityAgent: "", extractRan: false }); };
  // Picking a discovery agent/automation simply reveals the file types it knows
  // how to extract — they're defined in the agent, nothing runs here. We don't
  // assign extraction agents here — the user does that manually in Extract.
  const chooseAgent = v => {
    if (!v) { set({ entityAgent: "", extractRan: false }); return; }
    const inc = {};
    entities.forEach(e => { inc[e.id] = true; });
    set({ entityAgent: v, extractRan: true, entityInclude: inc });
  };
  const toggle = id => set({ entityInclude: Object.assign({}, include, (function () { var o = {}; o[id] = !(include[id] !== false); return o; })()) });
  const agentOpts = pool.map(a => ({ id: a.id, icon: isAuto ? SRC_METHOD_ICONS.automation : SRC_METHOD_ICONS.agent, title: a.name, desc: "" }));
  return (
    <StepWrap wide title="Discover Files">
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 16, lineHeight: 1.55, maxWidth: 800 }}>Unstructured sources have no predefined tables. Run a discovery agent or automation — it lists the <b style={{ color: "var(--ink-2)" }}>file types it can extract</b>. Choose which to bring into the graph — you'll run extraction on each in the next step.</div>
      <div className={"wfr" + (ran ? "" : " wfr-last")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 760 }}>
          <div>
            <div className="wfr-label">Discover with</div>
            <SrcRichSelect value={kind} onChange={chooseKind} options={METHOD_KIND_OPTS} emptyLabel="Pick a method" noDesc />
          </div>
          <div style={{ opacity: kind ? 1 : 0.45, pointerEvents: kind ? "auto" : "none", transition: "opacity 120ms" }}>
            <div className="wfr-label">{isAuto ? "Automation" : "Discovery agent"}</div>
            <SrcRichSelect value={agent} onChange={chooseAgent} options={kind ? agentOpts : []} emptyLabel={kind ? (isAuto ? "Select an automation…" : "Select an agent…") : "Pick a method first"} noDesc />
          </div>
        </div>
      </div>

      {ran && (
        <FormRow label={(isAuto ? "Automation" : "Agent") + " output — File types"} hint={"The file types this " + (isAuto ? "automation" : "agent") + " classifies your documents into — " + includedN + " of " + entities.length + " selected. Pick which to bring into the graph."} last>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 760 }}>
            {entities.map(e => {
              const on = isIncluded(e);
              return (
                <label key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 15px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--line-2)", background: on ? "#fff" : "transparent", opacity: on ? 1 : 0.62, transition: "opacity 120ms, background 120ms" }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{e.name}</span>
                  <input type="checkbox" checked={on} onChange={() => toggle(e.id)} style={{ accentColor: "#1a1a1a", width: 16, height: 16, flexShrink: 0 }} />
                </label>
              );
            })}
          </div>
        </FormRow>
      )}
    </StepWrap>
  );
}

// ── Unstructured Map: map each discovered entity to a graph node + its props ───
function SrcEntityMap({ s, set, groups, activeObj, sel, openCol, setOpenCol }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const mapping = s.mapping || {};
  const transforms = s.transforms || {};
  const entityNode = s.entityNode || {};
  const nodes = ((typeof window !== "undefined" && window.NODES) || []).filter(n => n.type === "entity");
  const current = (activeObj && groups.find(g => g.name === activeObj)) || groups[0] || null;
  const eid = current ? current.name : "";
  const destId = entityNode[eid] || "";
  const isNew = destId === "__new__";
  const destNode = nodes.find(n => n.id === destId) || null;
  // Resolve a node to source the destination properties/edges from. Even before the
  // user explicitly picks a destination, default to the entity that matches this object
  // (e.g. "Contract") so the property/edge dropdown is never empty.
  const _objLc = current ? (current.label || current.name || "").toLowerCase() : "";
  const targetNode = destNode
    || nodes.find(n => n.label.toLowerCase() === _objLc)
    || nodes.find(n => n.id === _objLc)
    || nodes.find(n => n.id === "contract") || nodes.find(n => n.id === "account")
    || nodes[0] || null;
  const props = targetNode && window.generateProps ? window.generateProps(targetNode).map(p => ({ id: p.name, label: p.name, type: p.type })) : [];
  // Edges connected to the destination node — their attributes are also mappable targets.
  const allEdges = (typeof window !== "undefined" && window.EDGES) || [];
  const edgeAttrsFor = () => [
    { name: "since",         type: "datetime" },
    { name: "weight",        type: "decimal" },
    { name: "confidence",    type: "decimal" },
    { name: "source_system", type: "string" },
  ];
  const destEdges = targetNode ? allEdges.filter(e => e.s === targetNode.id || e.t === targetNode.id) : [];
  // Two-tab destination picker: node Properties · Edge attributes (grouped per edge).
  const _edgeGroups = destEdges.map((e, ei) => {
    const out = e.s === targetNode.id;
    const other = nodes.find(n => n.id === (out ? e.t : e.s)) || (((typeof window !== "undefined" && window.NODES) || []).find(n => n.id === (out ? e.t : e.s)));
    return {
      key: "e" + ei + ":" + e.label,
      label: <span className="csel-edgehd"><span className="csel-edgehd-rel">:{e.label}</span><span className="csel-edgehd-arrow">{out ? "→" : "←"}</span><span className="csel-edgehd-node">{other ? other.label : "?"}</span></span>,
      items: edgeAttrsFor(e).map(a => ({ id: "edge:" + e.label + ":" + a.name, label: a.name, type: a.type, onEdge: e.label })),
    };
  });
  const destTabs = [
    { label: "Properties", count: props.length, items: props.concat([{ id: "__new__", label: "+ New property" }]) },
    { label: "Edges", count: _edgeGroups.reduce((s, g) => s + g.items.length, 0), groups: _edgeGroups },
  ];
  const mk = col => eid + "::" + col;
  const baseCols = current ? current.cols : [];
  const agentCols = current ? agentFieldsFor(s, eid) : [];
  const cols = baseCols.concat(agentCols);
  const hasAgents = agentCols.length > 0;
  const agentGroups = [];
  agentCols.forEach(f => { let gg = agentGroups.find(x => x.name === f.agent); if (!gg) { gg = { name: f.agent, fields: [] }; agentGroups.push(gg); } gg.fields.push(f); });
  const setNode = nid => {
    const m = Object.assign({}, mapping);
    // creating a new node → each field becomes a same-named property; clear those when leaving
    if (nid === "__new__") cols.forEach(c => { m[mk(c.col)] = "new:" + c.col; });
    else cols.forEach(c => { if (String(m[mk(c.col)] || "").indexOf("new:") === 0) delete m[mk(c.col)]; });
    set({ entityNode: Object.assign({}, entityNode, (function () { var o = {}; o[eid] = nid; return o; })()), mapping: m });
  };
  const updateMap = (col, v) => set({ mapping: Object.assign({}, mapping, (function () { var o = {}; o[mk(col)] = v; return o; })()) });
  const mappedN = cols.filter(c => mapping[mk(c.col)]).length;
  const recordFilters = s.recordFilters || {};
  const activeFilters = current ? (recordFilters[eid] || []) : [];
  const colVisible = (c) => {
    const nm = c.label || c.col;
    if (q && nm.toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
    const mp = isNew || !!mapping[mk(c.col)];
    if (tab === "mapped") return mp;
    if (tab === "unmapped") return !mp;
    return true;
  };
  const GRID = "minmax(160px,1.1fr) minmax(150px,1fr) 28px minmax(180px,1.1fr)";
  const nodeOptions = nodes.map(n => ({ id: n.id, label: n.label, node: n })).concat([{ id: "__new__", label: "+ New node type" + (current ? " — " + current.label : "") }]);
  const sectionLabel = (text, n, first) => (
    <div key={"sec-" + text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "var(--panel-2)", borderTop: first ? "none" : "1px solid var(--line)" }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 600 }}>{text}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "var(--ink-4)" }}>· {n}</span>
    </div>
  );
  const renderFieldRow = (c, key, i) => {
    const ck = mk(c.col);
    const mapped = mapping[ck];
    const nm = c.label || c.col;
    const tlist = transforms[ck] || [];
    const isOpen = openCol === ck;
    return (
      <div key={key} style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "12px 16px", alignItems: "center", borderTop: i ? "1px solid var(--line-2)" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <MapTypeGlyph type={c.type} />
          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nm}</code>
        </div>
        <button onClick={() => setOpenCol && setOpenCol(ck)}
          style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: "100%", padding: "7px 10px", borderRadius: 8, borderWidth: 1, borderStyle: tlist.length || isOpen ? "solid" : "dashed", borderColor: isOpen ? "var(--ink)" : tlist.length ? "var(--line)" : "transparent", background: isOpen ? "var(--bg-canvas)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", minHeight: 34 }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--panel-2)"; if (!tlist.length && !isOpen) e.currentTarget.style.borderColor = "var(--line)"; }}
          onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; if (!tlist.length && !isOpen) e.currentTarget.style.borderColor = "transparent"; }}>
          {tlist.length === 0
            ? <span style={{ fontSize: 12, color: "var(--ink-4)" }}>+ Add transformation</span>
            : tlist.map((t, j) => <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, padding: "2px 7px", borderRadius: 5, background: "var(--chip)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>{t.fn ? tfLabel(t.fn) : "function…"}</span>)}
          <span style={{ marginLeft: "auto", color: "var(--ink-3)", flexShrink: 0, display: "flex" }} title="Edit transformations">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
          </span>
        </button>
        <div style={{ textAlign: "center", color: (isNew || mapped) ? "var(--green)" : "var(--ink-4)", fontSize: 15 }}>→</div>
        {isNew
          ? <span style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 2px" }}><MapTypeGlyph type={c.type} size={22} /><code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink)" }}>{nm}</code><MapBadge tone="var(--purple)">NEW</MapBadge></span>
          : <CustomSelect value={mapped || ""} onChange={v => updateMap(c.col, v)} placeholder="Select property" tabs={destTabs} searchable searchPlaceholder="Search properties & edge attributes…"
              renderTrigger={o => o.id && o.id !== "__new__"
                ? <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}><MapTypeGlyph type={o.type} size={22} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>{o.onEdge && <MapBadge tone="var(--gold)">{":" + o.onEdge}</MapBadge>}</span>
                : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-4)" }}>{o.label || "Select property"}</span>}
              renderOption={o => o.id && o.id !== "__new__"
                ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={20} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{o.label}</span></span>
                : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-3)" }}>{o.label}</span>} />}
      </div>
    );
  };
  return (
    <StepWrap wide title={current ? `Map ${current.label} to the graph` : "Map entities to the graph"}>
      {!current && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 11, background: "var(--panel)", padding: "40px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No entities yet — go back to Extract and run the agent.</div>
      )}
      {current && (
        <>
          <FormRow label="Destination node" last>
            <div style={{ maxWidth: 480 }}>
              <CustomSelect value={destId} placeholder="Pick or create a node…" onChange={setNode} options={nodeOptions} searchable searchPlaceholder="Search nodes…"
                renderTrigger={o => o.id === "__new__"
                  ? <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>{o.label}</span>
                  : <span style={{ display: "flex", alignItems: "center", gap: 9 }}>{o.node && window.ListGlyph && <window.ListGlyph node={o.node} size={18} />}<span style={{ color: "var(--ink)" }}>{o.label}</span></span>}
                renderOption={o => o.id === "__new__"
                  ? <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>{o.label}</span>
                  : <span style={{ display: "flex", alignItems: "center", gap: 9 }}>{o.node && window.ListGlyph && <window.ListGlyph node={o.node} size={18} />}{o.label}</span>} />
            </div>
          </FormRow>

          {destId && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <CustomSelect className="csel-auto" value={tab} onChange={setTab}
                options={[
                  { id: "all",      label: "All fields", count: cols.length },
                  { id: "mapped",   label: "Mapped",     count: isNew ? cols.length : mappedN },
                  { id: "unmapped", label: "Unmapped",   count: isNew ? 0 : cols.length - mappedN },
                ]}
                renderTrigger={o => <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{o.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 10, background: "var(--chip)", color: "var(--ink-3)" }}>{o.count}</span>
                </span>}
                renderOption={o => <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <span style={{ flex: 1 }}>{o.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 10, background: "var(--chip)", color: "var(--ink-3)" }}>{o.count}</span>
                </span>} />

              <div style={{ position: "relative" }}>
                <button onClick={() => setFilterOpen(o => !o)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 13px", height: 40, borderRadius: 9, border: "1px solid " + (filterOpen || activeFilters.length ? "var(--ink)" : "var(--line)"), background: filterOpen ? "var(--bg-canvas)" : "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
                  Filter records
                  {activeFilters.length > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, minWidth: 18, textAlign: "center", padding: "1px 6px", borderRadius: 10, background: "var(--ink)", color: "var(--panel)" }}>{activeFilters.length}</span>}
                </button>
                {filterOpen && current && (
                  <FilterRecordsPopover key={eid} cols={baseCols} initial={activeFilters} objName={current.label}
                    onApply={rows => { set({ recordFilters: Object.assign({}, recordFilters, (function () { var o = {}; o[eid] = rows; return o; })()) }); setFilterOpen(false); }}
                    onClear={() => { set({ recordFilters: Object.assign({}, recordFilters, (function () { var o = {}; o[eid] = []; return o; })()) }); setFilterOpen(false); }}
                    onClose={() => setFilterOpen(false)} />
                )}
              </div>

              <button onClick={() => setOpenCol && setOpenCol(eid + "::__newtf__")}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 13px", height: 40, borderRadius: 9, border: "1px solid var(--line)", background: "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 400, color: "var(--ink-3)", lineHeight: 1 }}>+</span>
                Transformed field
              </button>

              <div style={{ position: "relative", marginLeft: "auto", width: 240 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
                </span>
                <input className="winput" style={{ paddingLeft: 34 }} placeholder="Search fields…" value={q} onChange={e => setQ(e.target.value)} />
              </div>
            </div>
          )}

          {destId && (
            <div style={{ border: "1px solid var(--line)", borderRadius: 11, background: "var(--panel)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", borderBottom: "1px solid var(--line)", background: "var(--panel-2)" }}>
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{current.label}</code>
                <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{cols.length + " fields → " + (isNew ? "new node" : (destNode ? destNode.label : "node"))}</span>
                {!isNew && <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, color: mappedN ? "var(--green)" : "var(--ink-3)" }}>{mappedN + "/" + cols.length + " mapped"}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "10px 16px", background: "var(--panel-2)", borderBottom: "1px solid var(--line-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)" }}>
                <div>Entity field</div><div>Transformations</div><div></div><div>{isNew ? "New property" : "Destination property"}</div>
              </div>
              {(function () {
                const vBase = baseCols.filter(colVisible);
                const vAgentGroups = agentGroups.map(ag => ({ name: ag.name, fields: ag.fields.filter(colVisible) })).filter(ag => ag.fields.length);
                const nothing = vBase.length === 0 && vAgentGroups.length === 0;
                if (nothing) return (
                  <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--ink-4)", fontSize: 12.5 }}>No fields match.</div>
                );
                return hasAgents ? (
                  <>
                    {vBase.map((c, i) => renderFieldRow(c, "s-" + i, i))}
                    {vAgentGroups.map(ag => (
                      <React.Fragment key={ag.name}>
                        {sectionLabel(ag.name, ag.fields.length)}
                        {ag.fields.map((c, i) => renderFieldRow(c, ag.name + "-" + i, i))}
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  vBase.map((c, i) => renderFieldRow(c, "s-" + i, i))
                );
              })()}
            </div>
          )}
        </>
      )}
    </StepWrap>
  );
}

// ── Src Step 4: Column Mapping ────────────────────────────────────────────────

// Transformation functions available per mapped field (matches the connector catalog).
// Each function declares its dependent config fields (rendered below the picker).
const TRANSFORM_FUNCTIONS = [
  { id: "cast",       label: "Cast",             glyph: "⇲",   fields: [{ key: "to", label: "Cast to", type: "select", options: ["string", "integer", "float", "boolean", "date", "timestamp", "json"], required: true }] },
  { id: "extract",    label: "Extract Text",     glyph: "</>", fields: [{ key: "pattern", label: "Pattern (regex)", type: "text", placeholder: "e.g. \\d{3}-\\d{4}", hint: "The first capture group becomes the value." }] },
  { id: "flatten",    label: "Flatten JSON",     glyph: "{}",  fields: [{ key: "depth", label: "Max depth", type: "select", options: ["1", "2", "3", "Unlimited"] }] },
  { id: "hash",       label: "Hash",             glyph: "#",   fields: [{ key: "algo", label: "Algorithm", type: "select", options: ["MD5", "SHA-1", "SHA-256", "SHA-512"], required: true }] },
  { id: "mask",       label: "Mask",             glyph: "•••", fields: [{ key: "keep", label: "Keep last N chars", type: "text", placeholder: "4" }, { key: "char", label: "Mask character", type: "text", placeholder: "*" }] },
  { id: "replace",    label: "Replace Value",    glyph: "⇄",   fields: [{ key: "find", label: "Find", type: "text", placeholder: "value to match" }, { key: "replace", label: "Replace with", type: "text", placeholder: "replacement value" }] },
  { id: "lower",      label: "To Lowercase",     glyph: "a",   fields: [] },
  { id: "upper",      label: "To Uppercase",     glyph: "A",   fields: [] },
  { id: "b64enc",     label: "Base64 Encode",    glyph: "64",  fields: [] },
  { id: "b64dec",     label: "Base64 Decode",    glyph: "64",  fields: [] },
  { id: "aes_enc",    label: "AES Encryption",   glyph: "🔒",  fields: [{ key: "conn", label: "AES connection", type: "select", options: ["Vault — prod", "Vault — staging", "KMS key — primary"], required: true, placeholder: "Select connection" }] },
  { id: "aes_dec",    label: "AES Decryption",   glyph: "🔓",  fields: [{ key: "conn", label: "AES connection", type: "select", options: ["Vault — prod", "Vault — staging", "KMS key — primary"], required: true, placeholder: "Select connection" }] },
  { id: "duplicate",  label: "Duplicate Field",  glyph: "⧉",   fields: [], alwaysSaveNew: true },
  { id: "dl_s3",      label: "Download from S3",  glyph: "↓",  fields: [{ key: "conn", label: "S3 connection", type: "select", options: ["s3-prod", "s3-archive"], placeholder: "Select connection" }, { key: "path", label: "Path / key", type: "text", placeholder: "bucket/prefix/" }] },
  { id: "ul_s3",      label: "Upload to S3",      glyph: "↑",  fields: [{ key: "conn", label: "S3 connection", type: "select", options: ["s3-prod", "s3-archive"], placeholder: "Select connection" }, { key: "path", label: "Path / key", type: "text", placeholder: "bucket/prefix/" }] },
  { id: "trim",       label: "Trim Whitespace",   glyph: "↔",  fields: [] },
  { id: "round",      label: "Round",             glyph: "≈",  fields: [{ key: "dp", label: "Decimal places", type: "text", placeholder: "2" }] },
  { id: "fmt_date",   label: "Format Date",       glyph: "📅", fields: [{ key: "fmt", label: "Format", type: "text", placeholder: "YYYY-MM-DD" }] },
];
function tfDef(id){ return TRANSFORM_FUNCTIONS.find(f => f.id === id) || null; }
function tfLabel(id){ return (tfDef(id) || {}).label || ""; }

const MAP_TYPE_GLYPH = {
  string: { g: "T", c: "var(--blue)" }, "string[]": { g: "[T]", c: "var(--blue)" },
  int: { g: "#", c: "var(--gold)" }, float: { g: ".5", c: "var(--gold)" }, decimal: { g: "#", c: "var(--gold)" },
  bool: { g: "01", c: "var(--coral)" }, timestamp: { g: "TS", c: "var(--green)" }, date: { g: "DT", c: "var(--green)" },
  datetime: { g: "DT", c: "var(--green)" }, uuid: { g: "ID", c: "var(--purple)" }, json: { g: "{}", c: "var(--ink-3)" },
  enum: { g: "E", c: "var(--purple)" }, fk: { g: "FK", c: "var(--purple)" },
};
function MapTypeGlyph({ type, size }) {
  const m = MAP_TYPE_GLYPH[type] || { g: "T", c: "var(--ink-3)" };
  size = size || 26;
  return <span style={{ width: size, height: size, borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg-canvas)", color: m.c, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>{m.g}</span>;
}
function MapBadge({ children, tone }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.4px", padding: "1px 5px", borderRadius: 4, color: tone || "var(--ink-3)", border: "1px solid var(--line)", background: "var(--bg-canvas)" }}>{children}</span>;
}

// Per-field transformation chain editor — a focused right-side drawer.
// Add one or many functions, applied top to bottom, before the value is written.
function SrcTransformDrawer({ col, type, sel, list: propList, onChange: propOnChange, onClose, newField, cols, objName, onSave }) {
  const isNew = !!newField;
  const [draftList, setDraftList] = useState([]);
  const [nfName, setNfName] = useState("");
  const [nfSource, setNfSource] = useState("");
  const list = isNew ? draftList : (propList || []);
  const onChange = isNew ? setDraftList : propOnChange;
  const srcCol = isNew ? (cols || []).find(c => c.col === nfSource) : null;
  const effType = isNew ? (srcCol ? srcCol.type : "string") : type;
  const canSaveNew = isNew && nfName.trim() && nfSource;
  const add = () => onChange(list.concat([{ fn: "", cfg: {}, saveNew: false, newField: "" }]));
  const setFn = (i, fn) => onChange(list.map((t, j) => j === i ? { fn: fn, cfg: {}, saveNew: !!(tfDef(fn) || {}).alwaysSaveNew, newField: t.newField || "" } : t));
  const setCfg = (i, key, val) => onChange(list.map((t, j) => j === i ? { ...t, cfg: { ...(t.cfg || {}), [key]: val } } : t));
  const setItem = (i, patch) => onChange(list.map((t, j) => j === i ? { ...t, ...patch } : t));
  const remove = i => onChange(list.filter((_, j) => j !== i));
  const fnGlyph = id => (tfDef(id) || {}).glyph;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)", zIndex: 60, display: "flex", justifyContent: "flex-end", animation: "flow-fade-in 140ms ease-out" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "80%", height: "100%", background: "var(--panel)", borderLeft: "1px solid var(--line)", boxShadow: "-24px 0 60px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column" }}>
        {/* header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
          <span style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg-canvas)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h11M4 7l3-3M4 7l3 3M20 17H9M20 17l-3-3M20 17l-3 3" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 21, color: "var(--ink)", lineHeight: 1.1 }}>{isNew ? "New transformed field" : "Transformations"}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
              {isNew
                ? (nfSource ? <><MapTypeGlyph type={effType} size={18} /> <code>{nfName || "new_field"}</code> <span style={{ color: "var(--ink-4)" }}>· from {nfSource}</span></> : <span style={{ color: "var(--ink-4)" }}>Derive a new field from a source column</span>)
                : <><MapTypeGlyph type={type} size={18} /> <code>{col}</code> {sel ? "· " + sel.name : ""}</>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line)", background: "none", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, fontSize: 13 }}>✕</button>
        </div>
        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {isNew && (
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--line-2)" }}>
              <div>
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Field name</label>
                <input className="winput winput-mono" placeholder="e.g. full_name" value={nfName} onChange={e => setNfName(e.target.value)} autoFocus />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Source field</label>
                <CustomSelect value={nfSource} onChange={setNfSource} placeholder="Pick a source field"
                  options={(cols || []).map(c => ({ id: c.col, label: c.col, type: c.type }))}
                  renderTrigger={o => o.id ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={20} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink)" }}>{o.label}</span></span> : <span style={{ color: "var(--ink-4)" }}>Pick a source field</span>}
                  renderOption={o => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={18} />{o.label}</span>} />
              </div>
            </div>
          )}
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 16 }}>{isNew ? "Chain functions to compute the new field's value from the source. They run top to bottom." : "Functions run top to bottom on the source value before it's written to the destination field. Drag-free reorder by removing and re-adding."}</div>
          {list.map((t, i) => {
            const def = tfDef(t.fn);
            const cfg = t.cfg || {};
            const forceSave = def && def.alwaysSaveNew;
            const showNewField = forceSave || t.saveNew;
            return (
              <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--bg-canvas)", marginBottom: 12 }}>
                {/* header: step + function picker + remove */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: def ? "1px solid var(--line-2)" : "none" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--ink)", color: "var(--bg-canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <CustomSelect value={t.fn} onChange={v => setFn(i, v)} placeholder="Select a function"
                      options={TRANSFORM_FUNCTIONS.map(f => ({ id: f.id, label: f.label }))}
                      renderTrigger={o => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid var(--line)", background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ink-2)" }}>{fnGlyph(o.id)}</span>{o.label}</span>}
                      renderOption={o => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid var(--line)", background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ink-2)" }}>{fnGlyph(o.id)}</span>{o.label}</span>} />
                  </div>
                  <button onClick={() => remove(i)} title="Remove" style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid var(--line)", background: "var(--panel)", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
                  </button>
                </div>
                {/* dependent config */}
                {def && (
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {def.fields.map(f => (
                      <div key={f.key}>
                        <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>{f.label}{f.required && <span style={{ color: "var(--coral)" }}> *</span>}</label>
                        {f.type === "select"
                          ? <CustomSelect value={cfg[f.key] || ""} onChange={v => setCfg(i, f.key, v)} placeholder={f.placeholder || "Select…"} options={f.options.map(o => ({ id: o, label: o }))} />
                          : <input className="winput" placeholder={f.placeholder || ""} value={cfg[f.key] || ""} onChange={e => setCfg(i, f.key, e.target.value)} />}
                        {f.hint && <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 5 }}>{f.hint}</div>}
                      </div>
                    ))}
                    {/* save output in new field */}
                    <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: forceSave ? "default" : "pointer", opacity: forceSave ? 0.7 : 1 }}>
                      <input type="checkbox" checked={showNewField} disabled={forceSave} onChange={e => setItem(i, { saveNew: e.target.checked })} style={{ accentColor: "#16341f", width: 15, height: 15 }} />
                      <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Save output in a new field{forceSave ? " (required)" : ""}</span>
                    </label>
                    {showNewField && (
                      <div>
                        <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Transformed field name <span style={{ color: "var(--coral)" }}>*</span></label>
                        <input className="winput winput-mono" placeholder={col + "_transformed"} value={t.newField || ""} onChange={e => setItem(i, { newField: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={add} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", border: "1px dashed var(--line)", borderRadius: 9, background: "var(--bg-canvas)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink-2)", marginTop: 2, width: "100%", justifyContent: "center" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--ink-3)" }}>+</span> Add transformation
          </button>
        </div>
        {/* footer */}
        <div style={{ flexShrink: 0, padding: "14px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel-2)" }}>
          {isNew ? (
            <>
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button onClick={() => onSave && onSave({ name: nfName.trim(), source: nfSource, chain: list })} className="btn-dark" disabled={!canSaveNew} style={{ opacity: canSaveNew ? 1 : 0.45 }}>Add field</button>
            </>
          ) : (
            <>
              <button onClick={() => onChange([])} disabled={!list.length} className="btn-ghost" style={{ opacity: list.length ? 1 : 0.4 }}>Clear all</button>
              <button onClick={onClose} className="btn-dark">Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Record-level ingest filter — conditions evaluated against source rows so only
// matching records are pulled into the node. Distinct from the field-view filter.
const RECORD_FILTER_OPS = [
  { id: "contains",     label: "Contains" },
  { id: "not_contains", label: "Does not contain" },
  { id: "equals",       label: "Equals" },
  { id: "not_equals",   label: "Does not equal" },
  { id: "starts_with",  label: "Starts with" },
  { id: "gt",           label: "Greater than" },
  { id: "lt",           label: "Less than" },
  { id: "is_empty",     label: "Is empty" },
  { id: "is_not_empty", label: "Is not empty" },
];
function opNeedsValue(op) { return op !== "is_empty" && op !== "is_not_empty"; }
function opLabel(op) { const o = RECORD_FILTER_OPS.find(x => x.id === op); return o ? o.label : op; }

// Popover condition-builder for the record ingest filter.
function FilterRecordsPopover({ cols, initial, objName, onApply, onClear, onClose }) {
  const blank = () => ({ field: "", op: "contains", value: "" });
  const [rows, setRows] = useState((initial && initial.length) ? initial.map(r => Object.assign({}, r)) : [blank()]);
  const setRow = (i, patch) => setRows(rs => rs.map((r, j) => j === i ? Object.assign({}, r, patch) : r));
  const addRow = () => setRows(rs => rs.concat([blank()]));
  const removeRow = i => setRows(rs => (rs.length <= 1 ? [blank()] : rs.filter((_, j) => j !== i)));
  const valid = rows.filter(r => r.field && (opNeedsValue(r.op) ? String(r.value || "").length > 0 : true));
  const fieldOpts = cols.map(c => ({ id: c.col, label: c.col, type: c.type }));
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 41, width: 600, maxWidth: "82vw", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 18px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--line-2)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Filter records</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.4 }}>Only ingest {objName} records that match <b style={{ color: "var(--ink-2)" }}>all</b> of these conditions.</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--line)", background: "none", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, fontSize: 12 }}>✕</button>
        </div>
        <div style={{ padding: "13px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 42, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{i === 0 ? "Where" : "And"}</span>
              <div style={{ width: 168, flexShrink: 0 }}>
                <CustomSelect value={r.field} onChange={v => setRow(i, { field: v })} placeholder="Field" options={fieldOpts}
                  renderTrigger={o => o.id ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MapTypeGlyph type={o.type} size={20} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span></span> : <span style={{ color: "var(--ink-4)" }}>Field</span>}
                  renderOption={o => <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MapTypeGlyph type={o.type} size={18} />{o.label}</span>} />
              </div>
              <div style={{ width: 156, flexShrink: 0 }}>
                <CustomSelect value={r.op} onChange={v => setRow(i, { op: v })} options={RECORD_FILTER_OPS} />
              </div>
              {opNeedsValue(r.op)
                ? <input className="winput" style={{ flex: 1, minWidth: 0 }} placeholder="Value" value={r.value || ""} onChange={e => setRow(i, { value: e.target.value })} />
                : <div style={{ flex: 1 }} />}
              <button onClick={() => removeRow(i)} title="Remove" style={{ width: 34, height: 36, borderRadius: 8, border: "1px solid var(--line)", background: "var(--panel)", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addRow} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", border: "1px dashed var(--line)", borderRadius: 8, background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--ink-3)" }}>+</span> Add condition
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--line-2)", background: "var(--panel-2)", borderRadius: "0 0 12px 12px" }}>
          <button onClick={() => { setRows([blank()]); onClear(); }} className="btn-ghost">Clear all</button>
          <button onClick={() => onApply(valid)} className="btn-dark" disabled={valid.length === 0} style={{ opacity: valid.length ? 1 : 0.45 }}>Apply{valid.length ? " · " + valid.length : ""}</button>
        </div>
      </div>
    </>
  );
}

// ── Src Step (structured): Per-object agents ─────────────────────────────────
// For each object selected in the Objects step, optionally run one or more
// agents (in sequence) that read every record and emit additional fields. The
// final output (source columns + agent fields) is previewable one step away.
const OBJECT_AGENTS = [
  // ── General purpose ────────────────────────────────────────────────────────
  { id: "enrich_company",    name: "Company Enricher Agent",        desc: "Appends verified firmographics, technographics and funding data from external providers.",
    outputs: [
      { col: "employee_count",       type: "int",      sample: "540" },
      { col: "annual_revenue_usd",   type: "decimal",  sample: "24500000.00" },
      { col: "funding_stage",        type: "string",   sample: "Series B" },
      { col: "total_funding_usd",    type: "decimal",  sample: "42000000.00" },
      { col: "tech_stack",           type: "string[]", sample: "Salesforce, Snowflake, Segment" },
      { col: "growth_signal",        type: "string",   sample: "hiring_surge" },
      { col: "linkedin_url",         type: "string",   sample: "linkedin.com/company/acme" },
    ]
  },
  { id: "lead_score",        name: "Lead Scorer Agent",             desc: "Scores leads on ICP fit, behavioural intent, and engagement velocity.",
    outputs: [
      { col: "fit_score",            type: "int",      sample: "82" },
      { col: "intent_score",         type: "int",      sample: "67" },
      { col: "engagement_velocity",  type: "string",   sample: "accelerating" },
      { col: "priority_tier",        type: "string",   sample: "A" },
      { col: "icp_match",            type: "bool",     sample: "true" },
      { col: "recommended_action",   type: "string",   sample: "Immediate AE outreach — high fit + intent" },
    ]
  },
  { id: "dedupe",            name: "Duplicate Detector Agent",      desc: "Cross-references records to cluster duplicates and surface the authoritative survivor.",
    outputs: [
      { col: "dup_cluster_id",       type: "string",   sample: "clu_4f9" },
      { col: "is_survivor",          type: "bool",     sample: "true" },
      { col: "match_confidence",     type: "float",    sample: "0.94" },
      { col: "matched_fields",       type: "string[]", sample: "email, domain, phone" },
      { col: "merge_recommendation", type: "string",   sample: "Merge into acc_8f3" },
    ]
  },
  { id: "sentiment",         name: "Relationship Health Agent",     desc: "Reads interaction history, notes and email signals to compute a live relationship health score.",
    outputs: [
      { col: "relationship_health",  type: "string",   sample: "healthy" },
      { col: "health_score",         type: "int",      sample: "78" },
      { col: "sentiment_trend",      type: "string",   sample: "improving" },
      { col: "last_positive_signal", type: "string",   sample: "QBR — strong executive alignment" },
      { col: "risk_flag",            type: "string",   sample: "none" },
    ]
  },
  { id: "summarize",         name: "Record Summarizer Agent",       desc: "Writes an AI-generated executive summary per record, synthesizing all available context.",
    outputs: [
      { col: "ai_summary",           type: "string",   sample: "Enterprise SaaS account ($2.1M ARR), expanding into EMEA. Renewal in Q3. Champion is VP Engineering." },
      { col: "key_themes",           type: "string[]", sample: "expansion, EMEA, security review" },
      { col: "last_updated_context", type: "timestamp",sample: "2026-06-01T09:00Z" },
    ]
  },
  { id: "geocode",           name: "Address Geocoder Agent",        desc: "Normalizes addresses, resolves coordinates, and appends timezone and market territory.",
    outputs: [
      { col: "lat",                  type: "decimal",  sample: "37.7749" },
      { col: "lng",                  type: "decimal",  sample: "-122.4194" },
      { col: "normalized_address",   type: "string",   sample: "548 Market St, San Francisco, CA 94105" },
      { col: "timezone",             type: "string",   sample: "America/Los_Angeles" },
      { col: "sales_territory",      type: "string",   sample: "West — Enterprise" },
    ]
  },

  // ── CRM / HubSpot specific ─────────────────────────────────────────────────
  { id: "deal_intelligence", name: "Deal Intelligence Agent",       desc: "Reads deal history, activity gaps and competitive signals to predict outcome and recommend the next best action.",
    outputs: [
      { col: "win_probability",      type: "float",    sample: "0.68" },
      { col: "deal_health",          type: "string",   sample: "at_risk" },
      { col: "stuck_stage_days",     type: "int",      sample: "14" },
      { col: "competitive_threat",   type: "string",   sample: "Salesforce in active evaluation" },
      { col: "buyer_sentiment",      type: "string",   sample: "cautiously positive" },
      { col: "missing_stakeholder",  type: "string",   sample: "Economic buyer not engaged" },
      { col: "recommended_action",   type: "string",   sample: "Arrange exec-to-exec call within 5 days" },
      { col: "close_quarter_signal", type: "string",   sample: "Q3 2026" },
    ]
  },
  { id: "contact_enricher",  name: "Contact Intelligence Agent",    desc: "Infers buying role, influence level, and engagement posture from cross-channel contact activity.",
    outputs: [
      { col: "persona",              type: "string",   sample: "Economic Buyer" },
      { col: "seniority",            type: "string",   sample: "VP" },
      { col: "buying_role",          type: "string",   sample: "Decision Maker" },
      { col: "engagement_level",     type: "string",   sample: "high" },
      { col: "last_engagement_type", type: "string",   sample: "Replied to proposal email" },
      { col: "likely_champion",      type: "bool",     sample: "true" },
      { col: "influence_score",      type: "int",      sample: "88" },
    ]
  },
  { id: "renewal_risk",      name: "Renewal Risk Agent",            desc: "Predicts renewal outcome from usage patterns, NPS trends, support volume and relationship signals.",
    outputs: [
      { col: "renewal_risk_score",   type: "int",      sample: "72" },
      { col: "risk_category",        type: "string",   sample: "at_risk" },
      { col: "primary_risk_factor",  type: "string",   sample: "Feature adoption dropped 40% in last 60d" },
      { col: "secondary_risk_factor",type: "string",   sample: "3 open escalated tickets" },
      { col: "nps_trend",            type: "string",   sample: "declining" },
      { col: "recommended_play",     type: "string",   sample: "QBR within 2 weeks + success plan review" },
      { col: "renewal_probability",  type: "float",    sample: "0.61" },
    ]
  },
  { id: "campaign_scorer",   name: "Campaign Performance Agent",    desc: "Attributes pipeline and revenue to campaigns, scores ROI and surfaces the highest-converting segments.",
    outputs: [
      { col: "influenced_arr",       type: "decimal",  sample: "840000.00" },
      { col: "pipeline_sourced",     type: "decimal",  sample: "320000.00" },
      { col: "cost_per_opportunity", type: "decimal",  sample: "1240.00" },
      { col: "roi_signal",           type: "string",   sample: "high" },
      { col: "top_segment",          type: "string",   sample: "Enterprise EMEA" },
      { col: "conversion_rate",      type: "float",    sample: "0.18" },
      { col: "recommended_next",     type: "string",   sample: "Double spend on EMEA Enterprise cohort" },
    ]
  },

  // ── Finance / NetSuite specific ────────────────────────────────────────────
  { id: "payment_risk",      name: "Payment Risk Agent",            desc: "Predicts late payment, disputes and default risk from invoice history, customer balance and payment velocity.",
    outputs: [
      { col: "payment_risk",         type: "string",   sample: "medium" },
      { col: "days_late_predicted",  type: "int",      sample: "12" },
      { col: "dispute_probability",  type: "float",    sample: "0.14" },
      { col: "credit_risk_tier",     type: "string",   sample: "B" },
      { col: "avg_days_to_pay",      type: "int",      sample: "38" },
      { col: "collection_action",    type: "string",   sample: "Send automated reminder on Day 7" },
    ]
  },
  { id: "revenue_classifier", name: "Revenue Classifier Agent",     desc: "Tags each transaction as ARR, NRR, one-time, expansion or contraction — critical for clean revenue accounting.",
    outputs: [
      { col: "revenue_type",         type: "string",   sample: "recurring_expansion" },
      { col: "arr_delta",            type: "decimal",  sample: "+48000.00" },
      { col: "nrr_impact",           type: "string",   sample: "positive" },
      { col: "expansion_driver",     type: "string",   sample: "seat_add" },
      { col: "recognition_schedule", type: "string",   sample: "ratable_monthly" },
      { col: "gaap_flag",            type: "bool",     sample: "true" },
    ]
  },

  // ── Support / Zendesk specific ─────────────────────────────────────────────
  { id: "ticket_intelligence", name: "Ticket Intelligence Agent",   desc: "Classifies ticket root cause, measures churn risk, detects escalation patterns and generates a resolution suggestion.",
    outputs: [
      { col: "ticket_category",      type: "string",   sample: "billing_dispute" },
      { col: "root_cause",           type: "string",   sample: "Proration calculation mismatch on seat downgrade" },
      { col: "churn_risk_signal",    type: "string",   sample: "high" },
      { col: "escalation_needed",    type: "bool",     sample: "true" },
      { col: "escalation_reason",    type: "string",   sample: "Executive mentioned cancellation intent" },
      { col: "resolution_suggestion",type: "string",   sample: "Apply $240 credit, confirm in writing, follow up in 24h" },
      { col: "csat_risk",            type: "string",   sample: "below_target" },
      { col: "sentiment",            type: "string",   sample: "frustrated" },
    ]
  },
  { id: "kb_gap_detector",   name: "Knowledge Gap Detector Agent",  desc: "Clusters recurring ticket topics to surface missing or outdated KB articles and calculate deflection potential.",
    outputs: [
      { col: "missing_article_topic",type: "string",   sample: "API rate limit behaviour after plan downgrade" },
      { col: "recurrence_count",     type: "int",      sample: "14" },
      { col: "affected_plan_tiers",  type: "string[]", sample: "Starter, Growth" },
      { col: "deflection_potential", type: "string",   sample: "high" },
      { col: "suggested_title",      type: "string",   sample: "How rate limits change when you downgrade your plan" },
    ]
  },

  // ── Product Usage specific ─────────────────────────────────────────────────
  { id: "expansion_signal",  name: "Expansion Signal Agent",        desc: "Detects accounts approaching plan limits or showing cross-sell readiness based on usage trajectory.",
    outputs: [
      { col: "expansion_score",      type: "int",      sample: "84" },
      { col: "expansion_type",       type: "string",   sample: "seat_upsell" },
      { col: "trigger_feature",      type: "string",   sample: "Automations — 92% of quota used" },
      { col: "limit_proximity",      type: "string",   sample: "seats at 94% capacity" },
      { col: "cross_sell_signal",    type: "string[]", sample: "Brain module, Analytics add-on" },
      { col: "urgency",              type: "string",   sample: "high — will hit limit in ~9 days" },
      { col: "recommended_play",     type: "string",   sample: "CSM to propose Team plan upgrade immediately" },
    ]
  },
  { id: "churn_predictor",   name: "Churn Predictor Agent",         desc: "Combines usage decline, login gap, NPS drop and support volume into a calibrated churn probability.",
    outputs: [
      { col: "churn_probability",    type: "float",    sample: "0.31" },
      { col: "churn_horizon",        type: "string",   sample: "60_days" },
      { col: "top_risk_signal",      type: "string",   sample: "Core feature usage down 60% MoM" },
      { col: "secondary_signal",     type: "string",   sample: "No login in 18 days from 3 seats" },
      { col: "days_since_active",    type: "int",      sample: "18" },
      { col: "risk_tier",            type: "string",   sample: "medium" },
      { col: "save_play",            type: "string",   sample: "Trigger re-engagement playbook + CSM outreach" },
    ]
  },

  // ── Apollo / Enrichment specific ──────────────────────────────────────────
  { id: "buying_intent",     name: "Buying Intent Agent",           desc: "Aggregates third-party intent signals, web activity and job postings to score active buying intent per account.",
    outputs: [
      { col: "intent_score",         type: "int",      sample: "91" },
      { col: "intent_topics",        type: "string[]", sample: "CRM replacement, data integration, API platform" },
      { col: "intent_source",        type: "string[]", sample: "G2 reviews, job posts, web research" },
      { col: "surging_signal",       type: "bool",     sample: "true" },
      { col: "buying_window",        type: "string",   sample: "0–30 days" },
      { col: "competitor_evaluated", type: "string",   sample: "Salesforce, HubSpot" },
      { col: "recommended_action",   type: "string",   sample: "Immediate outbound — top 3% intent globally" },
    ]
  },

  // ── DocuSign / Contract specific ──────────────────────────────────────────
  { id: "contract_risk",     name: "Contract Risk Agent",           desc: "Reads envelope events to detect stalls, missing signers, unusual clause patterns and legal risk flags.",
    outputs: [
      { col: "contract_risk",        type: "string",   sample: "medium" },
      { col: "stall_reason",         type: "string",   sample: "Counter-party legal review requested" },
      { col: "stall_days",           type: "int",      sample: "5" },
      { col: "missing_signer",       type: "string",   sample: "CFO signature pending" },
      { col: "legal_flag",           type: "string",   sample: "Indemnification clause modified by counter-party" },
      { col: "redline_summary",      type: "string",   sample: "2 material changes: liability cap, governing law" },
      { col: "recommended_action",   type: "string",   sample: "AE to nudge CFO + legal to review redlines" },
      { col: "contract_health",      type: "string",   sample: "needs_attention" },
    ]
  },

  // ── Monday / Project specific ──────────────────────────────────────────────
  { id: "project_health",    name: "Project Health Agent",          desc: "Scores project delivery risk from milestone velocity, blocker patterns and team engagement.",
    outputs: [
      { col: "delivery_risk",        type: "string",   sample: "high" },
      { col: "schedule_variance_d",  type: "int",      sample: "8" },
      { col: "blockers_open",        type: "int",      sample: "3" },
      { col: "milestone_velocity",   type: "string",   sample: "slowing" },
      { col: "team_engagement",      type: "string",   sample: "low — 2 assignees inactive 5d+" },
      { col: "risk_summary",         type: "string",   sample: "Phase 2 at risk of slipping; 3 unresolved blockers, key BSA unavailable" },
      { col: "recommended_action",   type: "string",   sample: "Escalate to PM; replace unavailable resource" },
    ]
  },
];
// Saved automations (pre-built pipelines) that also add fields — the alternative
// to an agent when running extraction/enrichment on an object.
const RUN_AUTOMATIONS = [
  { id: "auto_geocode",  name: "Geocode Automation",            desc: "Resolves any address fields to coordinates.",       outputs: [{ col: "latitude", type: "decimal", sample: "37.7749" }, { col: "longitude", type: "decimal", sample: "-122.4194" }] },
  { id: "auto_currency", name: "Currency Normalizer Automation", desc: "Converts monetary amounts to a base currency.",      outputs: [{ col: "amount_base", type: "decimal", sample: "12450.00" }, { col: "base_currency", type: "string", sample: "USD" }] },
  { id: "auto_dedupe",   name: "Dedupe Automation",             desc: "Flags duplicate records against existing nodes.",    outputs: [{ col: "dup_of", type: "string", sample: "—" }, { col: "is_duplicate", type: "bool", sample: "false" }] },
];
function agentDef(id) { return OBJECT_AGENTS.find(a => a.id === id) || (typeof DOC_ENRICH_AGENTS !== "undefined" && DOC_ENRICH_AGENTS.find(a => a.id === id)) || (typeof EXTRACTION_AGENTS !== "undefined" && EXTRACTION_AGENTS.find(a => a.id === id)) || RUN_AUTOMATIONS.find(a => a.id === id) || null; }
// Agent-extracted fields for an object, as mappable columns. Namespaced col keys
// ("fx::<agent>::<field>") so they never collide with same-named source columns.
function agentFieldsFor(s, objName) {
  const a = (s.objectAgents || {})[objName];
  const ids = Array.isArray(a) ? a : (a ? [a] : []);
  return ids.reduce((acc, id) => { const ag = agentDef(id); return ag ? acc.concat(ag.outputs.map(o => ({ col: "fx::" + id + "::" + o.col, label: o.col, type: o.type, sample: o.sample, agent: ag.name }))) : acc; }, []);
}

// Inline picker for the Extract step: two dropdowns inline (method + the
// specific agent/automation) with a subtle close to the right — no extra chrome.
function InlineRunPicker({ agents, automations, onAdd, onClose }) {
  const [kind, setKind] = useState("");
  const isAuto = kind === "automation";
  const list = isAuto ? automations : agents;
  const opts = list.map(o => ({ id: o.id, title: o.label, label: o.label }));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <SrcRichSelect dense value={kind} onChange={setKind} options={METHOD_KIND_OPTS} emptyLabel="Pick a method" />
      </div>
      <div style={{ flex: 1, minWidth: 0, opacity: kind ? 1 : 0.45, pointerEvents: kind ? "auto" : "none", transition: "opacity 120ms" }}>
        <SrcRichSelect dense searchable plainOptions searchPlaceholder={isAuto ? "Search automations…" : "Search agents…"} value="" onChange={id => onAdd(id)} options={kind ? opts : []} emptyLabel={kind ? (isAuto ? "Select an automation…" : "Select an agent…") : "Pick a method first"} />
      </div>
      <button onClick={onClose} title="Cancel" style={{ border: "none", background: "none", cursor: "pointer", padding: 4, color: "var(--ink-4)", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}

function SrcObjectAgents({ s, set, groups, sel, agentPoolFor, fileMode }) {
  const assigned = s.objectAgents || {};
  const [previewFor, setPreviewFor] = useState("");
  // Back-compat: a value may be a single id (old) or an array (chain).
  const chainOf = obj => Array.isArray(assigned[obj]) ? assigned[obj] : (assigned[obj] ? [assigned[obj]] : []);
  const setChain = (obj, arr) => set({ objectAgents: Object.assign({}, assigned, (function () { var o = {}; o[obj] = arr; return o; })()) });
  const addAgent = (obj, id) => { if (!id) return; const c = chainOf(obj); if (c.indexOf(id) < 0) setChain(obj, c.concat([id])); };
  const removeAgent = (obj, id) => setChain(obj, chainOf(obj).filter(x => x !== id));
  const outFieldCount = obj => chainOf(obj).reduce((n, id) => n + ((agentDef(id) || { outputs: [] }).outputs.length), 0);
  const previewGroup = previewFor ? groups.find(g => g.name === previewFor) : null;
  const [openPicker, setOpenPicker] = useState("");
  // Structured sources already have columns → agents/automations *enrich* records;
  // unstructured files need *extraction*. Both can be an agent OR an automation.
  const stepTitle = fileMode ? "Extract fields" : "Extract data";
  const ctaLabel = "+ Extract fields";
  const runBtn = (g, label, pressed) => (
    <button onClick={() => setOpenPicker(openPicker === g.name ? "" : g.name)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, color: pressed ? "var(--ink)" : "var(--ink-2)", background: pressed ? "var(--chip)" : "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", flexShrink: 0 }}>{label}</button>
  );
  return (
    <StepWrap wide title={stepTitle}>
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 16, lineHeight: 1.55, maxWidth: 760 }}>{fileMode
        ? <>Run an agent or automation on each file type to pull structured fields out of the documents — these become available to map in the next step. This step is optional.</>
        : <>Optionally run an agent or automation on each object — it reads every record and extracts additional fields, available to map in the next step.</>}</div>
      {groups.length === 0 && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 11, background: "var(--panel)", padding: "40px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>{fileMode ? "No file types selected — go back to Discover Files and pick at least one." : "No objects selected — go back to the Objects step and pick at least one."}</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {groups.map(g => {
          const chain = chainOf(g.name);
          const total = outFieldCount(g.name);
          const raw = agentPoolFor ? agentPoolFor(g) : { agents: OBJECT_AGENTS, automations: RUN_AUTOMATIONS };
          const pools = Array.isArray(raw) ? { agents: raw, automations: RUN_AUTOMATIONS } : raw;
          const availAgents = (pools.agents || []).filter(a => chain.indexOf(a.id) < 0).map(a => ({ id: a.id, label: a.name }));
          const availAutomations = (pools.automations || []).filter(a => chain.indexOf(a.id) < 0).map(a => ({ id: a.id, label: a.name }));
          const hasAvail = availAgents.length + availAutomations.length > 0;
          const hasAgents = chain.length > 0;
          const pickerOpen = openPicker === g.name;
          const bodyOpen = hasAgents || pickerOpen;
          return (
            <div key={g.name} style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 16px", borderBottom: bodyOpen ? "1px solid var(--line-2)" : "none", background: "#fff", borderRadius: bodyOpen ? "12px 12px 0 0" : 12 }}>
                {sel && <SrcConnectorLogo c={sel} size={18} />}
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{g.label || g.name}</code>
                {!fileMode && <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{(g.type || "Object") + " · " + g.cols.length + " columns"}</span>}
                {hasAgents
                  ? <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.4px", color: "var(--purple)", background: "color-mix(in oklab, var(--purple) 12%, transparent)", padding: "3px 8px", borderRadius: 5 }}>＋{total} FIELDS</span>
                  : <span style={{ marginLeft: "auto", flexShrink: 0 }}>{runBtn(g, pickerOpen ? "Cancel" : ctaLabel, pickerOpen)}</span>}
              </div>
              {bodyOpen && (
                <div style={{ padding: "13px 16px" }}>
                  {hasAgents && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {chain.map((id, i) => {
                        const a = agentDef(id); if (!a) return null;
                        return (
                          <div key={id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 9, background: "#fff" }}>
                            <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: "var(--ink)", color: "var(--panel)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{a.name}</div>
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>＋{a.outputs.length} field{a.outputs.length === 1 ? "" : "s"} · {a.desc}</div>
                            </div>
                            <button onClick={() => removeAgent(g.name, id)} title="Remove" style={{ border: "none", background: "none", cursor: "pointer", padding: 4, color: "var(--ink-4)", flexShrink: 0 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {pickerOpen && <InlineRunPicker agents={availAgents} automations={availAutomations} onAdd={id => { addAgent(g.name, id); setOpenPicker(""); }} onClose={() => setOpenPicker("")} />}

                  {hasAgents && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                      <button onClick={() => setPreviewFor(g.name)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: "var(--ink-2)", padding: 0 }}>
                        Preview output <span style={{ fontSize: 13 }}>→</span>
                      </button>
                      {hasAvail && !pickerOpen && <button onClick={() => setOpenPicker(g.name)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: "var(--ink-2)", padding: 0 }}>+ Run another</button>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {previewGroup && <SrcAgentOutputDrawer obj={previewGroup} agents={chainOf(previewGroup.name).map(agentDef).filter(Boolean)} onClose={() => setPreviewFor("")} />}
    </StepWrap>
  );
}

// Right-side drawer: the final record shape after agents run — source columns
// plus every field the assigned agents add, with sample values.
function SrcAgentOutputDrawer({ obj, agents, onClose }) {
  const srcCols = obj ? obj.cols : [];
  const total = srcCols.length + agents.reduce((n, a) => n + a.outputs.length, 0);
  const row = (c, key) => (
    <div key={key} style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1fr) auto", gap: 11, alignItems: "center", padding: "9px 20px", borderTop: "1px solid var(--line-2)" }}>
      <MapTypeGlyph type={c.type} size={24} />
      <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.col}</code>
      <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180, textAlign: "right" }}>{c.sample != null ? c.sample : "—"}</code>
    </div>
  );
  // Section header — every section (source and each agent) renders the same way:
  // a subtle banded row with a top divider, so sections are clearly segregated.
  const sectionLabel = (t, n, first) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", background: "var(--panel-2)", borderTop: first ? "none" : "1px solid var(--line)" }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.6px", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 600 }}>{t}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "var(--ink-4)" }}>· {n}</span>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)", zIndex: 60, display: "flex", justifyContent: "flex-end", animation: "flow-fade-in 140ms ease-out" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 470, maxWidth: "82%", height: "100%", background: "var(--panel)", borderLeft: "1px solid var(--line)", boxShadow: "-24px 0 60px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
          <span style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg-canvas)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 21, color: "var(--ink)", lineHeight: 1.1 }}>Final output</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}><code>{obj ? obj.name : ""}</code> · {total} fields{agents.length ? " · " + agents.length + " agent" + (agents.length > 1 ? "s" : "") : ""}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line)", background: "none", cursor: "pointer", color: "var(--ink-3)", flexShrink: 0, fontSize: 13 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          <React.Fragment key="src">
            {srcCols.map((c, i) => row(c, "src-" + i))}
          </React.Fragment>
          {agents.map((a, ai) => (
            <React.Fragment key={"ag-" + ai}>
              {sectionLabel(a.name, a.outputs.length)}
              {a.outputs.map((o, i) => row(o, "ag" + ai + "-" + i))}
            </React.Fragment>
          ))}
        </div>
        <div style={{ flexShrink: 0, padding: "14px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel-2)" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-3)" }}>Sample values · one record</span>
          <button onClick={onClose} className="btn-dark">Done</button>
        </div>
      </div>
    </div>
  );
}

function SrcMapping({ s, set, groups, activeObj, nodeProps, node, sel, openCol, setOpenCol, eyebrow, title, desc, singleGroup }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const mapping = s.mapping || {};
  const transforms = s.transforms || {};
  const groupList = groups || [];
  const mk = (g, c) => g + "::" + c;
  const updateMap = (key, propId) => set({ mapping: Object.assign({}, mapping, (function () { var o = {}; o[key] = propId; return o; })()) });
  const GRID = "minmax(180px,1.3fr) minmax(190px,1.2fr) 34px minmax(190px,1.3fr)";

  // Map ONE object at a time — the active object is driven by the sidebar sub-nav.
  const current = (activeObj && groupList.find(g => g.name === activeObj)) || groupList[0] || null;
  // Resolve a destination node (the pipeline may not carry one), then build a rich
  // grouped destination list: node properties + the attributes of each connected edge.
  const _winNodes = (typeof window !== "undefined" && window.NODES) || [];
  const _entNodes = _winNodes.filter(n => n.type === "entity");
  const _objName = current ? (current.name || "").toLowerCase() : "";
  const targetNode = node
    || _entNodes.find(n => n.label.toLowerCase() === _objName)
    || _entNodes.find(n => n.id === "contract") || _entNodes.find(n => n.id === "account")
    || _entNodes[0] || null;
  const _tProps = targetNode && window.generateProps
    ? window.generateProps(targetNode).map(p => ({ id: p.name, label: p.name, type: p.type }))
    : (nodeProps || []).map(p => ({ id: p.id, label: p.id, type: p.type }));
  const _winEdges = (typeof window !== "undefined" && window.EDGES) || [];
  const _tEdges = targetNode ? _winEdges.filter(e => e.s === targetNode.id || e.t === targetNode.id) : [];
  const _edgeAttrs = () => [
    { name: "since", type: "datetime" }, { name: "weight", type: "decimal" },
    { name: "confidence", type: "decimal" }, { name: "source_system", type: "string" },
  ];
  const _mEdgeGroups = (targetNode ? _tEdges : []).map((e, ei) => {
    const out = e.s === targetNode.id;
    const other = _winNodes.find(n => n.id === (out ? e.t : e.s));
    return {
      key: "e" + ei + ":" + e.label,
      label: <span className="csel-edgehd"><span className="csel-edgehd-rel">:{e.label}</span><span className="csel-edgehd-arrow">{out ? "→" : "←"}</span><span className="csel-edgehd-node">{other ? other.label : "?"}</span></span>,
      items: _edgeAttrs(e).map(a => ({ id: "edge:" + e.label + ":" + a.name, label: a.name, type: a.type, onEdge: e.label })),
    };
  });
  const destTabs = [
    { label: "Properties", count: _tProps.length, items: _tProps.concat([{ id: "__new__", label: "+ New property" }]) },
    { label: "Edges", count: _mEdgeGroups.reduce((s, g) => s + g.items.length, 0), groups: _mEdgeGroups },
  ];
  const curCols = current ? current.cols : [];
  // Fields the assigned agents add — mappable alongside the source columns.
  const agentFields = current ? agentFieldsFor(s, current.name) : [];
  const allFields = curCols.concat(agentFields);
  const total = allFields.length;
  const mappedCount = allFields.filter(c => mapping[mk(current.name, c.col)]).length;
  const recordFilters = s.recordFilters || {};
  const activeFilters = current ? (recordFilters[current.name] || []) : [];
  const tfields = current ? ((s.transformedFields || {})[current.name] || []) : [];
  const removeTf = id => { const cur = s.transformedFields || {}; const arr = (cur[current.name] || []).filter(t => t.id !== id); set({ transformedFields: Object.assign({}, cur, (function () { var o = {}; o[current.name] = arr; return o; })()) }); };
  const colVisible = (c) => {
    const key = mk(current.name, c.col);
    const nm = c.label || c.col;
    if (q && nm.toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
    if (tab === "mapped") return !!mapping[key];
    if (tab === "unmapped") return !mapping[key];
    return true;
  };

  function renderRow(g, col, i, last) {
    const key = mk(g.name, col.col);
    const mapped = mapping[key];
    const tlist = transforms[key] || [];
    const isOpen = openCol === key;
    return (
      <div key={key} style={{ borderTop: i ? "1px solid var(--line-2)" : "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "12px 16px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <MapTypeGlyph type={col.type} />
            <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.label || col.col}</code>
            {col.col === "id" && !col.agent && <MapBadge tone="var(--green)">PK</MapBadge>}
          </div>
          <button onClick={() => setOpenCol(key)}
            style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: "100%", padding: "7px 10px", borderRadius: 8, borderWidth: 1, borderStyle: tlist.length || isOpen ? "solid" : "dashed", borderColor: isOpen ? "var(--ink)" : tlist.length ? "var(--line)" : "transparent", background: isOpen ? "var(--bg-canvas)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", minHeight: 34 }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--panel-2)"; if (!tlist.length && !isOpen) e.currentTarget.style.borderColor = "var(--line)"; }}
            onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; if (!tlist.length && !isOpen) e.currentTarget.style.borderColor = "transparent"; }}>
            {tlist.length === 0
              ? <span style={{ fontSize: 12, color: "var(--ink-4)" }}>+ Add transformation</span>
              : tlist.map((t, j) => <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, padding: "2px 7px", borderRadius: 5, background: "var(--chip)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>{t.fn ? tfLabel(t.fn) : "function…"}</span>)}
            <span style={{ marginLeft: "auto", color: "var(--ink-3)", flexShrink: 0, display: "flex" }} title="Edit transformations">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
            </span>
          </button>
          <div style={{ textAlign: "center", color: mapped ? "var(--green)" : "var(--ink-4)", fontSize: 15 }}>→</div>
          <CustomSelect value={mapped || ""} onChange={v => updateMap(key, v)} placeholder="Select field" tabs={destTabs} searchable searchPlaceholder="Search properties & edge attributes…"
            renderTrigger={o => o.id && o.id !== "__new__" ? <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}><MapTypeGlyph type={o.type} size={22} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>{o.onEdge && <MapBadge tone="var(--gold)">{":" + o.onEdge}</MapBadge>}{o.id === "id" && <><MapBadge tone="var(--green)">PK</MapBadge><MapBadge>UK</MapBadge></>}</span> : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-4)" }}>{o.label || "Select field"}</span>}
            renderOption={o => o.id && o.id !== "__new__" ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={20} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{o.label}</span></span> : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-3)" }}>{o.label}</span>} />
        </div>
      </div>
    );
  }

  function tableHeader(round) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "10px 16px", background: "var(--panel-2)", borderBottom: "1px solid var(--line-2)", borderRadius: round ? "11px 11px 0 0" : "0", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)" }}>
        <div>Source fields</div><div>Transformations</div><div></div><div>Destination fields</div>
      </div>
    );
  }

  // Derived "transformed fields" created via the toolbar render as extra mappable rows.
  function renderTfRow(tf) {
    const key = mk(current.name, tf.name);
    const mapped = mapping[key];
    const srcCol = curCols.find(c => c.col === tf.source);
    const tfType = srcCol ? srcCol.type : "string";
    const chain = (tf.chain || []).filter(t => t.fn);
    return (
      <div key={tf.id} style={{ borderTop: "1px solid var(--line-2)", background: "color-mix(in oklab, var(--purple) 4%, transparent)" }}>
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 12, padding: "12px 16px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <MapTypeGlyph type={tfType} />
            <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tf.name}</code>
            <MapBadge tone="var(--purple)">FX</MapBadge>
            <button onClick={() => removeTf(tf.id)} title="Remove field" style={{ marginLeft: 2, width: 22, height: 22, borderRadius: 5, border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <button onClick={() => setOpenCol(current.name + "::__newtf__")} title="Transformed via" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", minHeight: 34 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ink-4)" }}>from {tf.source}</span>
            {chain.map((t, j) => <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, padding: "2px 7px", borderRadius: 5, background: "var(--chip)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>{tfLabel(t.fn)}</span>)}
            {chain.length === 0 && <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>passthrough</span>}
          </button>
          <div style={{ textAlign: "center", color: mapped ? "var(--green)" : "var(--ink-4)", fontSize: 15 }}>→</div>
          <CustomSelect value={mapped || ""} onChange={v => updateMap(key, v)} placeholder="Select field" tabs={destTabs} searchable searchPlaceholder="Search properties & edge attributes…"
            renderTrigger={o => o.id && o.id !== "__new__" ? <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}><MapTypeGlyph type={o.type} size={22} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>{o.onEdge && <MapBadge tone="var(--gold)">{":" + o.onEdge}</MapBadge>}</span> : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-4)" }}>{o.label || "Select field"}</span>}
            renderOption={o => o.id && o.id !== "__new__" ? <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapTypeGlyph type={o.type} size={20} /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{o.label}</span></span> : <span style={{ color: o.id === "__new__" ? "var(--ink-2)" : "var(--ink-3)" }}>{o.label}</span>} />
        </div>
      </div>
    );
  }

  const multiObj = groupList.length > 1;
  const objName = current ? current.name : "";
  const stepTitle = title || (multiObj && objName
    ? `Map ${objName} fields to ${node?.label || "the node"}`
    : `Map ${sel ? sel.name : "source"} fields to ${node?.label || "the node"}`);

  return (
    <StepWrap wide title={stepTitle}>
      {/* toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {/* field-view dropdown (defaults to All fields; width hugs its text) */}
        <CustomSelect className="csel-auto" value={tab} onChange={setTab}
          options={[
            { id: "all",      label: "All fields", count: total },
            { id: "mapped",   label: "Mapped",     count: mappedCount },
            { id: "unmapped", label: "Unmapped",   count: total - mappedCount },
          ]}
          renderTrigger={o => <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{o.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 10, background: "var(--chip)", color: "var(--ink-3)" }}>{o.count}</span>
          </span>}
          renderOption={o => <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <span style={{ flex: 1 }}>{o.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 10, background: "var(--chip)", color: "var(--ink-3)" }}>{o.count}</span>
          </span>} />

        {/* filter records */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setFilterOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 13px", height: 40, borderRadius: 9, border: "1px solid " + (filterOpen || activeFilters.length ? "var(--ink)" : "var(--line)"), background: filterOpen ? "var(--bg-canvas)" : "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
            Filter records
            {activeFilters.length > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, minWidth: 18, textAlign: "center", padding: "1px 6px", borderRadius: 10, background: "var(--ink)", color: "var(--panel)" }}>{activeFilters.length}</span>}
          </button>
          {filterOpen && current && (
            <FilterRecordsPopover key={current.name} cols={curCols} initial={activeFilters} objName={current.name}
              onApply={rows => { set({ recordFilters: Object.assign({}, recordFilters, (function () { var o = {}; o[current.name] = rows; return o; })()) }); setFilterOpen(false); }}
              onClear={() => { set({ recordFilters: Object.assign({}, recordFilters, (function () { var o = {}; o[current.name] = []; return o; })()) }); setFilterOpen(false); }}
              onClose={() => setFilterOpen(false)} />
          )}
        </div>

        {/* add a derived field via the transformation panel */}
        <button onClick={() => current && setOpenCol(current.name + "::__newtf__")}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 13px", height: 40, borderRadius: 9, border: "1px solid var(--line)", background: "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 400, color: "var(--ink-3)", lineHeight: 1 }}>+</span>
          Transformed field
        </button>

        <div style={{ position: "relative", marginLeft: "auto", width: 240 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          </span>
          <input className="winput" style={{ paddingLeft: 34 }} placeholder="Search fields…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {/* active record-filter summary */}
      {activeFilters.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12, padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 9, background: "var(--bg-canvas)" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", flexShrink: 0 }}>Ingesting only where</span>
          {activeFilters.map((f, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--panel)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
              {i > 0 && <span style={{ color: "var(--ink-4)" }}>and</span>}
              <b style={{ color: "var(--ink)", fontWeight: 600 }}>{f.field}</b>
              <span style={{ color: "var(--ink-3)" }}>{opLabel(f.op).toLowerCase()}</span>
              {opNeedsValue(f.op) && <b style={{ color: "var(--ink)", fontWeight: 600 }}>{f.value}</b>}
            </span>
          ))}
          <button onClick={() => setFilterOpen(true)} className="btn-ghost" style={{ marginLeft: "auto", padding: "4px 10px", fontSize: 12 }}>Edit</button>
        </div>
      )}

      {!current && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 11, background: "var(--panel)", padding: "40px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No objects selected — go back to the Objects step and pick at least one.</div>
      )}

      {current && (function () {
        const sourceVisible = curCols.filter(colVisible);
        const agentVisible = agentFields.filter(colVisible);
        // group the agent-extracted fields by the agent that produced them
        const agentGroups = [];
        agentVisible.forEach(f => { let gg = agentGroups.find(x => x.name === f.agent); if (!gg) { gg = { name: f.agent, fields: [] }; agentGroups.push(gg); } gg.fields.push(f); });
        const hasAgents = agentFields.length > 0;
        // subtle section header — kept as quiet as the column captions above
        const sectionLabel = (text, count, first) => (
          <div key={"sec-" + text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "var(--panel-2)", borderTop: first ? "none" : "1px solid var(--line)" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 600 }}>{text}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "var(--ink-4)" }}>· {count}</span>
          </div>
        );
        const empty = sourceVisible.length === 0 && agentVisible.length === 0 && tfields.length === 0;
        return (
          <div style={{ border: "1px solid var(--line)", borderRadius: 11, background: "var(--panel)", overflow: "hidden" }}>
            {/* active object caption */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", borderBottom: "1px solid var(--line)", background: "#f0eeeb" }}>
              {!singleGroup && sel && <SrcConnectorLogo c={sel} size={18} />}
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{current.name}</code>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{(current.type || "Object") + " · " + current.cols.length + " columns" + (hasAgents ? " · " + agentFields.length + " from agents" : "")}</span>
              <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, color: mappedCount ? "var(--green)" : "var(--ink-3)" }}>{mappedCount + "/" + total + " mapped"}</span>
            </div>
            {tableHeader(false)}
            {hasAgents ? (
              <>
                {sourceVisible.map((col, i) => renderRow(current, col, i))}
                {agentGroups.map(ag => (
                  <React.Fragment key={ag.name}>
                    {sectionLabel(ag.name, ag.fields.length)}
                    {ag.fields.map((col, i) => renderRow(current, col, i))}
                  </React.Fragment>
                ))}
              </>
            ) : (
              sourceVisible.map((col, i) => renderRow(current, col, i, i === sourceVisible.length - 1))
            )}
            {tab !== "mapped" && tfields.map(tf => renderTfRow(tf))}
            {empty && <div style={{ padding: "30px", textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>No fields match the current filter.</div>}
          </div>
        );
      })()}
    </StepWrap>
  );
}

// ── Src Step 4: Schedule ──────────────────────────────────────────────────────

// Selectable radio card used across settings.
function SetCard({ on, title, desc, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", display: "flex", gap: 11, alignItems: "center", padding: "11px 15px", borderRadius: 10, borderWidth: 1, borderStyle: "solid", borderColor: on ? "color-mix(in oklab, var(--ink) 22%, var(--line))" : "var(--line)", background: on ? "var(--panel)" : "transparent", cursor: "pointer", fontFamily: "inherit", boxShadow: on ? "0 1px 2px rgba(40,40,20,0.06)" : "none", marginBottom: 10 }}>
      <span style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: "1px solid " + (on ? "var(--ink)" : "var(--line)"), background: on ? "var(--ink)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--bg-canvas)" }} />}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 9, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", flexShrink: 0 }}>{title}</span>
        <span style={{ fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</span>
      </span>
    </button>
  );
}

const SET_ICONS = {
  bolt: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 4 14 11 14 10 22 19 10 12 10 13 2" /></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>,
  layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 12 15 2 8.5 12 2" /><polyline points="2 15.5 12 22 22 15.5" /></svg>,
  live: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M3 12a9 9 0 0 1 9-9M21 12a9 9 0 0 1-9 9" /></svg>,
  archive: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" /><line x1="10" y1="12" x2="14" y2="12" /></svg>,
  cursor: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l6 18 2-7 7-2z" /></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>,
};
// Unstructured-source settings. Single on/off capabilities are toggles; the ones
// that hold a list of rules ("add" control) use a + to add more. (Config TBD.)
const U_SETTINGS = [
  { id: "refresh",   control: "toggle", name: "Refresh frequency",          desc: "Re-scan and re-index this source on a schedule — daily, weekly, monthly or a custom cron." },
  { id: "retention", control: "toggle", name: "Knowledge retention",        desc: "Keep extracted knowledge for a set window, then purge it automatically." },
  { id: "skipperms", control: "toggle", name: "Skip source permission checks", desc: "Index content without enforcing each user's source-level access. Faster, but lowers access fidelity." },
  { id: "pii",       control: "add",    name: "PII masking",                desc: "Add rules to detect and mask personal data (emails, names, IDs) as content is indexed." },
  { id: "indexing",  control: "add",    name: "Indexing strategy",          desc: "Add strategies for how content is chunked and embedded for retrieval." },
];

// ── Edit mode: rebuild a fully-configured flow state from a compact pipeline spec ──
// Used when a row on the Sources page is clicked — the same wizard opens with every
// step logically pre-selected (connection, scope, discovery, agents, destinations, map).
function buildEditState(es, node, base) {
  const st = Object.assign({}, base, { mapping: {}, objectAgents: {}, entityNode: {}, entityInclude: {}, transforms: {}, readLocations: [], readFilters: {} });
  const sel = SOURCE_SYSTEMS.find(x => x.id === es.system);
  st.system = es.system;
  const conns = getConnections(es.system, sel);
  st.connection = es.connection || (conns[0] && conns[0].id) || "";
  st.uSettings = Object.assign({}, es.settings || { refresh: true });
  const allNodes = (typeof window !== "undefined" && window.NODES) || [];
  const propsFor = nid => { const n = allNodes.find(x => x.id === nid); return (n && window.generateProps) ? window.generateProps(n).map(p => p.name) : []; };
  // Pick the most sensible destination property for a source column. Falls back so
  // that every column lands on *some* real property — the map reads fully configured.
  const pickProp = (col, pn) => {
    const c = String(col).toLowerCase();
    const idProp = pn.find(p => /_id$/.test(p) && !/owner|parent|csm/.test(p));
    const cand = [];
    const exact = pn.find(p => p.toLowerCase() === c); if (exact) cand.push(exact);
    if (/name|title|subject|policy_name|full_name/.test(c)) cand.push("name");
    if (/owner|author|sender|organizer|shared_by|created_by|vendor|participant|attendee|recipient|assignee|party|parties|attendees/.test(c)) cand.push("owner_id", "csm_id");
    if (/email/.test(c)) cand.push("primary_contact_email");
    if (/(^id$|^file_id$|^message_id$|^thread_id$|^[a-z]+_id$|number$|_no$)/.test(c) && !/owner|parent|csm|account_id/.test(c)) cand.push(idProp);
    if (/domain/.test(c)) cand.push("domain");
    if (/industry/.test(c)) cand.push("industry");
    if (/country|region|location|jurisdiction/.test(c)) cand.push("region");
    if (/tax/.test(c)) cand.push("tax_id");
    if (/tier/.test(c)) cand.push("tier");
    if (/revenue|arr|annual/.test(c)) cand.push("arr_usd", "amount");
    if (/amount|total|value|due|price|cost/.test(c)) cand.push("amount", "arr_usd");
    if (/created|started|sent|posted|placed|effective|published|modified|updated|order_date|_at$|_date$|^date$|^last_/.test(c)) cand.push("created_at", "fiscal_year_end");
    if (/file_type|^type$|severity|kind|category|currency/.test(c)) cand.push("type");
    if (/status|resolved\b|state|approved/.test(c)) cand.push("status");
    if (/priority/.test(c)) cand.push("priority");
    if (/resolved_at/.test(c)) cand.push("resolved_at");
    if (/url|source_url|ref|link|external|governing/.test(c)) cand.push("external_ref");
    if (/tag|skill|label/.test(c)) cand.push("tags");
    if (/summary|recap|rationale|decision|note|action|body|text|description|metadata|content|term/.test(c)) cand.push("metadata");
    cand.push("metadata", "name", idProp, pn[1], pn[0]); // last-resort fallbacks
    for (const p of cand) { if (p && pn.indexOf(p) >= 0) return p; }
    return null;
  };
  const richMap = (group, cols, destId) => {
    if (!destId) return;
    if (destId === "__new__") { (cols || []).forEach(c => { st.mapping[group + "::" + c.col] = "new:" + (c.name || c.col); }); return; }
    const pn = propsFor(destId); if (!pn.length) return;
    (cols || []).forEach(c => {
      const p = pickProp(c.name || c.col, pn); if (p) st.mapping[group + "::" + c.col] = p;
      // Add sensible pre-filled transforms for obvious cases
      const mk2 = group + "::" + c.col;
      const t = c.type || "";
      const cn = (c.name || c.col).toLowerCase();
      if (t === "timestamp" || /_at$|_date$|^date$/.test(cn)) {
        st.transforms[mk2] = [{ fn: "fmt_date", cfg: { fmt: "YYYY-MM-DD HH:mm" } }];
      } else if ((t === "decimal" || t === "float") && /revenue|amount|arr|mrr|price|value|cost|budget|total|due/.test(cn)) {
        st.transforms[mk2] = [{ fn: "round", cfg: { dp: "2" } }];
      } else if (/status|state/.test(cn)) {
        st.transforms[mk2] = [{ fn: "upper", cfg: {} }];
      } else if (/email/.test(cn)) {
        st.transforms[mk2] = [{ fn: "lower", cfg: {} }];
      } else if (/name|title/.test(cn) && !/domain/.test(cn)) {
        st.transforms[mk2] = [{ fn: "trim", cfg: {} }];
      }
    });
  };
  // Full mappable column set for an unstructured entity = file metadata + the fields
  // its extraction agent pulls out of the document body. Agent fields use the same
  // "fx::<agentId>::<col>" mapping key the Map step renders under.
  const entityCols = eid => {
    const a = extractionAgentFor(eid);
    const meta = UNSTRUCTURED_META_COLS.map(c => ({ col: c.col, name: c.col }));
    const af = (a && a.outputs) ? a.outputs.map(o => ({ col: "fx::" + a.id + "::" + o.col, name: o.col })) : [];
    return meta.concat(af);
  };
  const fallbackNode = es.node || (node && node.id) || "";

  if (sel && sel.kind === "unstructured") {
    st.readScope = es.scope || "all";
    st.readLocations = (es.locations || []).map((l, i) => ({ id: "loc-" + es.system + "-" + i, label: l }));
    st.readFilters = es.filters || {};
    if (es.contentMode) st.contentMode = es.contentMode;
    const all = getDiscoveredEntities(sel);
    if (es.contentMode === "single") {
      st.knownType = es.knownType || "";
      const matched = all.find(e => e.name.toLowerCase() === (es.knownType || "").toLowerCase());
      const ke = matched || { id: "custom_" + ((es.knownType || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "type"), name: es.knownType || "Selected type" };
      st.extractRan = true;
      const destId = (es.entityNode && es.entityNode[ke.id]) || fallbackNode;
      if (destId) st.entityNode[ke.id] = destId;
      const a = extractionAgentFor(ke.id); if (a) st.objectAgents[ke.id] = [a.id]; else st.objectAgents[ke.id] = [DOC_ENRICH_AGENTS[0].id];
      richMap(ke.id, entityCols(ke.id), destId);
    } else {
      // Mixed: discovery already ran via an agent — that's what reveals the file types.
      st.discoveryKind = "agent";
      st.entityAgent = (typeof ENTITY_AGENTS !== "undefined" && ENTITY_AGENTS[0]) ? ENTITY_AGENTS[0].id : "entity_extractor";
      st.extractRan = true;
      const includeOnly = es.includeOnly;
      all.forEach(e => {
        if (includeOnly && includeOnly.indexOf(e.id) < 0) { st.entityInclude[e.id] = false; return; }
        st.entityInclude[e.id] = true;
        const destId = (es.entityNode && es.entityNode[e.id]) || fallbackNode;
        if (destId) st.entityNode[e.id] = destId;
        const a = extractionAgentFor(e.id); if (a) st.objectAgents[e.id] = [a.id];
        richMap(e.id, entityCols(e.id), destId);
      });
    }
  } else {
    const objs = getSourceObjects(es.system, sel);
    const names = (es.tables && es.tables.length) ? es.tables : (objs[0] ? [objs[0].name] : []);
    st.tables = names;
    names.forEach(nm => {
      const o = objs.find(x => x.name === nm) || { name: nm };
      // Per-table agents take precedence over the single `agent` fallback
      const perTableAgents = es.tableAgent && es.tableAgent[nm];
      if (perTableAgents) {
        st.objectAgents[nm] = Array.isArray(perTableAgents) ? perTableAgents : [perTableAgents];
      } else if (es.agent) {
        st.objectAgents[nm] = Array.isArray(es.agent) ? es.agent : [es.agent];
      }
      richMap(nm, getObjectCols(o), es.tableNode && es.tableNode[nm] ? es.tableNode[nm] : fallbackNode);
    });
  }
  return st;
}

// ── Demo-ready pipelines for the global Sources page ──────────────────────────
// Curated, logical sources covering the scenarios we demo: structured warehouses
// & apps, plus files, email, Slack, Teams, SharePoint and OneDrive. Each row's
// `edit` spec re-opens the wizard fully configured (see buildEditState).
// ── Catalog extension: the 13 sources & their objects from the architecture doc ──
[
  { id: "monday",       cat: "Project & Support", domain: "monday.com",          name: "Monday",                tag: "Project Mgmt", kind: "structured",   icon: "Mn", slug: "monday",         color: "#FF3D57", desc: "Boards, items, projects, tasks and incidents." },
  { id: "support",      cat: "Project & Support", domain: "unifyapps.com",       name: "Support Portal",        tag: "Ticketing",    kind: "structured",   icon: "UA", slug: "unifyapps",      color: "#16341f", desc: "Support tickets, incidents and help-center articles." },
  { id: "gcal",         cat: "Messaging & Email", domain: "calendar.google.com", name: "Google Calendar",       tag: "Scheduling",   kind: "unstructured", icon: "GC", slug: "googlecalendar", color: "#4285F4", desc: "Meetings, events and scheduling interactions." },
  { id: "productusage", cat: "Identity & Events", domain: "amplitude.com",       name: "Product Usage",         tag: "Analytics",    kind: "structured",   icon: "PU", slug: "amplitude",      color: "#1463FF", desc: "Adoption metrics, usage events and expansion signals." },
  { id: "productdocs",  cat: "Docs & Wikis",      domain: "unifyapps.com",       name: "Product Documentation", tag: "Knowledge",    kind: "unstructured", icon: "UA", slug: "unifyapps",      color: "#16341f", desc: "Product guides and feature documentation." },
  { id: "apollo",       cat: "CRM & Marketing",   domain: "apollo.io",           name: "Apollo",                tag: "Enrichment",   kind: "structured",   icon: "Ap", slug: "apollo",         color: "#6D28D9", desc: "Company & contact data and buying-intent signals." },
  { id: "web",          cat: "Files & Storage",   domain: "google.com",          name: "Web",                   tag: "Public Data",  kind: "unstructured", icon: "We", slug: "googlechrome",   color: "#0891B2", desc: "Competitor sites, news and market data." },
  { id: "docusign",     cat: "Files & Storage",   domain: "docusign.com",        name: "DocuSign",              tag: "E-signature",  kind: "structured",   icon: "DS", slug: "docusign",       color: "#D4B106", desc: "Envelopes and contract signature events." },
].forEach(c => { if (!SOURCE_SYSTEMS.some(x => x.id === c.id)) SOURCE_SYSTEMS.push(c); });

Object.assign(OBJECTS_BY_SYS, {
  hubspot: [
    { name: "Account", type: "Object", rows: "2.8K", cols: 24 }, { name: "Contact", type: "Object", rows: "18K", cols: 18 },
    { name: "Lead", type: "Object", rows: "24K", cols: 14 }, { name: "Opportunity", type: "Object", rows: "6.2K", cols: 22 },
    { name: "Campaign", type: "Object", rows: "320", cols: 12 }, { name: "Renewal", type: "Object", rows: "2.4K", cols: 11 },
    { name: "Product", type: "Object", rows: "180", cols: 9 }, { name: "Subscription", type: "Object", rows: "2.8K", cols: 13 },
    { name: "Contract", type: "Object", rows: "1.2K", cols: 16 },
  ],
  netsuite: [
    { name: "Invoice", type: "Table", rows: "12K", cols: 16 }, { name: "Payment", type: "Table", rows: "11K", cols: 10 },
    { name: "Subscription", type: "Table", rows: "2.8K", cols: 13 }, { name: "Renewal", type: "Table", rows: "2.4K", cols: 11 },
    { name: "Order", type: "Table", rows: "9.4K", cols: 14 }, { name: "Customer", type: "Table", rows: "2.8K", cols: 20 },
  ],
  monday: [
    { name: "Issue", type: "Item", rows: "4.1K", cols: 12 }, { name: "Project", type: "Board", rows: "210", cols: 10 },
    { name: "Task", type: "Item", rows: "18K", cols: 11 }, { name: "Incident", type: "Item", rows: "310", cols: 12 },
  ],
  support: [
    { name: "Ticket", type: "Object", rows: "142K", cols: 18 }, { name: "Incident", type: "Object", rows: "310", cols: 12 },
    { name: "Article", type: "Object", rows: "640", cols: 9 }, { name: "Conversation", type: "Object", rows: "98K", cols: 11 },
  ],
  productusage: [
    { name: "usage_events", type: "Table", rows: "25M", cols: 12 }, { name: "feature_adoption", type: "Table", rows: "48K", cols: 9 },
    { name: "account_signals", type: "View", rows: "2.8K", cols: 8 }, { name: "sessions", type: "Table", rows: "1.2M", cols: 10 },
  ],
  apollo: [
    { name: "Company", type: "Object", rows: "48K", cols: 22 }, { name: "Contact", type: "Object", rows: "120K", cols: 18 },
    { name: "Lead", type: "Object", rows: "24K", cols: 14 }, { name: "IntentSignal", type: "Object", rows: "8.4K", cols: 9 },
  ],
  docusign: [
    { name: "Envelope", type: "Object", rows: "9.4K", cols: 14 }, { name: "SignatureEvent", type: "Object", rows: "22K", cols: 9 },
    { name: "Recipient", type: "Object", rows: "31K", cols: 11 }, { name: "Template", type: "Object", rows: "48", cols: 7 },
  ],
});

Object.assign(OBJECT_COLS_BY_NAME, {
  lead: [{ col: "id", type: "string" }, { col: "first_name", type: "string" }, { col: "last_name", type: "string" }, { col: "email", type: "string" }, { col: "company", type: "string" }, { col: "status", type: "string" }, { col: "source", type: "string" }, { col: "score", type: "int" }, { col: "created_at", type: "timestamp" }],
  opportunity: [{ col: "id", type: "string" }, { col: "name", type: "string" }, { col: "account_id", type: "string" }, { col: "stage", type: "string" }, { col: "amount", type: "decimal" }, { col: "close_date", type: "date" }, { col: "owner_id", type: "string" }, { col: "probability", type: "float" }, { col: "created_at", type: "timestamp" }],
  campaign: [{ col: "id", type: "string" }, { col: "name", type: "string" }, { col: "type", type: "string" }, { col: "status", type: "string" }, { col: "start_date", type: "date" }, { col: "budget", type: "decimal" }, { col: "roi", type: "float" }, { col: "created_at", type: "timestamp" }],
  renewal: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "subscription_id", type: "string" }, { col: "renewal_date", type: "date" }, { col: "arr_usd", type: "decimal" }, { col: "status", type: "string" }, { col: "risk", type: "string" }, { col: "created_at", type: "timestamp" }],
  product: [{ col: "id", type: "string" }, { col: "name", type: "string" }, { col: "sku", type: "string" }, { col: "category", type: "string" }, { col: "price", type: "decimal" }, { col: "active", type: "bool" }, { col: "created_at", type: "timestamp" }],
  subscription: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "plan", type: "string" }, { col: "seats", type: "int" }, { col: "mrr", type: "decimal" }, { col: "start_date", type: "date" }, { col: "renewal_date", type: "date" }, { col: "status", type: "string" }],
  contract: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "type", type: "string" }, { col: "value", type: "decimal" }, { col: "start_date", type: "date" }, { col: "end_date", type: "date" }, { col: "status", type: "string" }, { col: "signed_at", type: "timestamp" }],
  invoice: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "amount_due", type: "decimal" }, { col: "currency", type: "string" }, { col: "due_date", type: "date" }, { col: "status", type: "string" }, { col: "issued_at", type: "timestamp" }],
  payment: [{ col: "id", type: "string" }, { col: "invoice_id", type: "string" }, { col: "amount", type: "decimal" }, { col: "method", type: "string" }, { col: "status", type: "string" }, { col: "paid_at", type: "timestamp" }],
  customer: [{ col: "id", type: "string" }, { col: "name", type: "string" }, { col: "email", type: "string" }, { col: "balance", type: "decimal" }, { col: "terms", type: "string" }, { col: "created_at", type: "timestamp" }],
  issue: [{ col: "id", type: "string" }, { col: "title", type: "string" }, { col: "project_id", type: "string" }, { col: "priority", type: "string" }, { col: "status", type: "string" }, { col: "assignee", type: "string" }, { col: "created_at", type: "timestamp" }],
  project: [{ col: "id", type: "string" }, { col: "name", type: "string" }, { col: "owner", type: "string" }, { col: "status", type: "string" }, { col: "start_date", type: "date" }, { col: "due_date", type: "date" }, { col: "progress", type: "int" }],
  task: [{ col: "id", type: "string" }, { col: "title", type: "string" }, { col: "project_id", type: "string" }, { col: "assignee", type: "string" }, { col: "status", type: "string" }, { col: "due_date", type: "date" }, { col: "created_at", type: "timestamp" }],
  incident: [{ col: "id", type: "string" }, { col: "title", type: "string" }, { col: "severity", type: "string" }, { col: "status", type: "string" }, { col: "service", type: "string" }, { col: "opened_at", type: "timestamp" }, { col: "resolved_at", type: "timestamp" }],
  ticket: [{ col: "id", type: "string" }, { col: "subject", type: "string" }, { col: "account_id", type: "string" }, { col: "priority", type: "string" }, { col: "status", type: "string" }, { col: "channel", type: "string" }, { col: "created_at", type: "timestamp" }],
  article: [{ col: "id", type: "string" }, { col: "title", type: "string" }, { col: "category", type: "string" }, { col: "author", type: "string" }, { col: "published_at", type: "timestamp" }, { col: "views", type: "int" }],
  conversation: [{ col: "id", type: "string" }, { col: "ticket_id", type: "string" }, { col: "author", type: "string" }, { col: "channel", type: "string" }, { col: "created_at", type: "timestamp" }],
  company: [{ col: "id", type: "string" }, { col: "name", type: "string" }, { col: "domain", type: "string" }, { col: "industry", type: "string" }, { col: "employees", type: "int" }, { col: "revenue", type: "decimal" }, { col: "country", type: "string" }],
  intentsignal: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "topic", type: "string" }, { col: "intent_score", type: "int" }, { col: "signal_date", type: "date" }, { col: "source", type: "string" }],
  envelope: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "subject", type: "string" }, { col: "status", type: "string" }, { col: "sent_at", type: "timestamp" }, { col: "completed_at", type: "timestamp" }],
  signatureevent: [{ col: "id", type: "string" }, { col: "envelope_id", type: "string" }, { col: "signer", type: "string" }, { col: "event_type", type: "string" }, { col: "occurred_at", type: "timestamp" }],
  recipient: [{ col: "id", type: "string" }, { col: "envelope_id", type: "string" }, { col: "name", type: "string" }, { col: "email", type: "string" }, { col: "role", type: "string" }, { col: "signed_at", type: "timestamp" }],
  usage_events: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "event_type", type: "string" }, { col: "feature", type: "string" }, { col: "occurred_at", type: "timestamp" }, { col: "session_id", type: "string" }],
  feature_adoption: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "feature", type: "string" }, { col: "adoption_pct", type: "float" }, { col: "last_used_at", type: "timestamp" }],
  account_signals: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "signal_type", type: "string" }, { col: "score", type: "float" }, { col: "trend", type: "string" }, { col: "computed_at", type: "timestamp" }],
  sessions: [{ col: "id", type: "string" }, { col: "account_id", type: "string" }, { col: "user_id", type: "string" }, { col: "duration_s", type: "int" }, { col: "started_at", type: "timestamp" }],
});

Object.assign(READ_CONFIGS, {
  gcal:        { container: "calendars", item: "events", entity: "event", linkPh: "Calendar name or link", starts: ["Customer meetings", "QBRs", "Demos", "Internal syncs"] },
  productdocs: { container: "spaces", item: "pages", entity: "page", linkPh: "Space or page link", starts: ["Guides", "Feature docs", "Release notes", "FAQs"] },
  web:         { container: "sites", item: "pages", entity: "page", linkPh: "https://competitor.com/…", starts: ["Competitor pages", "News", "Pricing pages", "Market reports"] },
});

Object.assign(ENTITY_SETS, {
  googledrive: [
    { id: "contract", name: "Contract", records: "1,240", conf: 96, fields: [
      { col: "parties",                type: "string[]", sample: "Acme Corp, Globex Ltd" },
      { col: "contract_type",          type: "string",   sample: "MSA" },
      { col: "effective_date",         type: "date",     sample: "2025-03-01" },
      { col: "expiry_date",            type: "date",     sample: "2027-03-01" },
      { col: "term_months",            type: "int",      sample: "24" },
      { col: "total_value",            type: "decimal",  sample: "480000.00" },
      { col: "auto_renewal",           type: "bool",     sample: "true" },
      { col: "governing_law",          type: "string",   sample: "Delaware" },
      { col: "key_obligations",        type: "string[]", sample: "99.9% SLA, 30-day notice, SOC2 compliance" },
      { col: "risk_flags",             type: "string[]", sample: "Uncapped liability clause, non-standard DPA" },
      { col: "renewal_alert_days",     type: "int",      sample: "90" },
    ]},
    { id: "sow", name: "SOW", records: "640", conf: 93, fields: [
      { col: "project_name",           type: "string",   sample: "CRM Data Migration — Phase 2" },
      { col: "client",                 type: "string",   sample: "Acme Corp" },
      { col: "total_value",            type: "decimal",  sample: "120000.00" },
      { col: "start_date",             type: "date",     sample: "2025-09-01" },
      { col: "end_date",               type: "date",     sample: "2025-12-31" },
      { col: "deliverables",           type: "string[]", sample: "Data mapping, migration scripts, UAT sign-off, training" },
      { col: "milestones",             type: "string[]", sample: "Phase 1 Go-Live Oct 15, Phase 2 Dec 1" },
      { col: "change_order_risk",      type: "string",   sample: "medium — scope partially undefined for Phase 3" },
      { col: "margin_signal",          type: "string",   sample: "healthy — fixed fee, low complexity" },
    ]},
    { id: "proposal", name: "Proposal", records: "980", conf: 90, fields: [
      { col: "account",                type: "string",   sample: "Globex Ltd" },
      { col: "total_amount",           type: "decimal",  sample: "96000.00" },
      { col: "discount_applied",       type: "float",    sample: "0.10" },
      { col: "products_included",      type: "string[]", sample: "Brain, Automations, Analytics add-on" },
      { col: "valid_until",            type: "date",     sample: "2026-03-31" },
      { col: "deal_stage",             type: "string",   sample: "Proposal Sent" },
      { col: "win_probability_signal", type: "string",   sample: "medium — champion engaged, legal pending" },
      { col: "competitive_risk",       type: "string",   sample: "Salesforce in parallel evaluation" },
      { col: "recommended_action",     type: "string",   sample: "Follow up in 3 days if no response" },
    ]},
    { id: "policy", name: "Policy", records: "410", conf: 92, fields: [
      { col: "policy_name",            type: "string",   sample: "Data Retention Policy" },
      { col: "version",                type: "string",   sample: "v3.2" },
      { col: "effective_date",         type: "date",     sample: "2025-09-01" },
      { col: "next_review_date",       type: "date",     sample: "2026-09-01" },
      { col: "owner",                  type: "string",   sample: "Legal — Head of Compliance" },
      { col: "compliance_frameworks",  type: "string[]", sample: "GDPR, SOC2, ISO 27001" },
      { col: "policy_gap_signal",      type: "string",   sample: "none" },
    ]},
    { id: "knowledge_article", name: "Knowledge Article", records: "2,210", conf: 88, fields: [
      { col: "ai_summary",             type: "string",   sample: "How to set up SSO with Okta — covers SAML, SCIM, and troubleshooting." },
      { col: "category",               type: "string",   sample: "Security — Authentication" },
      { col: "target_audience",        type: "string",   sample: "IT Admins" },
      { col: "search_keywords",        type: "string[]", sample: "SSO, SAML, Okta, SCIM, single sign-on" },
      { col: "support_deflection_fit", type: "string",   sample: "high — maps to 28 recent tickets" },
      { col: "freshness_signal",       type: "string",   sample: "stale — not updated in 14 months" },
    ]},
    { id: "case_study", name: "Case Study", records: "180", conf: 90, fields: [
      { col: "customer",               type: "string",   sample: "Initech Financial" },
      { col: "industry",               type: "string",   sample: "Fintech" },
      { col: "use_case",               type: "string",   sample: "Automated revenue reconciliation" },
      { col: "quantified_outcome",     type: "string",   sample: "+38% adoption, 12h/week saved, $200K cost avoided" },
      { col: "products_featured",      type: "string[]", sample: "Brain, NetSuite connector" },
      { col: "deal_size_signal",       type: "string",   sample: "Enterprise — $480K ARR" },
      { col: "reusable_for_segment",   type: "string[]", sample: "Fintech, CFO persona, NetSuite prospects" },
      { col: "published_date",         type: "date",     sample: "2026-01-30" },
    ]},
  ],
  gcal: [
    { id: "gc_discovery", name: "Discovery Call",  records: "4,200", conf: 87, fields: [
      { col: "qualification_outcome",  type: "string",   sample: "qualified" },
      { col: "pain_points",            type: "string[]", sample: "manual reporting, no pipeline visibility" },
      { col: "budget_signal",          type: "string",   sample: "confirmed — $150K budget allocated" },
      { col: "decision_timeline",      type: "string",   sample: "Q3 2026 — board approval in July" },
      { col: "decision_maker_present", type: "bool",     sample: "false" },
      { col: "buyer_risk",             type: "string",   sample: "No economic buyer on call — evaluate access" },
      { col: "opportunity_signal",     type: "string",   sample: "Replacing legacy system, greenfield deal" },
      { col: "competition",            type: "string[]", sample: "Salesforce, HubSpot under evaluation" },
      { col: "next_step",              type: "string",   sample: "Technical deep-dive + bring in economic buyer" },
      { col: "deal_stage_signal",      type: "string",   sample: "Discovery" },
    ]},
    { id: "gc_demo",      name: "Demo / POC",       records: "2,800", conf: 89, fields: [
      { col: "demo_outcome",           type: "string",   sample: "positive" },
      { col: "features_resonated",     type: "string[]", sample: "AI Automations, real-time graph" },
      { col: "objections_raised",      type: "string[]", sample: "integration complexity, pricing model" },
      { col: "champion_identified",    type: "bool",     sample: "true" },
      { col: "champion_name",          type: "string",   sample: "Priya Nair — VP Engineering" },
      { col: "competitors_mentioned",  type: "string[]", sample: "Salesforce — in parallel evaluation" },
      { col: "poc_requested",          type: "bool",     sample: "true" },
      { col: "buyer_sentiment",        type: "string",   sample: "excited about automation layer" },
      { col: "deal_risk",              type: "string",   sample: "Competing vendor offering free POC" },
      { col: "next_step",              type: "string",   sample: "POC kickoff, assign SE within 48h" },
    ]},
    { id: "gc_qbr",       name: "QBR",              records: "1,640", conf: 92, fields: [
      { col: "health_score_signal",    type: "string",   sample: "amber" },
      { col: "adoption_coverage",      type: "string",   sample: "62% of licensed seats active" },
      { col: "expansion_signal",       type: "string",   sample: "Upsell discussed — 30 additional seats" },
      { col: "risk_factors",           type: "string[]", sample: "Low adoption in EMEA team, 2 open escalations" },
      { col: "executive_sponsor_mood", type: "string",   sample: "supportive but watching metrics" },
      { col: "renewal_likelihood",     type: "string",   sample: "likely — conditional on EMEA adoption" },
      { col: "success_plan_needed",    type: "bool",     sample: "true" },
      { col: "action_items",           type: "string[]", sample: "Deliver EMEA training, close 2 escalations, share ROI report" },
    ]},
    { id: "gc_renewal",   name: "Renewal Review",   records: "980",   conf: 94, fields: [
      { col: "renewal_outcome_signal", type: "string",   sample: "at_risk" },
      { col: "arr_discussed",          type: "decimal",  sample: "120000.00" },
      { col: "proposed_arr",           type: "decimal",  sample: "108000.00" },
      { col: "objections",             type: "string[]", sample: "10% price increase, unclear ROI vs. competitor" },
      { col: "decision_maker_present", type: "bool",     sample: "true" },
      { col: "buyer_leverage_signal",  type: "string",   sample: "Competitor quoted 20% cheaper" },
      { col: "churn_risk",             type: "string",   sample: "medium-high" },
      { col: "close_probability",      type: "float",    sample: "0.61" },
      { col: "concession_needed",      type: "string",   sample: "Consider 5% discount + success resource" },
      { col: "next_step",              type: "string",   sample: "Commercial proposal by Friday + exec alignment" },
    ]},
    { id: "gc_exec",      name: "Executive Sync",   records: "620",   conf: 90, fields: [
      { col: "strategic_theme",        type: "string",   sample: "partnership — joint GTM expansion" },
      { col: "executive_sentiment",    type: "string",   sample: "positive — strong commitment signals" },
      { col: "decisions_made",         type: "string[]", sample: "Approve 50-seat expansion, explore co-sell agreement" },
      { col: "risk_signals",           type: "string[]", sample: "CFO mentioned budget freeze in H2" },
      { col: "relationship_depth",     type: "string",   sample: "strategic — C-suite aligned" },
      { col: "follow_up_owner",        type: "string",   sample: "AE + VP Sales" },
      { col: "opportunity_flag",       type: "string",   sample: "Co-sell partnership worth $2M+ pipeline" },
    ]},
  ],
  gmail: [
    { id: "gm_sales",   name: "Sales Outreach",      records: "28,400", conf: 88, fields: [
      { col: "email_category",         type: "string",   sample: "inbound_inquiry" },
      { col: "deal_stage_signal",      type: "string",   sample: "active_evaluation" },
      { col: "buying_trigger",         type: "string",   sample: "Contract with incumbent expiring in 90 days" },
      { col: "products_mentioned",     type: "string[]", sample: "Brain, Automations, Analytics" },
      { col: "competitors_mentioned",  type: "string[]", sample: "Salesforce — mentioned as current vendor" },
      { col: "urgency",                type: "string",   sample: "high" },
      { col: "budget_mentioned",       type: "string",   sample: "$200K approved for Q3" },
      { col: "objection_signal",       type: "string",   sample: "Concerned about migration complexity" },
      { col: "next_step",              type: "string",   sample: "Schedule technical scoping call" },
      { col: "sentiment",              type: "string",   sample: "positive" },
    ]},
    { id: "gm_renewal", name: "Renewal Discussion",  records: "6,200",  conf: 91, fields: [
      { col: "renewal_risk",           type: "string",   sample: "medium" },
      { col: "arr_mentioned",          type: "decimal",  sample: "84000.00" },
      { col: "counter_offer_signal",   type: "string",   sample: "Buyer requesting 15% discount" },
      { col: "decision_maker_engaged", type: "bool",     sample: "true" },
      { col: "timeline_signal",        type: "string",   sample: "Decision needed by July 15" },
      { col: "churn_threat",           type: "string",   sample: "Evaluating competitor — mentioned in CC" },
      { col: "objections",             type: "string[]", sample: "Price increase, ROI not demonstrated to CFO" },
      { col: "action_required",        type: "string",   sample: "Send ROI case study + revised commercial proposal" },
    ]},
    { id: "gm_support", name: "Support Escalation",  records: "12,100", conf: 93, fields: [
      { col: "escalation_reason",      type: "string",   sample: "API timeout causing data sync failure" },
      { col: "severity_signal",        type: "string",   sample: "SEV2" },
      { col: "business_impact",        type: "string",   sample: "Blocking daily revenue reporting for 4 teams" },
      { col: "churn_risk",             type: "string",   sample: "high — exec CC'd and unhappy" },
      { col: "time_in_queue",          type: "string",   sample: "36 hours without resolution" },
      { col: "product_area",           type: "string",   sample: "Integrations — Salesforce connector" },
      { col: "workaround_available",   type: "bool",     sample: "false" },
      { col: "sentiment",              type: "string",   sample: "frustrated" },
      { col: "action_required",        type: "string",   sample: "Engineering escalation + executive acknowledgement today" },
    ]},
    { id: "gm_legal",   name: "Contract / Legal",    records: "3,800",  conf: 95, fields: [
      { col: "document_type",          type: "string",   sample: "MSA redline — round 3" },
      { col: "negotiation_stage",      type: "string",   sample: "final_review" },
      { col: "outstanding_clauses",    type: "string[]", sample: "Indemnification cap, data processing addendum" },
      { col: "deal_value_signal",      type: "decimal",  sample: "240000.00" },
      { col: "legal_blocker",          type: "string",   sample: "Counter-party wants uncapped liability — non-standard" },
      { col: "time_to_close_signal",   type: "string",   sample: "5–10 days if legal aligns" },
      { col: "action_required",        type: "string",   sample: "Legal to respond to redlines within 48h" },
    ]},
    { id: "gm_exec",    name: "Executive Thread",    records: "4,500",  conf: 89, fields: [
      { col: "strategic_topic",        type: "string",   sample: "joint go-to-market partnership" },
      { col: "executive_sentiment",    type: "string",   sample: "positive — leaning in" },
      { col: "commitment_signal",      type: "string",   sample: "Verbal yes to co-sell arrangement" },
      { col: "risk_signal",            type: "string",   sample: "Primary champion leaving in 6 weeks" },
      { col: "urgency",                type: "string",   sample: "high — champion transition creates deal risk" },
      { col: "opportunity",            type: "string",   sample: "Board presentation slot offered — showcase product" },
      { col: "next_step",              type: "string",   sample: "Confirm replacement contact + accelerate legal" },
    ]},
  ],
  productdocs: [
    { id: "pd_article",  name: "Knowledge Article", records: "3,120", conf: 90, fields: [
      { col: "ai_summary",             type: "string",   sample: "Explains how to configure webhooks with HMAC signature verification." },
      { col: "key_concepts",           type: "string[]", sample: "webhooks, event payloads, retry logic, HMAC signing" },
      { col: "feature_names",          type: "string[]", sample: "Webhooks API, Event Bus, Delivery Logs" },
      { col: "use_cases",              type: "string[]", sample: "Real-time CRM sync, event-driven automation, audit trail" },
      { col: "target_persona",         type: "string",   sample: "Developer / Integration Engineer" },
      { col: "support_deflection_fit", type: "string",   sample: "high — maps to 14 recurring tickets" },
      { col: "version_applicability",  type: "string",   sample: "2026.2+" },
      { col: "freshness_signal",       type: "string",   sample: "current" },
    ]},
    { id: "pd_guide",    name: "Product Guide",      records: "640",   conf: 91, fields: [
      { col: "ai_summary",             type: "string",   sample: "Step-by-step Admin onboarding: SSO, role setup, and integration wizard." },
      { col: "target_audience",        type: "string",   sample: "Admins" },
      { col: "prerequisites",          type: "string[]", sample: "Admin access, SSO IdP configured, license assigned" },
      { col: "key_features_covered",   type: "string[]", sample: "Role setup, Integration wizard, Audit log" },
      { col: "common_issues",          type: "string[]", sample: "SAML attribute mismatch, token expiry, SCIM group sync delay" },
      { col: "onboarding_stage",       type: "string",   sample: "Day 1 — Technical Setup" },
      { col: "completion_signal",      type: "string",   sample: "Guides user through 8 steps to first integration" },
    ]},
    { id: "pd_release",  name: "Release Note",       records: "410",   conf: 94, fields: [
      { col: "ai_summary",             type: "string",   sample: "2026.3 ships SSO enforcement, granular audit log, and 40% faster ingest." },
      { col: "highlights",             type: "string[]", sample: "SSO enforcement, Audit log v2, Ingest speed +40%" },
      { col: "breaking_changes",       type: "string[]", sample: "Legacy auth endpoints removed — migration guide required" },
      { col: "affected_areas",         type: "string[]", sample: "Integrations, Settings, Data Pipeline" },
      { col: "customer_impact",        type: "string",   sample: "Customers on legacy auth must migrate by 2026-09-01" },
      { col: "upsell_signal",          type: "string",   sample: "New Analytics add-on introduced — cross-sell opportunity" },
      { col: "release_sentiment",      type: "string",   sample: "high_value" },
    ]},
  ],
  web: [
    { id: "web_competitor", name: "Competitor Page",  records: "1,420", conf: 86, fields: [
      { col: "competitor",             type: "string",   sample: "Rival Inc" },
      { col: "page_type",              type: "string",   sample: "pricing" },
      { col: "pricing_summary",        type: "string",   sample: "3 tiers: Starter $49, Growth $149, Enterprise custom" },
      { col: "positioning_claim",      type: "string",   sample: "Easiest CRM for SMB teams" },
      { col: "feature_gaps_vs_us",     type: "string[]", sample: "No AI layer, no graph model, limited API" },
      { col: "win_themes",             type: "string[]", sample: "Depth of integrations, AI automation, data model" },
      { col: "threat_level",           type: "string",   sample: "medium — strong SMB but weak Enterprise" },
      { col: "captured_at",            type: "timestamp",sample: "2026-05-01T00:00Z" },
    ]},
    { id: "web_news", name: "News Article",           records: "8,900", conf: 84, fields: [
      { col: "headline",               type: "string",   sample: "Acme Corp raises $50M Series C to expand into EMEA" },
      { col: "source",                 type: "string",   sample: "TechCrunch" },
      { col: "account_mentioned",      type: "string[]", sample: "Acme Corp" },
      { col: "event_type",             type: "string",   sample: "funding_round" },
      { col: "buying_signal",          type: "string",   sample: "high — expansion funding often precedes software purchases" },
      { col: "relevance_score",        type: "float",    sample: "0.88" },
      { col: "suggested_action",       type: "string",   sample: "AE outreach within 48h — cite EMEA expansion" },
      { col: "published_at",           type: "timestamp",sample: "2026-04-28T08:00Z" },
    ]},
    { id: "web_market", name: "Market Signal",        records: "3,300", conf: 82, fields: [
      { col: "topic",                  type: "string",   sample: "AI governance regulation — EU AI Act enforcement" },
      { col: "signal_type",            type: "string",   sample: "regulatory_change" },
      { col: "impact_on_product",      type: "string",   sample: "Compliance audit trail features now required by law" },
      { col: "affected_segments",      type: "string[]", sample: "Financial Services, Healthcare, EU-based Enterprise" },
      { col: "opportunity",            type: "string",   sample: "Compliance positioning — high urgency in regulated verticals" },
      { col: "relevance_score",        type: "float",    sample: "0.82" },
      { col: "captured_at",            type: "timestamp",sample: "2026-05-03T00:00Z" },
    ]},
  ],
});
ENTITY_SETS.slack.push({ id: "alert", name: "Alert", records: "5,200", conf: 90, fields: [
  { col: "severity",               type: "string",   sample: "SEV2" },
  { col: "affected_service",       type: "string",   sample: "Auth service — login flow" },
  { col: "alert_type",             type: "string",   sample: "error_rate_spike" },
  { col: "customer_facing",        type: "bool",     sample: "true" },
  { col: "blast_radius",           type: "string",   sample: "~200 active users affected" },
  { col: "escalation_needed",      type: "bool",     sample: "true" },
  { col: "action_taken",           type: "string",   sample: "Rolled back deploy v2.4.2 → v2.4.1" },
  { col: "time_to_detect_min",     type: "int",      sample: "4" },
  { col: "sla_breach_risk",        type: "string",   sample: "breached — 22 min downtime" },
]});

// New entity types need their extraction agents built (the original build ran before these were added).
Object.keys(ENTITY_SETS).forEach(k => ENTITY_SETS[k].forEach(e => {
  if (!EXTRACTION_AGENTS.some(a => a.id === "extract_" + e.id))
    EXTRACTION_AGENTS.push({ id: "extract_" + e.id, name: e.name + " Extraction Agent", desc: "Reads each " + e.name.toLowerCase() + " and extracts its fields.", outputs: e.fields, entityId: e.id, extractor: true });
}));

// ── Demo-ready pipelines — every source from the architecture doc, one pipeline ──
// per source→entity mapping. Each row's `edit` spec re-opens the wizard fully
// configured. Structured sources map to the closest existing node; unstructured
// file types without a node create a new node type.
const DEMO_PIPELINES = [
  // HubSpot (CRM) → Account, Contact, Lead, Opportunity, Campaign, Renewal, Product, Subscription, Contract
  { id: "hub-account", name: "HubSpot", system: "HubSpot", sysId: "hubspot", nodeId: "account", nodeLabel: "Account", type: "Primary", freq: "Streaming", last: "12s ago", rows: "2,840", rowsN: 2840, errors: 0, status: "healthy", edit: { system: "hubspot", node: "account", tables: ["Account"], settings: { refresh: true } } },
  { id: "hub-contact", name: "HubSpot", system: "HubSpot", sysId: "hubspot", nodeId: "person", nodeLabel: "Contact", type: "Primary", freq: "Streaming", last: "30s ago", rows: "18K", rowsN: 18420, errors: 0, status: "healthy", edit: { system: "hubspot", node: "person", tables: ["Contact"], settings: { refresh: true } } },
  { id: "hub-lead", name: "HubSpot", system: "HubSpot", sysId: "hubspot", nodeId: "person", nodeLabel: "Lead", type: "Enrichment", freq: "Every 15m", last: "5m ago", rows: "24K", rowsN: 24100, errors: 0, status: "healthy", edit: { system: "hubspot", node: "person", tables: ["Lead"], settings: { refresh: true } } },
  { id: "hub-opp", name: "HubSpot", system: "HubSpot", sysId: "hubspot", nodeId: "agreement", nodeLabel: "Opportunity", type: "Primary", freq: "Streaming", last: "1m ago", rows: "6,240", rowsN: 6240, errors: 0, status: "healthy", edit: { system: "hubspot", node: "agreement", tables: ["Opportunity"], settings: { refresh: true } } },
  { id: "hub-campaign", name: "HubSpot", system: "HubSpot", sysId: "hubspot", nodeId: "interaction", nodeLabel: "Campaign", type: "Enrichment", freq: "Daily 02:00", last: "6h ago", rows: "318", rowsN: 318, errors: 0, status: "healthy", edit: { system: "hubspot", node: "interaction", tables: ["Campaign"], settings: { refresh: true } } },
  { id: "hub-renewal", name: "HubSpot", system: "HubSpot", sysId: "hubspot", nodeId: "subscription", nodeLabel: "Renewal", type: "Primary", freq: "Hourly", last: "22m ago", rows: "2,410", rowsN: 2410, errors: 0, status: "healthy", edit: { system: "hubspot", node: "subscription", tables: ["Renewal"], settings: { refresh: true } } },
  { id: "hub-product", name: "HubSpot", system: "HubSpot", sysId: "hubspot", nodeId: "subscription", nodeLabel: "Product", type: "Reference", freq: "Daily", last: "1d ago", rows: "184", rowsN: 184, errors: 0, status: "healthy", edit: { system: "hubspot", node: "subscription", tables: ["Product"], settings: { refresh: true } } },
  { id: "hub-subscription", name: "HubSpot", system: "HubSpot", sysId: "hubspot", nodeId: "subscription", nodeLabel: "Subscription", type: "Financial", freq: "Hourly", last: "18m ago", rows: "2,800", rowsN: 2800, errors: 0, status: "healthy", edit: { system: "hubspot", node: "subscription", tables: ["Subscription"], settings: { refresh: true } } },
  { id: "hub-contract", name: "HubSpot", system: "HubSpot", sysId: "hubspot", nodeId: "agreement", nodeLabel: "Contract", type: "Primary", freq: "Hourly", last: "40m ago", rows: "1,240", rowsN: 1240, errors: 9, status: "degraded", edit: { system: "hubspot", node: "agreement", tables: ["Contract"], settings: { refresh: true } } },
  // NetSuite (Finance) → Invoice, Payment, Subscription, Renewal, Order
  { id: "ns-invoice", name: "NetSuite", system: "NetSuite", sysId: "netsuite", nodeId: "invoice", nodeLabel: "Invoice", type: "Financial", freq: "Hourly", last: "18m ago", rows: "12K", rowsN: 12040, errors: 0, status: "healthy", edit: { system: "netsuite", node: "invoice", tables: ["Invoice"], settings: { refresh: true } } },
  { id: "ns-payment", name: "NetSuite", system: "NetSuite", sysId: "netsuite", nodeId: "invoice", nodeLabel: "Payment", type: "Financial", freq: "Hourly", last: "26m ago", rows: "11K", rowsN: 11200, errors: 0, status: "healthy", edit: { system: "netsuite", node: "invoice", tables: ["Payment"], settings: { refresh: true } } },
  { id: "ns-subscription", name: "NetSuite", system: "NetSuite", sysId: "netsuite", nodeId: "subscription", nodeLabel: "Subscription", type: "Financial", freq: "Hourly", last: "18m ago", rows: "2,800", rowsN: 2800, errors: 0, status: "healthy", edit: { system: "netsuite", node: "subscription", tables: ["Subscription"], settings: { refresh: true } } },
  { id: "ns-renewal", name: "NetSuite", system: "NetSuite", sysId: "netsuite", nodeId: "subscription", nodeLabel: "Renewal", type: "Financial", freq: "Daily", last: "4h ago", rows: "2,410", rowsN: 2410, errors: 0, status: "healthy", edit: { system: "netsuite", node: "subscription", tables: ["Renewal"], settings: { refresh: true } } },
  { id: "ns-order", name: "NetSuite", system: "NetSuite", sysId: "netsuite", nodeId: "invoice", nodeLabel: "Order", type: "Financial", freq: "Hourly", last: "33m ago", rows: "9,420", rowsN: 9420, errors: 0, status: "healthy", edit: { system: "netsuite", node: "invoice", tables: ["Order"], settings: { refresh: true } } },
  // Monday (Project Mgmt) → Issue, Project, Task, Incident
  { id: "mon-issue", name: "Monday", system: "Monday", sysId: "monday", nodeId: "incident", nodeLabel: "Issue", type: "Operational", freq: "Every 30m", last: "12m ago", rows: "4,120", rowsN: 4120, errors: 0, status: "healthy", edit: { system: "monday", node: "incident", tables: ["Issue"], settings: { refresh: true } } },
  { id: "mon-project", name: "Monday", system: "Monday", sysId: "monday", nodeId: "ticket", nodeLabel: "Project", type: "Operational", freq: "Every 30m", last: "14m ago", rows: "210", rowsN: 210, errors: 0, status: "healthy", edit: { system: "monday", node: "ticket", tables: ["Project"], settings: { refresh: true } } },
  { id: "mon-task", name: "Monday", system: "Monday", sysId: "monday", nodeId: "ticket", nodeLabel: "Task", type: "Operational", freq: "Every 30m", last: "9m ago", rows: "18K", rowsN: 18400, errors: 0, status: "healthy", edit: { system: "monday", node: "ticket", tables: ["Task"], settings: { refresh: true } } },
  { id: "mon-incident", name: "Monday", system: "Monday", sysId: "monday", nodeId: "incident", nodeLabel: "Incident", type: "Operational", freq: "Every 15m", last: "6m ago", rows: "310", rowsN: 310, errors: 0, status: "healthy", edit: { system: "monday", node: "incident", tables: ["Incident"], settings: { refresh: true } } },
  // Support Portal (Ticketing) → Ticket, Incident, Knowledge Article
  { id: "sup-ticket", name: "Support Portal", system: "Support Portal", sysId: "support", nodeId: "ticket", nodeLabel: "Ticket", type: "Primary", freq: "Streaming", last: "1m ago", rows: "142K", rowsN: 142000, errors: 0, status: "healthy", edit: { system: "support", node: "ticket", tables: ["Ticket"], settings: { refresh: true } } },
  { id: "sup-incident", name: "Support Portal", system: "Support Portal", sysId: "support", nodeId: "incident", nodeLabel: "Incident", type: "Operational", freq: "Streaming", last: "2m ago", rows: "310", rowsN: 310, errors: 5, status: "degraded", edit: { system: "support", node: "incident", tables: ["Incident"], settings: { refresh: true } } },
  { id: "sup-article", name: "Support Portal", system: "Support Portal", sysId: "support", nodeId: "interaction", nodeLabel: "Knowledge Article", type: "Reference", freq: "Daily", last: "8h ago", rows: "640", rowsN: 640, errors: 0, status: "healthy", edit: { system: "support", node: "interaction", tables: ["Article"], settings: { refresh: true } } },
  // Product Usage (Analytics) → Expansion Signal, Customer Use Case
  { id: "pu-signal", name: "Product Usage", system: "Product Usage", sysId: "productusage", nodeId: "signal", nodeLabel: "Expansion Signal", type: "Analytics", freq: "Streaming", last: "1m ago", rows: "2,800", rowsN: 2800, errors: 0, status: "healthy", edit: { system: "productusage", node: "signal", tables: ["account_signals"], settings: { refresh: true } } },
  { id: "pu-usecase", name: "Product Usage", system: "Product Usage", sysId: "productusage", nodeId: "signal", nodeLabel: "Customer Use Case", type: "Analytics", freq: "Hourly", last: "20m ago", rows: "48K", rowsN: 48000, errors: 0, status: "healthy", edit: { system: "productusage", node: "signal", tables: ["feature_adoption"], settings: { refresh: true } } },
  // Apollo (Enrichment) → Lead, Contact, Intent Signal
  { id: "apl-lead", name: "Apollo", system: "Apollo", sysId: "apollo", nodeId: "person", nodeLabel: "Lead", type: "Enrichment", freq: "Daily", last: "12h ago", rows: "24K", rowsN: 24100, errors: 0, status: "healthy", edit: { system: "apollo", node: "person", tables: ["Lead"], settings: { refresh: true } } },
  { id: "apl-contact", name: "Apollo", system: "Apollo", sysId: "apollo", nodeId: "person", nodeLabel: "Contact", type: "Enrichment", freq: "Daily", last: "12h ago", rows: "120K", rowsN: 120000, errors: 0, status: "healthy", edit: { system: "apollo", node: "person", tables: ["Contact"], settings: { refresh: true } } },
  { id: "apl-intent", name: "Apollo", system: "Apollo", sysId: "apollo", nodeId: "signal", nodeLabel: "Intent Signal", type: "Enrichment", freq: "Every 6h", last: "3h ago", rows: "8,400", rowsN: 8400, errors: 0, status: "healthy", edit: { system: "apollo", node: "signal", tables: ["IntentSignal"], settings: { refresh: true } } },
  // DocuSign (E-signature) → Contract (signature events)
  { id: "ds-contract", name: "DocuSign", system: "DocuSign", sysId: "docusign", nodeId: "agreement", nodeLabel: "Contract", type: "Primary", freq: "Real time", last: "4m ago", rows: "9,420", rowsN: 9420, errors: 0, status: "healthy", edit: { system: "docusign", node: "agreement", tables: ["SignatureEvent"], settings: { refresh: true } } },
  // Google Drive (Documents) → Contract, SOW, Proposal, Policy, Knowledge Article, Case Study
  { id: "drv", name: "Google Drive", system: "Google Drive", sysId: "googledrive", nodeId: "agreement", nodeLabel: "Agreement +5", type: "Documents", freq: "Every 6h", last: "2h ago", rows: "6,930", rowsN: 6930, errors: 0, status: "healthy",
    edit: { system: "googledrive", node: "agreement", scope: "folders", locations: ["Legal / Contracts", "Sales / SOWs", "Sales / Proposals", "Legal / Policies", "Docs / Knowledge", "Marketing / Case Studies"], contentMode: "mixed",
      includeOnly: ["contract", "sow", "proposal", "policy", "knowledge_article", "case_study"], entityNode: { contract: "agreement", sow: "__new__", proposal: "__new__", policy: "__new__", knowledge_article: "__new__", case_study: "__new__" }, settings: { refresh: true, retention: true } } },
  // Gmail (Email) → Interaction (email)
  { id: "gml", name: "Gmail", system: "Gmail", sysId: "gmail", nodeId: "interaction", nodeLabel: "Interaction", type: "Email", freq: "Every 1h", last: "22m ago", rows: "184K", rowsN: 184500, errors: 0, status: "healthy",
    edit: { system: "gmail", node: "interaction", scope: "folders", locations: ["Sales inbox", "Success inbox"], contentMode: "mixed", includeOnly: ["gm_sales", "gm_renewal", "gm_support", "gm_legal", "gm_exec"], entityNode: { gm_sales: "interaction", gm_renewal: "interaction", gm_support: "interaction", gm_legal: "interaction", gm_exec: "interaction" }, settings: { refresh: true } } },
  // Google Calendar (Scheduling) → Interaction (meeting)
  { id: "gcl", name: "Google Calendar", system: "Google Calendar", sysId: "gcal", nodeId: "interaction", nodeLabel: "Interaction", type: "Scheduling", freq: "Every 1h", last: "35m ago", rows: "24K", rowsN: 24800, errors: 0, status: "healthy",
    edit: { system: "gcal", node: "interaction", scope: "folders", locations: ["Sales calendar", "CS calendar"], contentMode: "mixed", includeOnly: ["gc_discovery", "gc_demo", "gc_qbr", "gc_renewal", "gc_exec"], entityNode: { gc_discovery: "interaction", gc_demo: "interaction", gc_qbr: "interaction", gc_renewal: "interaction", gc_exec: "interaction" }, settings: { refresh: true } } },
  // Slack (Communication) → Interaction, Decision, Incident, Alert
  { id: "slk", name: "Slack", system: "Slack", sysId: "slack", nodeId: "interaction", nodeLabel: "Interaction +3", type: "Communication", freq: "Streaming", last: "1m ago", rows: "44K", rowsN: 44250, errors: 3, status: "degraded",
    edit: { system: "slack", node: "interaction", scope: "folders", locations: ["#sales-wins", "#oncall", "#cs-alerts"], contentMode: "mixed",
      includeOnly: ["thread", "decision", "incident", "alert"], entityNode: { thread: "interaction", decision: "signal", incident: "incident", alert: "__new__" }, settings: { refresh: true, skipperms: true } } },
  // Product Documentation (Knowledge Base) → Knowledge Article, Product Guide, Release Note
  { id: "pdc", name: "Product Documentation", system: "Product Documentation", sysId: "productdocs", nodeId: "interaction", nodeLabel: "Knowledge Article +2", type: "Knowledge", freq: "Daily", last: "9h ago", rows: "4,170", rowsN: 4170, errors: 0, status: "healthy",
    edit: { system: "productdocs", node: "interaction", scope: "folders", locations: ["Docs / Guides", "Docs / API", "Docs / Releases"], contentMode: "mixed",
      includeOnly: ["pd_article", "pd_guide", "pd_release"], entityNode: { pd_article: "__new__", pd_guide: "__new__", pd_release: "__new__" }, settings: { refresh: true } } },
  // Web (Public Data) → Competitor, News, Market Signal
  { id: "web", name: "Web", system: "Web", sysId: "web", nodeId: "signal", nodeLabel: "Competitor +2", type: "Public Data", freq: "Daily", last: "9h ago", rows: "13K", rowsN: 13620, errors: 0, status: "healthy",
    edit: { system: "web", node: "signal", scope: "folders", locations: ["rival.com", "Industry news", "Market reports"], contentMode: "mixed",
      includeOnly: ["web_competitor", "web_news", "web_market"], entityNode: { web_competitor: "__new__", web_news: "__new__", web_market: "signal" }, settings: { refresh: true } } },
];
if (typeof window !== "undefined") { window.DEMO_PIPELINES = DEMO_PIPELINES; window.buildEditState = buildEditState; }
function SrcToggle({ on, onClick }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on} style={{ width: 40, height: 23, borderRadius: 12, border: "none", cursor: "pointer", background: on ? "var(--ink)" : "var(--line)", position: "relative", flexShrink: 0, transition: "background 130ms", padding: 0 }}>
      <span style={{ position: "absolute", top: 2.5, left: on ? 19.5 : 2.5, width: 18, height: 18, borderRadius: "50%", background: "var(--panel)", boxShadow: "0 1px 2px rgba(0,0,0,0.2)", transition: "left 130ms" }} />
    </button>
  );
}
function SrcUnstructuredSettings({ s, set }) {
  const cfg = s.uSettings || {};
  const isOn = o => (o.id in cfg ? !!cfg[o.id] : !!o.default);
  const toggle = o => set({ uSettings: Object.assign({}, U_SETTINGS.reduce((a, x) => { a[x.id] = isOn(x); return a; }, {}), (function () { var z = {}; z[o.id] = !isOn(o); return z; })()) });
  return (
    <StepWrap wide title="Settings">
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 16, lineHeight: 1.55, maxWidth: 760 }}>Control how this source is kept in sync and governed. Turn on what you need or add rules — you can configure the details later.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 760 }}>
        {U_SETTINGS.map(o => {
          const isAdd = o.control === "add";
          const on = !isAdd && isOn(o);
          const Tag = isAdd ? "div" : "label";
          return (
            <Tag key={o.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 11, cursor: isAdd ? "default" : "pointer", border: "1px solid " + (on ? "var(--line)" : "var(--line-2)"), background: "var(--panel)", transition: "background 120ms" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{o.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.5 }}>{o.desc}</div>
              </div>
              {isAdd
                ? <span aria-hidden title="Add (coming soon)" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink-3)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                : <SrcToggle on={on} onClick={() => toggle(o)} />}
            </Tag>
          );
        })}
      </div>
    </StepWrap>
  );
}
function SrcSchedule({ s, set, srcCols, eyebrow }) {
  const v = (k, d) => (s[k] !== undefined ? s[k] : d);
  const pType = v("pipelineType", "realtime");
  const schedType = v("schedType", "interval");
  const ingMode = v("ingestMode", "hist_live");
  const schemaMethod = v("schemaMethod", "manual");
  const lbl2 = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 7 };
  return (
    <StepWrap wide title="Pipeline settings">
      <FormRow label="Pipeline Type" hint="Select the type of pipeline">
        <SrcRichSelect value={pType} onChange={x => set({ pipelineType: x })}
          options={[
            { id: "realtime", title: "Real Time", desc: "Ingests, transforms and loads data to destination in real-time.", icon: SET_ICONS.bolt },
            { id: "scheduled", title: "Scheduled", desc: "Pipeline operates at a recurring schedule.", icon: SET_ICONS.clock },
          ]} />
        {pType === "scheduled" && (
          <div style={{ marginTop: 14 }}>
            <div style={lbl2}>Schedule type *</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[["interval", "Interval"], ["cron", "Cron Expression"]].map(o => { const on = schedType === o[0]; return (
                <button key={o[0]} onClick={() => set({ schedType: o[0] })} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: 9, borderWidth: 1, borderStyle: "solid", borderColor: on ? "var(--ink)" : "var(--line)", background: on ? "var(--bg-canvas)" : "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: on ? 600 : 500, color: "var(--ink)", boxShadow: on ? "0 0 0 2px color-mix(in oklab, var(--ink) 9%, transparent)" : "none" }}>
                  <span style={{ width: 15, height: 15, borderRadius: "50%", border: "1px solid " + (on ? "var(--ink)" : "var(--line)"), background: on ? "var(--ink)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--bg-canvas)" }} />}</span>{o[1]}
                </button>
              ); })}
            </div>
            {schedType === "interval" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 6 }}>
                  <div><div style={lbl2}>Trigger every *</div><input className="winput" value={v("triggerEvery", "15")} onChange={e => set({ triggerEvery: e.target.value })} /></div>
                  <div><div style={lbl2}>Frequency *</div><CustomSelect value={v("frequency", "Minutes")} onChange={x => set({ frequency: x })} options={["Minutes", "Hours", "Days", "Weeks"].map(x => ({ id: x, label: x }))} /></div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginBottom: 14 }}>Define repeating schedule. Enter whole numbers only.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><div style={lbl2}>Starting at *</div><input className="winput" type="datetime-local" value={v("startAt", "")} onChange={e => set({ startAt: e.target.value })} /></div>
                  <div><div style={lbl2}>Ending at</div><input className="winput" type="datetime-local" value={v("endAt", "")} onChange={e => set({ endAt: e.target.value })} /></div>
                </div>
              </>
            ) : (
              <div><div style={lbl2}>Cron expression *</div><input className="winput winput-mono" placeholder="*/15 * * * *" value={v("cron", "")} onChange={e => set({ cron: e.target.value })} /></div>
            )}
          </div>
        )}
      </FormRow>

      <FormRow label="Ingestion Mode" hint="Select the ingestion mode for your data pipeline">
        <SrcRichSelect value={ingMode} onChange={x => set({ ingestMode: x })}
          options={[
            { id: "hist_live", title: "Historical and Live", desc: "Ingest all historical data and process new data in real-time.", icon: SET_ICONS.layers },
            { id: "live", title: "Live only", desc: "Only process new data from connection time onward.", icon: SET_ICONS.live },
            { id: "hist", title: "Historical only", desc: "Backfill existing data once, with no live updates.", icon: SET_ICONS.archive },
          ]} />
      </FormRow>

      <FormRow label="Ingestion Order" optional hint="Sets ingestion order for source objects">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 9, background: "var(--gold-fill)", border: "1px solid var(--gold-soft)", marginBottom: 12 }}>
          <span style={{ color: "var(--gold)", flexShrink: 0, fontSize: 15 }}>⚠</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Applicable for historic data only.</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>(0/3)</div>
        <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 9, border: "1px dashed var(--line)", background: "var(--panel)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--ink-2)" }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--ink-3)" }}>+</span> Add Source Objects</button>
      </FormRow>

      <FormRow label="Capture Raw Records" optional hint="Records with the selected status will be captured in logs.">
        <div style={lbl2}>Status</div>
        <CustomSelect value={v("captureStatus", "Failed")} onChange={x => set({ captureStatus: x })} options={["None", "Failed", "Success", "All"].map(x => ({ id: x, label: x }))} />
      </FormRow>

      <FormRow label="Avoid Duplicate Operations" optional hint="Enable duplicate operations prevention in your destination">
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={!!s.avoidDup} onChange={e => set({ avoidDup: e.target.checked })} style={{ accentColor: "#16341f", width: 15, height: 15, marginTop: 2 }} />
          <span><span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Avoid Duplicate Operations</span><span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.5 }}>Avoid duplicate operations and cyclical writes between pipelines. Checks existing record hashes to ensure one-way data flow.</span></span>
        </label>
      </FormRow>

      <FormRow label="Schema Mapping Method" hint="How destination objects are created or matched">
        <SrcRichSelect value={schemaMethod} onChange={x => set({ schemaMethod: x })}
          options={[
            { id: "manual", title: "Map Manually", desc: "Map selected source objects to existing destination objects.", icon: SET_ICONS.cursor },
            { id: "replicate", title: "Replicate Source", desc: "Creates an exact replica of selected source objects in destination.", icon: SET_ICONS.copy },
          ]} />
      </FormRow>

      <FormRow label="Resource Tier" hint="Select resource tier for pipeline resources" last>
        <CustomSelect value={v("resourceTier", "Small")} onChange={x => set({ resourceTier: x })} options={["Small", "Medium", "Large", "X-Large"].map(x => ({ id: x, label: x }))} />
      </FormRow>
    </StepWrap>
  );
}

// ── Src Step 5: Review ────────────────────────────────────────────────────────

function SrcReview({ s, set, node, sel, mapGroups, mappedCount, totalMapCols, unstructured, readCfg, eyebrow, onClose }) {
  mapGroups = mapGroups || [];
  totalMapCols = totalMapCols != null ? totalMapCols : mapGroups.reduce((a, g) => a + g.cols.length, 0);
  const selectedTables = s.tables || [];
  const readLocs = s.readLocations || [];
  const readFilters = s.readFilters || {};
  const activeFilters = Object.keys(readFilters).filter(k => { const v = readFilters[k]; return Array.isArray(v) ? v.length : (!!v && v !== "all"); });
  const extractFields = s.extractFields || [];
  const readScopeLabel = (s.readScope || "all") === "all" ? "all " + (readCfg ? readCfg.item : "files")
    : (s.readScope === "folders" ? readLocs.length + " " + (readCfg ? readCfg.container : "folders") : readLocs.length + " " + (readCfg ? readCfg.item : "files"));
  const unstructuredYaml = `name: ${node?.id || "node"}_from_${s.system || "source"}
source:
  connector: ${s.system || "?"}
  read:
    scope: ${s.readScope || "all"}
${readLocs.length ? "    locations:\n" + readLocs.map(l => "      - " + l.label).join("\n") + "\n" : ""}${activeFilters.length ? "    filters:\n" + activeFilters.map(k => "      " + k + ": " + (Array.isArray(readFilters[k]) ? "[" + readFilters[k].join(", ") + "]" : readFilters[k])).join("\n") + "\n" : ""}${(s.readStarts || []).length ? "    starting_points: [" + s.readStarts.join(", ") + "]\n" : ""}extract:
  method: ${s.extractMethod || "(skipped)"}
  ${s.extractMethod === "automation" ? "automation: " + (s.extractAutomation || "(none)") : "agent: " + (s.extractAgent || "(none)")}
  output_schema:
${extractFields.length ? extractFields.map(f => "    - name: " + (f.name || "untitled") + "\n      type: " + (f.type || "string") + "\n      description: " + (f.description || "")).join("\n") : "    # (no fields defined)"}
target:
  node_type: ${node?.label?.replace(/\s/g, "") || "Node"}
schedule:`;
  const structuredYaml = `name: ${node?.id || "node"}_from_${s.system || "source"}
source:
  connector: ${s.system || "?"}
  objects: [${selectedTables.join(", ") || "(custom query)"}]
  load_strategy: ${s.loadStrategy}${s.loadStrategy === "incremental" ? "\n  watermark_column: " + s.incrementalCol : ""}
target:
  node_type: ${node?.label?.replace(/\s/g,"") || "Node"}
mapping:
${mapGroups.map(g => "  " + g.name + ":\n" + (g.cols.filter(c => s.mapping[g.name + "::" + c.col]).map(c => "    " + c.col + ": " + s.mapping[g.name + "::" + c.col]).join("\n") || "    # (none mapped)")).join("\n") || "  # (no objects selected)"}
  unmapped_columns: ${s.unmappedPolicy}
schedule:`;
  const yamlHead = unstructured ? unstructuredYaml : structuredYaml;
  const yaml = `${yamlHead}
  cadence: ${s.cadence}
  freshness_slo: ${s.freshnessSLO}
  retry: { count: ${s.retryCount}, delay: ${s.retryDelay} }
  on_error: ${s.onError}
  alert_channel: ${s.alertChannel}
${s.backfill ? `backfill:\n  window: ${s.backfillWindow}` : "# backfill: disabled"}
owner: ${s.owner}`;

  return (
    <StepWrap wide eyebrow={eyebrow || "STEP 6 · REVIEW & PUBLISH"} title="Review pipeline configuration" desc="Once published this pipeline appears in the Sources tab and begins syncing on the configured schedule.">
      <div className="review-grid">
        <section className="card review-summary">
          <div className="card-head">Summary</div>
          <ul className="rev-list">
            {(unstructured ? [
              ["Source",     sel?.name || s.customName],
              ["Scope",      readScopeLabel],
              ["Filters",    activeFilters.length ? activeFilters.length + " active" : "none"],
              ["Extract",    !s.extractMethod ? "skipped" : (s.extractMethod === "automation" ? "Automation" : "Agent") + (s.extractMethod === "automation" ? (s.extractAutomation ? " · " + s.extractAutomation : "") : (s.extractAgent ? " · " + s.extractAgent : ""))],
              ["Schema",     extractFields.length + " field" + (extractFields.length === 1 ? "" : "s")],
              ["Mapped",     mappedCount + " of " + totalMapCols + " fields"],
              ["Settings",   (s.pipelineType === "scheduled" ? "Scheduled" : "Real Time") + " · " + (s.resourceTier || "Small")],
              ["Owner",      s.owner],
            ] : [
              ["Source",    sel?.name || s.customName],
              ["Objects",   selectedTables.length ? selectedTables.length + " · " + selectedTables.join(", ") : "(query)"],
              ["Strategy",  s.loadStrategy + (s.loadStrategy === "incremental" ? " · " + s.incrementalCol : "")],
              ["Mapped",    mappedCount + " of " + totalMapCols + " columns"],
              ["Cadence",   s.cadence],
              ["SLO",       s.freshnessSLO],
              ["On error",  s.onError],
              ["Backfill",  s.backfill ? "on · " + s.backfillWindow : "off"],
              ["Owner",     s.owner],
            ]).map(([k, v], i) => <li key={i}><span className="rev-k">{k}</span><span className="rev-v">{v}</span></li>)}
          </ul>
        </section>

        <section className="card review-target">
          <div className="card-head">Target stage</div>
          <div className="card-body" style={{ padding: "14px 18px" }}>
            <Seg options={["draft","staging","live"]} value={s.stage} onChange={v => set({ stage: v })} />
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-3)", fontFamily: "JetBrains Mono" }}>
              {s.stage === "draft" ? "Config stored — pipeline not started." :
               s.stage === "staging" ? "Runs against staging graph + staging source." :
               "Production source + production graph."}
            </div>
          </div>
        </section>

        <section className="card review-cypher" style={{ gridColumn: "1/-1" }}>
          <div className="card-head card-head-row">
            <div>Pipeline config <span className="card-head-sub">YAML</span></div>
            <div className="card-head-actions"><button className="btn-ghost">Copy</button></div>
          </div>
          <pre className="cypher-block">{yaml}</pre>
        </section>
      </div>
    </StepWrap>
  );
}

// ── Src Preview ───────────────────────────────────────────────────────────────

function SrcPreview({ s, sel, node, srcCols, nodeProps, mappedCount }) {
  const nc = node ? (window.colorForNode?.(node) || { fill: "var(--blue-fill)", stroke: "var(--blue)" }) : { fill: "var(--chip)", stroke: "var(--line)" };
  return (
    <div className="preview-stack">
      <div className="preview-block">
        <div className="preview-head">Validation</div>
        <ul className="preview-checks">
          {[
            [!!s.system, "Source system selected"],
            [!!(s.table || s.query), "Object configured"],
            [!!s.pkCol, "Primary key set"],
            [mappedCount > 0, "At least 1 column mapped"],
            [!!s.freshnessSLO, "Freshness SLO defined"],
          ].map(([ok, label], i) => (
            <li key={i} className={"check " + (ok ? "check-ok" : "check-pend")}><span className="check-dot" /> {label}</li>
          ))}
        </ul>
      </div>
      <div className="preview-block">
        <div className="preview-head">Coverage</div>
        <div className="preview-impact">
          <span className="big-n" style={{ fontSize: 32 }}>{mappedCount}</span>
          <div className="big-n-text">of {srcCols.length} columns mapped<br /><span className="big-n-sub">{srcCols.length - mappedCount} will be ignored</span></div>
        </div>
        <div style={{ padding: "0 14px 12px" }}>
          <div style={{ height: 5, background: "var(--line-2)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: (srcCols.length > 0 ? mappedCount/srcCols.length*100 : 0) + "%", background: "var(--green)", transition: "width 200ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
export { LinkSourceFlow };
export default LinkSourceFlow;

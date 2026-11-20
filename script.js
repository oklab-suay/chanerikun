const $ = (id) => document.getElementById(id);
const manualGroups = {
  "回答内容": [
    "チャネリングした内容をそのまま反映できている",
    "質問から抜き出した「〇〇について」と結論が一致している",
    "潜在意識の段落が結論の深掘り・背景・経緯になっている",
    "集合意識の段落が潜在意識の単なる続きではなく、気づき・学び・お役目を伝えている",
    "クライアント様に合わせた具体的な表現やアクションが含まれている",
    "回答全体に一貫性があり、主観・感情・個人的価値観や不要な応援メッセージが混ざっていない"
  ],
  "読みやすさ・正確さ": [
    "質問内容を「〇〇について」に簡潔に抜き出せている",
    "結論が読みやすい2〜3行にまとまっている",
    "各段落の内容が読みやすく、改行位置が文意を妨げていない",
    "誤字脱字がない",
    "クライアント様のお名前が正しい（原文と照合）"
  ],
  "送信": [
    "指定された回答期限内に送信できる（パターン①は翌日23:59まで、パターン②は基本24時間以内。実際の期限を確認）"
  ]
};

for (const [group, items] of Object.entries(manualGroups)) {
  const box = document.createElement("div"); box.className = "manual-group";
  const heading = document.createElement("h3"); heading.textContent = group; box.append(heading);
  for (const item of items) {
    const label = document.createElement("label"); label.className = "manual-item";
    const input = document.createElement("input"); input.type = "checkbox";
    const span = document.createElement("span"); span.textContent = item;
    label.append(input, span); box.append(label);
  }
  $("manual-list").append(box);
}

function check(answer) {
  const text = answer.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const sections = ["潜在意識によると", "集合意識からのメッセージ"];
  const p = text.indexOf(sections[0]);
  const c = text.indexOf(sections[1]);
  const conclusion = p >= 0 ? text.slice(0, p) : text;
  const collective = c >= 0 ? text.slice(c + sections[1].length) : "";
  const items = [];
  const add = (ok, title, detail) => items.push({ok, title, detail});
  add(/^\s*【\s*[0-9０-９一二三四五六七八九十〇○]+\s*問目の回答\s*】/.test(text), "冒頭の問数", "冒頭に【1問目の回答】のような表記を入れてください。");
  add(/[^\n]+について/.test(conclusion), "質問の主題", "質問を簡潔に抜き出し、「〇〇について」と記載してください。");
  add(p >= 0 && c > p, "基本構文の順序", "結論 → 潜在意識によると → 集合意識からのメッセージ、の順にしてください。");
  add(p >= 0 && /(?:^|\n)\s*潜在意識によると/.test(text), "潜在意識の書き出し", "段落を「潜在意識によると」から始めてください。");
  add(c >= 0 && /(?:^|\n)\s*集合意識からのメッセージ/.test(text), "集合意識の書き出し", "段落を「集合意識からのメッセージ」から始めてください。");
  add(c >= 0 && /キーワード\s*[「『][^」』\n]+[」』]/.test(collective), "キーワード", "集合意識の段落の冒頭に、キーワード「〇〇」を入れてください。");
  add(c >= 0 && /とメッセージが届いています[\s。]*$/.test(collective), "集合意識の文末", "最後を「〜とメッセージが届いています」にしてください。");
  const conclusionLines = conclusion.split("\n").map(x=>x.trim()).filter(x=>x && !/^【.*問目の回答】$/.test(x) && !/について$/.test(x) && x !== "結論");
  add(conclusionLines.length > 0 && /となります[\s。]*$/.test(conclusionLines.at(-1)), "結論の文末", "パターン②では、結論の文末を「〜となります」に統一します。");
  const body = lines.filter(line => !/^\s*(【.*問目の回答】|.*について|潜在意識によると|集合意識からのメッセージ|キーワード[「『])/.test(line));
  const subjective = body.map((line,i) => ({line:line.trim(), i})).filter(x => /(?:と思います|でしょう|です|ます)(?:[。！!\s]*)$/.test(x.line) && !/(?:となります|届いています)(?:[。！!\s]*)$/.test(x.line));
  add(subjective.length === 0, "主観的な語尾", subjective.length ? `該当候補：${subjective.slice(0,3).map(x=>x.line).join(" ／ ")}` : "「〜です」「〜ます」「〜と思います」「〜でしょう」で終わる文を確認してください。");
  const marks = [...text.matchAll(/[♪☆★！!・。]/g)].map(m=>m[0]);
  add(marks.length === 0, "記号", marks.length ? `使用候補：${[...new Set(marks)].join(" ")}。パターン②では句点「。」も使用しないルールです。` : "顔文字・装飾記号・中黒・句点の使用を確認してください。");
  const quotes = [...text.matchAll(/[「」『』]/g)].map(m=>m.index);
  const keywordMatch = /キーワード\s*[「『][^」』\n]+[」』]/g;
  const allowed = new Set(); for (const m of text.matchAll(keywordMatch)) for(let i=m.index;i<m.index+m[0].length;i++) allowed.add(i);
  add(quotes.every(i=>allowed.has(i)), "カギかっこ", "パターン②では、カギかっこは集合意識のキーワードにのみ使用できます。");
  const repeated = /(となります|と視えました|とイメージがきました)(?:[。\s]*)\n[^\n]*(?:\1)/.test(text);
  add(!repeated, "語尾の連続", "同じ語尾が近い行に続いていないか確認してください。");
  add(!/(応援しています|いつもありがとうございます)/.test(text), "定型的な応援メッセージ", "「応援しています」「いつもありがとうございます」などを含めないでください。");
  const blocks = text.trim().split(/\n\s*\n+/).map(block => block.split("\n").filter(line => line.trim()).length);
  const standard = blocks.length >= 3 && blocks.length <= 4 && blocks.every(n => n >= 4 && n <= 5);
  add(standard, "改行とブロック数", `現在は${blocks.length}ブロック（各${blocks.join("・")}行）です。目安は4〜5行のブロックを3〜4つです。見出しや短い結論がある場合は、実際の読みやすさも確認してください。`);
  return items;
}

$("check").addEventListener("click", () => {
  const answer = $("answer").value.trim();
  if (!answer) { $("answer").focus(); $("answer").setCustomValidity("回答を入力してください"); $("answer").reportValidity(); return; }
  $("answer").setCustomValidity("");
  const items = check(answer), issues = items.filter(x=>!x.ok).length;
  $("summary").textContent = `${items.length}項目を確認：${issues}件の確認候補があります`;
  const area = $("findings"); area.replaceChildren();
  for (const item of items) {
    const el = document.createElement("div"); el.className = `finding${item.ok ? " ok" : ""}`;
    const title = document.createElement("strong"); title.textContent = `${item.ok ? "確認済み" : "要確認"}｜${item.title}`;
    el.append(title); if (!item.ok) { const p = document.createElement("p"); p.textContent = item.detail; el.append(p); }
    area.append(el);
  }
  $("results").hidden = false; $("results").scrollIntoView({behavior:"smooth",block:"start"});
});
$("answer").addEventListener("input", () => $("answer").setCustomValidity(""));
$("clear").addEventListener("click", () => { $("question").value=""; $("answer").value=""; $("results").hidden=true; document.querySelectorAll('.manual-item input').forEach(x=>x.checked=false); $("answer").focus(); });

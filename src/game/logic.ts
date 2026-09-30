// All place-value arrays are ordered: ones, tens, hundreds.
export type Digits = [number, number, number];
export type Place = 0 | 1 | 2;
export type Question = { top: number; bottom: number };
export type Blocks = { remaining: Digits; sent: Digits };
export const placeNames = ['個位', '十位', '百位'];
export const unitNames = ['個', '條', '片'];
export const values = [1, 10, 100];

export const chapters = [
  {
    name: '暖陽小徑',
    skill: '不退位減法',
    friend: '小狐狸',
    item: '顆松果',
    title: '一起準備野餐吧！',
    story: '小狐狸收集了一些松果，想分給來野餐的朋友。',
    thanks: '有你幫忙，大家的野餐籃都準備好了！',
    color: 'green',
    badge: '暖心小幫手',
    questions: [
      { top: 365, bottom: 142 },
      { top: 486, bottom: 253 },
      { top: 759, bottom: 326 },
    ],
  },
  {
    name: '蘑菇森林',
    skill: '一次退位',
    friend: '小兔子',
    item: '顆種子',
    title: '幫花園種下新希望',
    story: '小兔子要把種子分給鄰居，一起種出五彩繽紛的花園。',
    thanks: '每一顆種子，都會長成我們一起努力的樣子。',
    color: 'orange',
    badge: '換一換達人',
    questions: [
      { top: 432, bottom: 217 },
      { top: 562, bottom: 138 },
      { top: 653, bottom: 281 },
    ],
  },
  {
    name: '星光溪谷',
    skill: '連續退位',
    friend: '小熊',
    item: '顆星星石',
    title: '把小小星光送出去',
    story: '小熊找到好多星星石，要送一些給朋友，照亮回家的路。',
    thanks: '你願意慢慢想，讓這條小路亮起來了。',
    color: 'blue',
    badge: '耐心探索家',
    questions: [
      { top: 532, bottom: 278 },
      { top: 641, bottom: 356 },
      { top: 723, bottom: 468 },
    ],
  },
  {
    name: '雲朵樹屋',
    skill: '跨零退位',
    friend: '小貓頭鷹',
    item: '張邀請卡',
    title: '邀請朋友來樹屋玩',
    story: '小貓頭鷹準備了邀請卡，要送給森林裡的朋友們。',
    thanks: '就算遇到 0，你也找到方法了。樹屋永遠歡迎你！',
    color: 'pink',
    badge: '勇敢小冒險家',
    questions: [
      { top: 402, bottom: 176 },
      { top: 600, bottom: 248 },
      { top: 703, bottom: 457 },
    ],
  },
] as const;

export function digits(n: number): Digits {
  return [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100)];
}
export function total(d: Digits): number {
  return d.reduce((sum, value, index) => sum + value * values[index], 0);
}
export function initialBlocks(question: Question): Blocks {
  return { remaining: digits(question.top), sent: [0, 0, 0] };
}
export function canSend(
  state: Blocks,
  question: Question,
  place: Place,
): boolean {
  return (
    state.remaining[place] > 0 &&
    state.sent[place] < digits(question.bottom)[place]
  );
}
export function sendBlock(
  state: Blocks,
  question: Question,
  place: Place,
): Blocks {
  if (!canSend(state, question, place)) return state;
  const remaining: Digits = [...state.remaining];
  const sent: Digits = [...state.sent];
  remaining[place]--;
  sent[place]++;
  return { remaining, sent };
}
export function canExchange(
  state: Blocks,
  question: Question,
  from: 1 | 2,
): boolean {
  const target = digits(question.bottom);
  // A hundred can be needed indirectly when a zero in the tens blocks the ones.
  const lowerNeeds =
    state.remaining[from - 1] < target[from - 1] - state.sent[from - 1];
  const zeroBridge =
    from === 2 &&
    state.remaining[1] === 0 &&
    state.remaining[0] < target[0] - state.sent[0];
  return state.remaining[from] > 0 && (lowerNeeds || zeroBridge);
}
export function exchange(
  state: Blocks,
  question: Question,
  from: 1 | 2,
): Blocks {
  if (!canExchange(state, question, from)) return state;
  const remaining: Digits = [...state.remaining];
  remaining[from]--;
  remaining[from - 1] += 10;
  return { remaining, sent: [...state.sent] };
}
export function isDelivered(state: Blocks, question: Question): boolean {
  return total(state.sent) === question.bottom;
}
export function hint(state: Blocks, question: Question): string {
  const target = digits(question.bottom);
  for (const place of [0, 1, 2] as Place[]) {
    const needed = target[place] - state.sent[place];
    if (needed === 0) continue;
    if (state.remaining[place] < needed) {
      if (place === 0 && state.remaining[1] === 0)
        return '個位不夠，十位又是 0。先把 1 片百位換成 10 條十位，再把 1 條換成 10 個。總量不會改變喔！';
      return `${placeNames[place]}還要送出 ${needed} ${unitNames[place]}，現在只有 ${state.remaining[place]} ${unitNames[place]}。試試把左邊的 1 ${unitNames[place + 1]}，換成這邊的 10 ${unitNames[place]}。`;
    }
    return `從${placeNames[place]}開始看看：還要送出 ${needed} ${unitNames[place]}。點積木或「送出 1 ${unitNames[place]}」，觀察剩下多少。`;
  }
  return `都送好了！數一數剩下 ${state.remaining[2]} 個百、${state.remaining[1]} 個十、${state.remaining[0]} 個一，合起來是多少？`;
}
export function answerHint(answer: string, question: Question): string {
  if (!/^\d{1,3}$/.test(answer))
    return '先在格子裡寫下你的想法，或動手試試積木吧。';
  const actual = question.top - question.bottom;
  const input = Number(answer);
  if (input === actual) return '';
  if (input >= question.top)
    return '減掉一些之後，應該比原來少喔。先看看個位要送出多少？';
  const given = digits(input);
  const expected = digits(actual);
  const place = ([0, 1, 2] as Place[]).find((p) => given[p] !== expected[p])!;
  return `謝謝你勇敢試了一次。我們再一起看看${placeNames[place]}，用積木換一換、數一數。你的努力會幫你找到答案。`;
}

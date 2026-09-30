import { describe, expect, it } from 'vitest';
import {
  answerHint,
  canExchange,
  canSend,
  chapters,
  digits,
  exchange,
  hint,
  initialBlocks,
  isDelivered,
  sendBlock,
  total,
} from './logic';
import type { Blocks, Place, Question } from './logic';

function finishDelivery(question: Question, reverse = false) {
  let state = initialBlocks(question);
  for (let step = 0; step < 40 && !isDelivered(state, question); step++) {
    const places: Place[] = reverse ? [2, 1, 0] : [0, 1, 2];
    const place = places.find((p) => canSend(state, question, p));
    if (place !== undefined) state = sendBlock(state, question, place);
    else if (canExchange(state, question, 1))
      state = exchange(state, question, 1);
    else if (canExchange(state, question, 2))
      state = exchange(state, question, 2);
    else
      throw new Error(
        `Delivery is stuck: ${JSON.stringify({ question, state })}`,
      );
    expect(total(state.remaining) + total(state.sent)).toBe(question.top);
    expect(state.remaining.every((n) => n >= 0)).toBe(true);
  }
  expect(isDelivered(state, question)).toBe(true);
  expect(total(state.remaining)).toBe(question.top - question.bottom);
  return state;
}

describe('place-value exchange and subtraction', () => {
  it('represents zero and three-digit numbers exactly', () => {
    for (let value = 0; value <= 999; value++)
      expect(total(digits(value))).toBe(value);
  });

  it('exchanges across a zero without changing the amount or prior state', () => {
    const question = { top: 402, bottom: 176 };
    const initial = initialBlocks(question);
    expect(canExchange(initial, question, 1)).toBe(false);
    const tens = exchange(initial, question, 2);
    expect(tens.remaining).toEqual([2, 10, 3]);
    const ones = exchange(tens, question, 1);
    expect(ones.remaining).toEqual([12, 9, 3]);
    expect(total(ones.remaining)).toBe(402);
    expect(initial.remaining).toEqual([2, 0, 4]);
    expect(tens.remaining).toEqual([2, 10, 3]);
    expect(finishDelivery(question).remaining).toEqual([6, 2, 2]);
  });

  it('prevents unnecessary exchange, empty sending, and excess delivery', () => {
    const question = { top: 300, bottom: 100 };
    const state = initialBlocks(question);
    expect(exchange(state, question, 2)).toBe(state);
    expect(sendBlock(state, question, 0)).toBe(state);
    const done = sendBlock(state, question, 2);
    expect(sendBlock(done, question, 2)).toBe(done);
    expect(state.remaining).toEqual([0, 0, 3]);
  });

  it.each(chapters.flatMap<Question>((chapter) => [...chapter.questions]))(
    'completes $top − $bottom in either delivery order',
    (question) => {
      finishDelivery(question);
      finishDelivery(question, true);
    },
  );

  it('handles equality, small answers, and repeated zeros', () => {
    for (const question of [
      { top: 100, bottom: 100 },
      { top: 500, bottom: 499 },
      { top: 900, bottom: 101 },
      { top: 909, bottom: 808 },
    ])
      finishDelivery(question);
  });

  it('conserves quantity for 2,000 varied three-digit problems', () => {
    let seed = 7249;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 2000; i++) {
      const top = 100 + Math.floor(random() * 900);
      const bottom = 100 + Math.floor(random() * (top - 99));
      finishDelivery({ top, bottom }, i % 2 === 0);
    }
  });
});

describe('supportive feedback', () => {
  it('guides the zero bridge before suggesting a tens exchange', () => {
    const question = { top: 402, bottom: 176 };
    expect(hint(initialBlocks(question), question)).toContain('先把 1 片百位');
    expect(
      hint(exchange(initialBlocks(question), question, 2), question),
    ).toContain('10 個');
  });
  it('explains how to count the remaining quantities after delivery', () => {
    const question = { top: 365, bottom: 142 };
    const delivered: Blocks = { remaining: [3, 2, 2], sent: [2, 4, 1] };
    expect(hint(delivered, question)).toContain('2 個百、2 個十、3 個一');
  });
  it('accepts a correct answer and guides wrong or missing answers', () => {
    const question = { top: 402, bottom: 176 };
    expect(answerHint('226', question)).toBe('');
    expect(answerHint('', question)).toContain('先在格子裡');
    expect(answerHint('abc', question)).toContain('先在格子裡');
    expect(answerHint('999', question)).toContain('比原來少');
    expect(answerHint('236', question)).toContain('十位');
    expect(answerHint('225', question)).toContain('個位');
  });
});

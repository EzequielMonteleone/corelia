import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {chunkText} from './chunkText.js';

describe('chunkText', () => {
  it('keeps a short amenity rule in one chunk', () => {
    const chunks = chunkText('El SUM se reserva de a una hora. Traer las llaves.');
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0]?.ordinal, 0);
    assert.equal(chunks[0]?.heading, null);
  });

  it('splits a long bylaw on article boundaries', () => {
    const articleOne = `Artículo 1. Mascotas\n${'Los perros deben ir con correa. '.repeat(40)}`;
    const articleTwo = `Artículo 2. Horarios\n${'La pileta cierra a las 21. '.repeat(40)}`;
    const chunks = chunkText(`${articleOne}\n${articleTwo}`);
    assert.ok(chunks.length >= 2);
    const headings = chunks.map(chunk => chunk.heading);
    assert.ok(headings.includes('Artículo 1. Mascotas'));
    assert.ok(headings.includes('Artículo 2. Horarios'));
    for (const chunk of chunks) {
      if (chunk.heading === 'Artículo 1. Mascotas') {
        assert.equal(chunk.content.includes('Artículo 2'), false);
      }
      if (chunk.heading === 'Artículo 2. Horarios') {
        assert.equal(chunk.content.includes('Artículo 1'), false);
      }
    }
  });

  it('overlaps paragraphs when a section is longer than the limit', () => {
    const paragraph = `${'Horario de uso del salón. '.repeat(30)}\n\n`;
    const body = `Artículo 4. Salón\n${paragraph.repeat(6)}`;
    const chunks = chunkText(body);
    assert.ok(chunks.length >= 2);
    const first = chunks[0]?.content ?? '';
    const second = chunks[1]?.content ?? '';
    const tail = first.slice(-80);
    assert.ok(tail.length > 0);
    assert.equal(second.includes(tail.trim().slice(-40)), true);
  });
});

import { escapeHtml } from '../helpers/escape-html';

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape angle brackets (prevents HTML injection)', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should escape double and single quotes', () => {
    expect(escapeHtml('He said "hello" & she said \'hi\'')).toBe(
      'He said &quot;hello&quot; &amp; she said &#039;hi&#039;'
    );
  });

  it('should return the same string when there are no special characters', () => {
    const plain = 'Bonjour, comment allez-vous ?';
    expect(escapeHtml(plain)).toBe(plain);
  });

  it('should handle an empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle strings with multiple consecutive special characters', () => {
    expect(escapeHtml('<<>>')).toBe('&lt;&lt;&gt;&gt;');
    expect(escapeHtml('&&&&')).toBe('&amp;&amp;&amp;&amp;');
  });

  it('should not double-escape already escaped content', () => {
    // If someone passes already-escaped content, it should escape the ampersands again
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});

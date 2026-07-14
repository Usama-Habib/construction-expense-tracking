export const sanitizeRichText = (html = '') => {
  if (!html || typeof html !== 'string') return '';

  const withoutScripts = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  const allowedTags = /<(\/?)(b|strong|i|em|u|ul|ol|li|p|br|div|span)>/gi;
  return withoutScripts.replace(/<[^>]*>/g, (tag) => (tag.match(allowedTags) ? tag : ''));
};

export const richTextToPlainText = (html = '') => {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

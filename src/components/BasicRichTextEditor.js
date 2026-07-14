import React, { useEffect, useRef } from 'react';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { sanitizeRichText } from '../utils/richTextUtils';

const BasicRichTextEditor = ({ value, onChange, placeholder = 'Write notes...' }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const safeValue = sanitizeRichText(value || '');
    if (editorRef.current.innerHTML !== safeValue) {
      editorRef.current.innerHTML = safeValue;
    }
  }, [value]);

  const runCommand = (command) => {
    document.execCommand(command, false, null);
    if (editorRef.current) {
      onChange(sanitizeRichText(editorRef.current.innerHTML));
      editorRef.current.focus();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(sanitizeRichText(editorRef.current.innerHTML));
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tooltip title="Bold">
          <IconButton size="small" onClick={() => runCommand('bold')}>
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton size="small" onClick={() => runCommand('italic')}>
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <IconButton size="small" onClick={() => runCommand('underline')}>
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Bullet List">
          <IconButton size="small" onClick={() => runCommand('insertUnorderedList')}>
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton size="small" onClick={() => runCommand('insertOrderedList')}>
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        sx={{
          minHeight: 110,
          maxHeight: 240,
          overflowY: 'auto',
          p: 1.25,
          fontSize: '0.95rem',
          lineHeight: 1.5,
          '&:focus': {
            outline: 'none',
            backgroundColor: '#fafcff',
          },
          '&:empty:before': {
            content: `'${placeholder}'`,
            color: 'text.disabled',
          },
        }}
      />
    </Paper>
  );
};

export default BasicRichTextEditor;

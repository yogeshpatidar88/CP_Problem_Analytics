import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

const CodeEditor = ({ onBackToHome }) => {
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef(null);

  // Default code templates
  const templates = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
typedef vector<int> vi;
typedef vector<ll> vll;
typedef pair<int, int> pii;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL);
#define all(x) (x).begin(), (x).end()
#define sz(x) (int)(x).size()
#define pb push_back
#define mp make_pair
#define fi first
#define se second

void solve() {
    // Your solution here
    
}

int main() {
    fast_io;
    
    int t = 1;
    // cin >> t;  // Uncomment for multiple test cases
    
    while (t--) {
        solve();
    }
    
    return 0;
}`,
    python: `#!/usr/bin/env python3
"""
Competitive Programming Template
Author: Your Name
"""

import sys
import math
from collections import defaultdict, deque, Counter
from itertools import combinations, permutations, product
from bisect import bisect_left, bisect_right
from heapq import heappush, heappop, heapify

# Fast I/O
input = sys.stdin.readline

def solve():
    """
    Main solution function
    """
    # Your solution here
    pass

def main():
    """
    Main function with multiple test cases support
    """
    t = 1
    # t = int(input())  # Uncomment for multiple test cases
    
    for _ in range(t):
        solve()

if __name__ == "__main__":
    main()`
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Set up custom themes
    monaco.editor.defineTheme('modern-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '7C3AED', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60A5FA', fontStyle: 'bold' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'F472B6' },
        { token: 'type', foreground: 'A78BFA' },
        { token: 'function', foreground: 'FBBF24' },
        { token: 'variable', foreground: 'E2E8F0' },
        { token: 'operator', foreground: 'F87171' },
        { token: 'delimiter', foreground: '94A3B8' },
      ],
      colors: {
        'editor.background': '#0F172A',
        'editor.foreground': '#E2E8F0',
        'editorLineNumber.foreground': '#64748B',
        'editorLineNumber.activeForeground': '#3B82F6',
        'editor.selectionBackground': '#1E40AF40',
        'editor.selectionHighlightBackground': '#3B82F630',
        'editorCursor.foreground': '#F472B6',
        'editor.lineHighlightBackground': '#1E293B20',
        'editorIndentGuide.background': '#334155',
        'editorIndentGuide.activeBackground': '#6366F1',
        'editor.wordHighlightBackground': '#7C3AED20',
        'editor.wordHighlightStrongBackground': '#7C3AED30',
        'editorBracketMatch.background': '#3B82F640',
        'editorBracketMatch.border': '#3B82F6',
      }
    });
    
    monaco.editor.setTheme('modern-dark');
    
    // Add custom key bindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!isRunning) {
        runCode();
      }
    });
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(templates[newLanguage] || '');
    setOutput('');
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    
    try {
      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          code,
          input
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOutput(result.output);
      } else {
        setOutput(`Error: ${result.error}`);
      }
    } catch (error) {
      setOutput(`Network Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    setCode(templates[language] || '');
    setInput('');
    setOutput('');
  };

  const downloadCode = () => {
    const extension = language === 'cpp' ? '.cpp' : '.py';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Initialize with default template
  React.useEffect(() => {
    setCode(templates[language]);
  }, []);

  return (
    <div className="code-editor-container">
      <div className="editor-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBackToHome}>
            Back to Home
          </button>
          <h2>Advanced Code Editor</h2>
        </div>
        
        <div className="header-controls">
          <select 
            className="language-selector"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <option value="cpp">C++ 🚀</option>
            <option value="python">Python 🐍</option>
          </select>
          
          <button className="control-btn reset-btn" onClick={resetCode} title="Reset Code">
            Reset
          </button>
          
          <button className="control-btn download-btn" onClick={downloadCode} title="Download Code">
            Download
          </button>
          
          <button 
            className="control-btn run-btn"
            onClick={runCode}
            disabled={isRunning}
            title="Run Code (Ctrl+Enter)"
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>📝 Code Editor ({language.toUpperCase()})</h3>
          </div>
          <div className="editor-wrapper">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : 'python'}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 16,
                fontWeight: '500',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
                minimap: { 
                  enabled: true,
                  side: 'right',
                  size: 'proportional',
                  showSlider: 'always'
                },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                selectOnLineNumbers: true,
                bracketMatching: 'always',
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: true,
                renderWhitespace: 'selection',
                showFoldingControls: 'always',
                foldingHighlight: true,
                unfoldOnClickAfterEndOfLine: true,
                mouseWheelZoom: true,
                padding: { top: 20, bottom: 20 },
                lineHeight: 24,
                letterSpacing: 0.5,
                roundedSelection: true,
                scrollbar: {
                  verticalScrollbarSize: 14,
                  horizontalScrollbarSize: 14,
                  arrowSize: 30
                },
                find: {
                  seedSearchStringFromSelection: 'always',
                  autoFindInSelection: 'always'
                },
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                  showFunctions: true,
                  showConstants: true,
                  showVariables: true
                }
              }}
            />
          </div>
        </div>

        <div className="io-panel">
          <div className="input-section">
            <div className="panel-header">
              <h3>📥 Input</h3>
            </div>
            <textarea
              className="io-textarea input-area"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your test input here...
Example:
5
1 2 3 4 5"
            />
          </div>

          <div className="output-section">
            <div className="panel-header">
              <h3>📤 Output</h3>
            </div>
            <div className="io-textarea output-area">
              <pre>{output || `💡 Output will appear here...

⌨️  Keyboard Shortcuts:
• Ctrl+Enter: Run Code
• Ctrl+F: Find
• Ctrl+H: Replace
• Ctrl+/: Toggle Comment
• Alt+↑/↓: Move Line
• Shift+Alt+↑/↓: Copy Line
• Ctrl+D: Select Next Occurrence`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
